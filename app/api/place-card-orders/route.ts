import { NextResponse } from "next/server";
import { sendNewInquiryEmail } from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/requireUser";

const MAX_NAMES = 200;
const MAX_NAME_LENGTH = 100;
const MAX_CUSTOMER_NAME_LENGTH = 120;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

function normalizeNames(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const names = value
    .filter((name): name is string => typeof name === "string")
    .map((name) => name.trim())
    .filter(Boolean);

  if (
    names.length === 0 ||
    names.length > MAX_NAMES ||
    names.some((name) => name.length > MAX_NAME_LENGTH)
  ) {
    return null;
  }

  return names;
}

export async function GET(request: Request) {
  try {
    const authResult = await requireUser(request);
    if (authResult instanceof NextResponse) return authResult;

    const customerEmail = authResult.user.email?.trim().toLowerCase();
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Kontoen mangler e-postadresse." },
        { status: 400 },
      );
    }

    await prisma.placeCardOrder.updateMany({
      where: {
        userId: null,
        customerEmail: { equals: customerEmail, mode: "insensitive" },
      },
      data: { userId: authResult.user.id },
    });

    const orders = await prisma.placeCardOrder.findMany({
      where: { userId: authResult.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        names: true,
        quantity: true,
        status: true,
        estimatedPrice: true,
        deliveryEstimate: true,
        confirmedAt: true,
        createdAt: true,
        updatedAt: true,
        customerUpdatedAt: true,
        product: { select: { name: true } },
      },
    });

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id.toString(),
        names: order.names.split("\n").filter(Boolean),
        quantity: order.quantity,
        status: order.status,
        estimatedPrice: order.estimatedPrice,
        deliveryEstimate: order.deliveryEstimate,
        confirmedAt: order.confirmedAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        customerUpdatedAt: order.customerUpdatedAt?.toISOString() ?? null,
        productName: order.product.name,
      })),
    );
  } catch (error) {
    console.error("Failed to load place card inquiries:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente forespørslene. Prøv igjen senere." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const hasAuthorization = Boolean(request.headers.get("authorization"));
  const authResult = hasAuthorization ? await requireUser(request) : null;
  if (authResult instanceof NextResponse) return authResult;

  let body: {
    productId?: unknown;
    names?: unknown;
    customerEmail?: unknown;
    customerName?: unknown;
    website?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  if (typeof body.productId !== "string" || !Array.isArray(body.names)) {
    return NextResponse.json(
      { error: "Produkt og navn er påkrevd." },
      { status: 400 },
    );
  }

  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ success: true });
  }

  const names = normalizeNames(body.names);
  if (!names) {
    return NextResponse.json(
      {
        error: `Legg inn 1-${MAX_NAMES} navn, maks ${MAX_NAME_LENGTH} tegn per navn.`,
      },
      { status: 400 },
    );
  }

  const productId = body.productId;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      productId,
    )
  ) {
    return NextResponse.json({ error: "Ugyldig produkt." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { active: true, category: true, name: true },
  });
  if (
    !product?.active ||
    product.category.trim().toLowerCase() !== "bordkort"
  ) {
    return NextResponse.json(
      { error: "Produktet er ikke tilgjengelig." },
      { status: 404 },
    );
  }

  const customerEmail = (
    authResult?.user.email ??
    (typeof body.customerEmail === "string" ? body.customerEmail : "")
  )
    .trim()
    .toLowerCase();
  if (!EMAIL_PATTERN.test(customerEmail) || customerEmail.length > 254) {
    return NextResponse.json(
      { error: "Oppgi en gyldig e-postadresse." },
      { status: 400 },
    );
  }
  const submittedName =
    typeof body.customerName === "string" ? body.customerName.trim() : "";
  const accountName =
    authResult?.user.user_metadata.full_name ??
    authResult?.user.user_metadata.name ??
    "";
  const customerName = String(submittedName || accountName).trim();
  if (!customerName || customerName.length > MAX_CUSTOMER_NAME_LENGTH) {
    return NextResponse.json(
      { error: "Oppgi navnet ditt, maks 120 tegn." },
      { status: 400 },
    );
  }

  const recentInquiryCount = await prisma.placeCardOrder.count({
    where: {
      customerEmail: { equals: customerEmail, mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentInquiryCount >= 5) {
    return NextResponse.json(
      { error: "For mange forespørsler på kort tid. Prøv igjen senere." },
      { status: 429 },
    );
  }

  const order = await prisma.placeCardOrder.create({
    data: {
      userId: authResult?.user.id ?? null,
      customerEmail,
      customerName,
      productId,
      names: names.join("\n"),
      quantity: names.length,
    },
    select: { id: true },
  });

  const origin = new URL(request.url).origin;
  try {
    await sendNewInquiryEmail({
      inquiryId: order.id.toString(),
      customerName,
      customerEmail,
      productName: product.name,
      quantity: names.length,
      adminUrl: `${origin}/admin/bestillinger/${order.id}`,
    });
  } catch (error) {
    console.error("Failed to send inquiry email:", error);
  }

  return NextResponse.json({
    success: true,
    orderId: order.id.toString(),
    requiresEmailVerification: !authResult,
  });
}

export async function PATCH(request: Request) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: { orderId?: unknown; names?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  if (typeof body.orderId !== "string") {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  let orderId: bigint;
  try {
    orderId = BigInt(body.orderId);
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  if (body.action === "approve-offer") {
    const result = await prisma.placeCardOrder.updateMany({
      where: {
        id: orderId,
        userId: authResult.user.id,
        status: "estimated",
        estimatedPrice: { not: null },
        deliveryEstimate: { not: null },
      },
      data: { status: "approved", updatedAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Tilbudet finnes ikke eller er allerede behandlet." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, status: "approved" });
  }

  const names = normalizeNames(body.names);
  if (!names) {
    return NextResponse.json(
      {
        error: `Legg inn 1-${MAX_NAMES} navn, maks ${MAX_NAME_LENGTH} tegn per navn.`,
      },
      { status: 400 },
    );
  }

  const result = await prisma.placeCardOrder.updateMany({
    where: { id: orderId, userId: authResult.user.id, status: "new" },
    data: {
      names: names.join("\n"),
      quantity: names.length,
      updatedAt: new Date(),
      customerUpdatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Forespørselen finnes ikke eller kan ikke lenger endres." },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true, quantity: names.length });
}
