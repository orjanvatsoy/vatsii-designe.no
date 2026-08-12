import { NextResponse } from "next/server";
import { sendInquiryEstimateEmail } from "../../../lib/email";
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
      estimatedPrice: true,
      deliveryEstimate: true,
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
      estimatedPrice: order.estimatedPrice,
      deliveryEstimate: order.deliveryEstimate,
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      productName: order.product.name,
    })),
  );
}

export async function PATCH(request: Request) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  let body: {
    orderId?: unknown;
    action?: unknown;
    estimatedPrice?: unknown;
    deliveryEstimate?: unknown;
  };
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

  if (body.action === "mark-delivered") {
    const result = await prisma.placeCardOrder.updateMany({
      where: { id: orderId, status: "approved" },
      data: { status: "completed" },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Ordren må ha et godkjent tilbud før den kan leveres." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, status: "completed" });
  }

  const estimatedPrice = body.estimatedPrice;
  const deliveryEstimate =
    typeof body.deliveryEstimate === "string"
      ? body.deliveryEstimate.trim()
      : "";
  if (
    typeof estimatedPrice !== "number" ||
    !Number.isInteger(estimatedPrice) ||
    estimatedPrice <= 0 ||
    estimatedPrice > 10_000_000 ||
    deliveryEstimate.length === 0 ||
    deliveryEstimate.length > 200
  ) {
    return NextResponse.json(
      { error: "Oppgi gyldig prisestimat og leveringstid." },
      { status: 400 },
    );
  }

  const order = await prisma.placeCardOrder.findUnique({
    where: { id: orderId },
    select: {
      customerEmail: true,
      status: true,
      product: { select: { name: true } },
    },
  });
  if (!order || order.status !== "new") {
    return NextResponse.json(
      { error: "Forespørselen er allerede besvart eller finnes ikke." },
      { status: 409 },
    );
  }

  const confirmedAt = new Date();
  const result = await prisma.placeCardOrder.updateMany({
    where: { id: orderId, status: "new" },
    data: {
      status: "estimated",
      estimatedPrice,
      deliveryEstimate,
      confirmedAt,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Forespørselen er allerede besvart eller finnes ikke." },
      { status: 409 },
    );
  }

  const origin = new URL(request.url).origin;
  try {
    await sendInquiryEstimateEmail({
      inquiryId: orderId.toString(),
      customerEmail: order.customerEmail,
      productName: order.product.name,
      estimatedPrice,
      deliveryEstimate,
      accountUrl: `${origin}/bestillinger`,
    });
  } catch (error) {
    console.error("Failed to send estimate email:", error);
  }

  return NextResponse.json({
    success: true,
    status: "estimated",
    estimatedPrice,
    deliveryEstimate,
    confirmedAt: confirmedAt.toISOString(),
  });
}
