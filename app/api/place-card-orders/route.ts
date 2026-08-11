import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/requireUser";

const MAX_NAMES = 200;
const MAX_NAME_LENGTH = 100;

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
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  const orders = await prisma.placeCardOrder.findMany({
    where: { userId: authResult.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      names: true,
      quantity: true,
      status: true,
      confirmedAt: true,
      createdAt: true,
      product: { select: { name: true } },
    },
  });

  return NextResponse.json(
    orders.map((order) => ({
      id: order.id.toString(),
      names: order.names.split("\n").filter(Boolean),
      quantity: order.quantity,
      status: order.status,
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      productName: order.product.name,
    })),
  );
}

export async function POST(request: Request) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: { productId?: unknown; names?: unknown };
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
    select: { active: true, category: true },
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

  const customerEmail = authResult.user.email;
  if (!customerEmail) {
    return NextResponse.json(
      { error: "Kontoen mangler e-postadresse." },
      { status: 400 },
    );
  }
  const customerName =
    authResult.user.user_metadata.full_name ??
    authResult.user.user_metadata.name ??
    null;

  const order = await prisma.placeCardOrder.create({
    data: {
      userId: authResult.user.id,
      customerEmail,
      customerName,
      productId,
      names: names.join("\n"),
      quantity: names.length,
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, orderId: order.id.toString() });
}

export async function PATCH(request: Request) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: { orderId?: unknown; names?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  if (typeof body.orderId !== "string") {
    return NextResponse.json({ error: "Ugyldig bestilling." }, { status: 400 });
  }

  let orderId: bigint;
  try {
    orderId = BigInt(body.orderId);
  } catch {
    return NextResponse.json({ error: "Ugyldig bestilling." }, { status: 400 });
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
    data: { names: names.join("\n"), quantity: names.length },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Bestillingen finnes ikke eller kan ikke lenger endres." },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true, quantity: names.length });
}
