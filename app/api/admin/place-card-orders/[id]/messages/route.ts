import { NextResponse } from "next/server";
import { sendOrderMessageEmail } from "../../../../../lib/email";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function POST(
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

  let body: { body?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";
  if (messageBody.length === 0 || messageBody.length > 2000) {
    return NextResponse.json(
      { error: "Meldingen må være mellom 1 og 2000 tegn." },
      { status: 400 },
    );
  }

  const order = await prisma.placeCardOrder.findUnique({
    where: { id: orderId },
    select: {
      customerEmail: true,
      product: { select: { name: true } },
    },
  });
  if (!order) {
    return NextResponse.json(
      { error: "Forespørselen finnes ikke." },
      { status: 404 },
    );
  }

  const message = await prisma.orderMessage.create({
    data: {
      orderId,
      senderRole: "admin",
      senderUserId: adminResult.user.id,
      body: messageBody,
      adminReadAt: new Date(),
    },
  });

  try {
    await sendOrderMessageEmail({
      recipient: order.customerEmail,
      inquiryId: id,
      productName: order.product.name,
      senderRole: "admin",
      message: messageBody,
      url: `${new URL(request.url).origin}/bestillinger`,
    });
  } catch (error) {
    console.error("Failed to send admin message notification:", error);
  }

  return NextResponse.json({
    message: {
      id: message.id,
      senderRole: message.senderRole,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    },
  });
}
