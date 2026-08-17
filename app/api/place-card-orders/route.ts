import { NextResponse } from "next/server";
import { sendNewInquiryEmail } from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/requireUser";
import { signImageUrl } from "../../lib/storage";

const MAX_NAMES = 200;
const MAX_NAME_LENGTH = 100;
const MAX_CUSTOMER_NAME_LENGTH = 120;
const MAX_COMMENT_LENGTH = 2000;
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

function normalizeSubmission(value: unknown, inputMode: string) {
  if (inputMode === "name_list") return normalizeNames(value);
  if (!Array.isArray(value) || value.length !== 1) return null;

  const submission = typeof value[0] === "string" ? value[0].trim() : "";
  const maxLength =
    inputMode === "single_name" ? MAX_NAME_LENGTH : MAX_COMMENT_LENGTH;
  return submission.length > 0 && submission.length <= maxLength
    ? [submission]
    : null;
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
        inputMode: true,
        names: true,
        quantity: true,
        customDimensions: true,
        customBudget: true,
        desiredDeliveryDate: true,
        status: true,
        estimatedPrice: true,
        deliveryEstimate: true,
        confirmedAt: true,
        cancellationReason: true,
        createdAt: true,
        updatedAt: true,
        customerUpdatedAt: true,
        attachments: true,
        messages: { orderBy: { createdAt: "asc" } },
        product: { select: { name: true } },
      },
    });

    if (orders.length > 0) {
      await prisma.orderMessage.updateMany({
        where: {
          orderId: { in: orders.map((order) => order.id) },
          senderRole: "admin",
          customerReadAt: null,
        },
        data: { customerReadAt: new Date() },
      });
    }

    return NextResponse.json(
      await Promise.all(
        orders.map(async (order) => ({
          id: order.id.toString(),
          inputMode: order.inputMode,
          names: order.names.split("\n").filter(Boolean),
          quantity: order.quantity,
          customDimensions: order.customDimensions,
          customBudget: order.customBudget,
          desiredDeliveryDate:
            order.desiredDeliveryDate?.toISOString().slice(0, 10) ?? null,
          status: order.status,
          estimatedPrice: order.estimatedPrice,
          deliveryEstimate: order.deliveryEstimate,
          confirmedAt: order.confirmedAt?.toISOString() ?? null,
          cancellationReason: order.cancellationReason,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          customerUpdatedAt: order.customerUpdatedAt?.toISOString() ?? null,
          messages: order.messages.map((message) => ({
            id: message.id,
            senderRole: message.senderRole,
            body: message.body,
            createdAt: message.createdAt.toISOString(),
          })),
          attachments: await Promise.all(
            order.attachments.map(async (attachment) => ({
              id: attachment.id,
              fileName: attachment.fileName,
              contentType: attachment.contentType,
              sizeBytes: attachment.sizeBytes,
              url: await signImageUrl(
                attachment.objectKey,
                "inquiry-attachments",
                60 * 60,
              ),
            })),
          ),
          productName: order.product.name,
        })),
      ),
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
      { error: "Produkt og innhold er påkrevd." },
      { status: 400 },
    );
  }

  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ success: true });
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
    select: { active: true, inquiryInputMode: true, name: true },
  });
  if (!product?.active) {
    return NextResponse.json(
      { error: "Produktet er ikke tilgjengelig." },
      { status: 404 },
    );
  }
  if (product.inquiryInputMode === "custom_order") {
    return NextResponse.json(
      { error: "Spesialbestillingen må sendes med det utvidede skjemaet." },
      { status: 400 },
    );
  }
  const submission = normalizeSubmission(body.names, product.inquiryInputMode);
  if (!submission) {
    const error =
      product.inquiryInputMode === "name_list"
        ? `Legg inn 1-${MAX_NAMES} navn, maks ${MAX_NAME_LENGTH} tegn per navn.`
        : product.inquiryInputMode === "single_name"
          ? `Oppgi ett navn, maks ${MAX_NAME_LENGTH} tegn.`
          : `Oppgi en kommentar, maks ${MAX_COMMENT_LENGTH} tegn.`;
    return NextResponse.json({ error }, { status: 400 });
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
      inputMode: product.inquiryInputMode,
      names: submission.join("\n"),
      quantity:
        product.inquiryInputMode === "name_list" ? submission.length : 1,
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
      quantity:
        product.inquiryInputMode === "name_list" ? submission.length : 1,
      inputMode: product.inquiryInputMode,
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

  if (body.action === "cancel") {
    const result = await prisma.placeCardOrder.updateMany({
      where: {
        id: orderId,
        userId: authResult.user.id,
        status: { in: ["new", "estimated", "confirmed"] },
      },
      data: { status: "cancelled", updatedAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Ordren finnes ikke eller kan ikke lenger kanselleres." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, status: "cancelled" });
  }

  const order = await prisma.placeCardOrder.findFirst({
    where: { id: orderId, userId: authResult.user.id, status: "new" },
    select: { inputMode: true },
  });
  if (!order) {
    return NextResponse.json(
      { error: "Forespørselen finnes ikke eller kan ikke lenger endres." },
      { status: 409 },
    );
  }
  if (order.inputMode === "custom_order") {
    return NextResponse.json(
      { error: "Spesialbestillingen kan ikke endres etter innsending." },
      { status: 409 },
    );
  }

  const submission = normalizeSubmission(body.names, order.inputMode);
  if (!submission) {
    return NextResponse.json(
      { error: "Innholdet er tomt eller for langt." },
      { status: 400 },
    );
  }

  const result = await prisma.placeCardOrder.updateMany({
    where: { id: orderId, userId: authResult.user.id, status: "new" },
    data: {
      names: submission.join("\n"),
      quantity: order.inputMode === "name_list" ? submission.length : 1,
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

  return NextResponse.json({
    success: true,
    quantity: order.inputMode === "name_list" ? submission.length : 1,
  });
}
