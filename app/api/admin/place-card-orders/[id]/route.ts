import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/requireAdmin";
import { signImageUrl } from "../../../../lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  let orderId: bigint;
  try {
    orderId = BigInt(id);
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  const order = await prisma.placeCardOrder.findUnique({
    where: { id: orderId },
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
      cancellationReason: true,
      createdAt: true,
      product: {
        select: {
          name: true,
          category: true,
          description: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Forespørselen finnes ikke." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: order.id.toString(),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    names: order.names.split("\n").filter(Boolean),
    quantity: order.quantity,
    status: order.status,
    estimatedPrice: order.estimatedPrice,
    deliveryEstimate: order.deliveryEstimate,
    confirmedAt: order.confirmedAt?.toISOString() ?? null,
    cancellationReason: order.cancellationReason,
    createdAt: order.createdAt.toISOString(),
    product: {
      name: order.product.name,
      category: order.product.category,
      description: order.product.description,
      imageUrl: order.product.imageUrl
        ? await signImageUrl(order.product.imageUrl, "products")
        : "",
    },
  });
}
