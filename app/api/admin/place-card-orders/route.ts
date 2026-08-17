import { NextResponse } from "next/server";
import {
  sendInquiryEstimateEmail,
  sendOrderCancellationEmail,
} from "../../../lib/email";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const archived = new URL(request.url).searchParams.get("archived") === "true";

  const orders = await prisma.placeCardOrder.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      inputMode: true,
      names: true,
      quantity: true,
      status: true,
      estimatedPrice: true,
      deliveryEstimate: true,
      confirmedAt: true,
      createdAt: true,
      updatedAt: true,
      customerUpdatedAt: true,
      archivedAt: true,
      product: { select: { name: true } },
    },
  });

  return NextResponse.json(
    orders.map((order) => ({
      id: order.id.toString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      inputMode: order.inputMode,
      names: order.names.split("\n").filter(Boolean),
      quantity: order.quantity,
      status: order.status,
      estimatedPrice: order.estimatedPrice,
      deliveryEstimate: order.deliveryEstimate,
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerUpdatedAt: order.customerUpdatedAt?.toISOString() ?? null,
      archivedAt: order.archivedAt?.toISOString() ?? null,
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
    reason?: unknown;
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

  if (body.action === "archive") {
    const archivedAt = new Date();
    const result = await prisma.placeCardOrder.updateMany({
      where: {
        id: orderId,
        status: { in: ["completed", "cancelled"] },
        archivedAt: null,
      },
      data: { archivedAt },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Bare leverte eller kansellerte bestillinger kan arkiveres." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      archivedAt: archivedAt.toISOString(),
    });
  }

  if (body.action === "restore") {
    const result = await prisma.placeCardOrder.updateMany({
      where: { id: orderId, archivedAt: { not: null } },
      data: { archivedAt: null },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Bestillingen er ikke arkivert." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, archivedAt: null });
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

  if (body.action === "cancel") {
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < 5 || reason.length > 500) {
      return NextResponse.json(
        { error: "Oppgi en begrunnelse på mellom 5 og 500 tegn." },
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
    if (!order || ["completed", "cancelled"].includes(order.status)) {
      return NextResponse.json(
        { error: "Ordren finnes ikke eller kan ikke kanselleres." },
        { status: 409 },
      );
    }

    const result = await prisma.placeCardOrder.updateMany({
      where: { id: orderId, status: order.status, archivedAt: null },
      data: { status: "cancelled", cancellationReason: reason },
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Ordren ble endret og kunne ikke kanselleres." },
        { status: 409 },
      );
    }

    const origin = new URL(request.url).origin;
    let notificationSent = false;
    try {
      notificationSent = await sendOrderCancellationEmail({
        inquiryId: orderId.toString(),
        customerEmail: order.customerEmail,
        productName: order.product.name,
        reason,
        accountUrl: `${origin}/bestillinger`,
      });
    } catch (error) {
      console.error("Failed to send cancellation email:", error);
    }

    return NextResponse.json({
      success: true,
      status: "cancelled",
      cancellationReason: reason,
      notificationSent,
    });
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
