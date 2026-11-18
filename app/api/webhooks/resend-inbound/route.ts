import { NextResponse } from "next/server";
import { Resend, type WebhookEventPayload } from "resend";
import { getResendInboundDomain } from "../../../lib/email-reply-routing";
import {
  extractReplyToken,
  getReplyMessageIds,
  parseEmailSentThreadReference,
} from "../../../lib/email-reply-address";
import { MAX_ORDER_MESSAGE_LENGTH } from "../../../lib/order-message-limits";
import { prisma } from "../../../lib/prisma";
import { sendOrderMessageEmail } from "../../../lib/email";
import { extractReplyBody } from "../../../lib/email-reply-body";

export const dynamic = "force-dynamic";

function extractAddress(value: string) {
  const address = value.match(/<([^<>]+)>/)?.[1] ?? value;
  const normalized = address.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ? normalized
    : null;
}

function htmlToText(html: string) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(?:div|p|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function limitMessage(body: string) {
  if (body.length <= MAX_ORDER_MESSAGE_LENGTH) return body;

  const notice = "\n\n[Meldingen ble forkortet ved import fra e-post.]";
  return `${body.slice(0, MAX_ORDER_MESSAGE_LENGTH - notice.length).trimEnd()}${notice}`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(request: Request) {
  const apiKey =
    process.env.RESEND_RECEIVING_API_KEY ?? process.env.RESEND_API_KEY;
  const webhookSecret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!apiKey || !webhookSecret) {
    console.error(
      "Resend inbound webhook requires a Resend API key and RESEND_INBOUND_WEBHOOK_SECRET.",
    );
    return NextResponse.json(
      { error: "E-postmottak er ikke konfigurert." },
      { status: 500 },
    );
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Ugyldig webhook." }, { status: 400 });
  }

  const payload = await request.text();
  const resend = new Resend(apiKey);
  let event: WebhookEventPayload;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    console.warn("Rejected an invalid Resend inbound webhook signature.");
    return NextResponse.json({ error: "Ugyldig signatur." }, { status: 400 });
  }

  if (event.type === "email.sent") {
    const tags = event.data.tags ?? {};
    if (!tags.inquiry_id && !tags.reply_role) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const reference = parseEmailSentThreadReference({
      messageId: event.data.message_id,
      tags,
    });
    if (!reference) {
      console.warn("Ignored a Resend email.sent event with invalid reply tags.");
      return NextResponse.json({ received: true, ignored: true });
    }

    await prisma.orderEmailThreadReference.upsert({
      where: { messageId: reference.messageId },
      create: {
        messageId: reference.messageId,
        orderId: BigInt(reference.inquiryId),
        replyRole: reference.replyRole,
      },
      update: {
        orderId: BigInt(reference.inquiryId),
        replyRole: reference.replyRole,
      },
    });
    return NextResponse.json({ received: true, threadReference: true });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const domain = getResendInboundDomain();
  if (!domain) {
    console.error("RESEND_INBOUND_DOMAIN is required to route received emails.");
    return NextResponse.json(
      { error: "E-postmottak er ikke konfigurert." },
      { status: 500 },
    );
  }

  const { data: email, error } = await resend.emails.receiving.get(
    event.data.email_id,
  );
  if (error) {
    throw new Error(`Could not retrieve received Resend email: ${error.message}`);
  }

  const replyToken = email.to
    .map((address) => extractReplyToken(address, domain))
    .find((token) => token !== null);
  const sharedReplyAddress = `svar@${domain}`;
  const isSharedReply = email.to
    .map(extractAddress)
    .includes(sharedReplyAddress);

  let order:
    | {
        id: bigint;
        customerEmail: string;
        customerReplyToken: string | null;
        adminReplyToken: string | null;
        product: { name: string };
      }
    | null = null;
  let inboundRole: "customer" | "admin" | null = null;

  if (replyToken) {
    order = await prisma.placeCardOrder.findFirst({
      where: {
        OR: [
          { customerReplyToken: replyToken },
          { adminReplyToken: replyToken },
        ],
      },
      select: {
        id: true,
        customerEmail: true,
        customerReplyToken: true,
        adminReplyToken: true,
        product: { select: { name: true } },
      },
    });
    if (order) {
      inboundRole =
        order.customerReplyToken === replyToken
          ? "customer"
          : order.adminReplyToken === replyToken
            ? "admin"
            : null;
    }
  } else if (isSharedReply) {
    const messageIds = getReplyMessageIds(email.headers);
    if (messageIds.length > 0) {
      const emailReferences =
        await prisma.orderEmailThreadReference.findMany({
          where: { messageId: { in: messageIds } },
          select: { messageId: true, orderId: true, replyRole: true },
        });
      const referenceByMessageId = new Map(
        emailReferences.map((reference) => [reference.messageId, reference]),
      );
      const reference = messageIds
        .map((messageId) => referenceByMessageId.get(messageId))
        .find((candidate) => candidate !== undefined);
      if (reference) {
        const foundOrder = await prisma.placeCardOrder.findUnique({
          where: { id: reference.orderId },
          select: {
            id: true,
            customerEmail: true,
            customerReplyToken: true,
            adminReplyToken: true,
            product: { select: { name: true } },
          },
        });
        if (
          foundOrder &&
          (reference.replyRole === "customer" ||
            reference.replyRole === "admin")
        ) {
          order = foundOrder;
          inboundRole = reference.replyRole;
        }
      }
    }
  }

  if (!order || !inboundRole) {
    console.warn(
      "Ignored a Resend email without a valid inquiry reply address or thread reference.",
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  const senderEmail = extractAddress(email.from);
  const customerEmail = order.customerEmail.trim().toLowerCase();
  const adminEmails = (process.env.ORDER_NOTIFICATION_EMAIL ?? "")
    .split(/[;,]/)
    .map(extractAddress)
    .filter((address): address is string => address !== null);
  const senderRole =
    inboundRole === "customer"
      ? senderEmail === customerEmail
        ? "customer"
        : null
      : senderEmail && adminEmails.includes(senderEmail)
        ? "admin"
        : null;

  if (!senderRole) {
    console.warn(
      `Ignored an email reply from an unrecognized sender for inquiry ${order.id}.`,
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  const emailBody = email.text ?? (email.html ? htmlToText(email.html) : "");
  const replyBody = extractReplyBody(emailBody);
  if (!replyBody) {
    console.warn(
      `Ignored an empty email reply for inquiry ${order.id} (${email.id}).`,
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  const attachmentNotice =
    email.attachments.length > 0
      ? `\n\n[${email.attachments.length} vedlegg fulgte med e-posten, men ble ikke importert. Legg dem ved via samtalen.]`
      : "";
  const messageBody = limitMessage(`${replyBody}${attachmentNotice}`);
  let message;
  try {
    message = await prisma.$transaction(async (transaction) => {
      const created = await transaction.orderMessage.create({
        data: {
          orderId: order.id,
          senderRole,
          senderUserId: null,
          receivedEmailId: email.id,
          body: messageBody,
          customerReadAt: senderRole === "customer" ? new Date() : null,
          adminReadAt: senderRole === "admin" ? new Date() : null,
        },
      });

      if (senderRole === "customer") {
        await transaction.placeCardOrder.update({
          where: { id: order.id },
          data: { customerUpdatedAt: new Date() },
        });
      }

      return created;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  const recipient =
    senderRole === "customer"
      ? process.env.ORDER_NOTIFICATION_EMAIL
      : order.customerEmail;
  if (recipient) {
    try {
      await sendOrderMessageEmail({
        recipient,
        inquiryId: order.id.toString(),
        productName: order.product.name,
        senderRole,
        message: message.body,
        inReplyTo: email.message_id,
        url:
          senderRole === "customer"
            ? `${new URL(request.url).origin}/admin/bestillinger/${order.id}`
            : `${new URL(request.url).origin}/bestillinger`,
      });
    } catch (notificationError) {
      console.error("Failed to notify about an email reply:", notificationError);
    }
  }

  return NextResponse.json({ received: true });
}
