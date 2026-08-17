import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/requireAdmin";
import { signDownloadUrl, signImageUrl } from "../../../../lib/storage";

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
      attachments: true,
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

  await prisma.orderMessage.updateMany({
    where: { orderId, senderRole: "customer", adminReadAt: null },
    data: { adminReadAt: new Date() },
  });
  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    id: order.id.toString(),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
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
    messages: messages.map((message) => ({
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
        downloadUrl: await signDownloadUrl(
          attachment.objectKey,
          "inquiry-attachments",
          attachment.fileName,
        ),
      })),
    ),
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
