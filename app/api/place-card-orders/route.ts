import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/requireUser";

const MAX_NAMES = 200;
const MAX_NAME_LENGTH = 100;

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

  const names = body.names
    .filter((name): name is string => typeof name === "string")
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0 || names.length > MAX_NAMES) {
    return NextResponse.json(
      { error: `Legg inn mellom 1 og ${MAX_NAMES} navn.` },
      { status: 400 },
    );
  }
  if (names.some((name) => name.length > MAX_NAME_LENGTH)) {
    return NextResponse.json(
      { error: `Hvert navn kan være maks ${MAX_NAME_LENGTH} tegn.` },
      { status: 400 },
    );
  }

  let productId: bigint;
  try {
    productId = BigInt(body.productId);
  } catch {
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
