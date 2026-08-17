import { NextResponse } from "next/server";
import { sendOrderMessageEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/requireUser";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

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

  const customerEmail = authResult.user.email?.trim().toLowerCase();
  if (!customerEmail) {
    return NextResponse.json(
      { error: "Kontoen mangler e-postadresse." },
      { status: 400 },
    );
  }

  await prisma.placeCardOrder.updateMany({
    where: {
      id: orderId,
      userId: null,
      customerEmail: { equals: customerEmail, mode: "insensitive" },
    },
    data: { userId: authResult.user.id },
  });

  const order = await prisma.placeCardOrder.findFirst({
    where: { id: orderId, userId: authResult.user.id },
    select: { id: true, product: { select: { name: true } } },
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
      senderRole: "customer",
      senderUserId: authResult.user.id,
      body: messageBody,
      customerReadAt: new Date(),
    },
  });

  const recipient = process.env.ORDER_NOTIFICATION_EMAIL;
  if (recipient) {
    try {
      await sendOrderMessageEmail({
        recipient,
        inquiryId: id,
        productName: order.product.name,
        senderRole: "customer",
        message: messageBody,
        url: `${new URL(request.url).origin}/admin/bestillinger/${id}`,
      });
    } catch (error) {
      console.error("Failed to send customer message notification:", error);
    }
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
