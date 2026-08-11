import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const orders = await prisma.placeCardOrder.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
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
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      names: order.names.split("\n").filter(Boolean),
      quantity: order.quantity,
      status: order.status,
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      productName: order.product.name,
    })),
  );
}

export async function PATCH(request: Request) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  let body: { orderId?: unknown };
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

  const confirmedAt = new Date();
  const result = await prisma.placeCardOrder.updateMany({
    where: { id: orderId, status: "new" },
    data: { status: "confirmed", confirmedAt },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Bestillingen er allerede behandlet eller finnes ikke." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    status: "confirmed",
    confirmedAt: confirmedAt.toISOString(),
  });
}
