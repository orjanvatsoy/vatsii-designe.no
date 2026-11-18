import "server-only";

import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";

export const REPLY_TOKEN_HEX_LENGTH = 60;

export function getResendInboundDomain() {
  const domain = process.env.RESEND_INBOUND_DOMAIN?.trim().toLowerCase();
  if (!domain) return null;

  if (
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)
  ) {
    throw new Error("RESEND_INBOUND_DOMAIN must be a valid domain name.");
  }

  return domain;
}

export function isResendInboundConfigured() {
  return Boolean(
    getResendInboundDomain() && process.env.RESEND_INBOUND_WEBHOOK_SECRET,
  );
}

export async function getOrderReplyTo(
  inquiryId: string,
  inboundRole: "customer" | "admin",
  fallback?: string,
): Promise<string | undefined> {
  const domain = getResendInboundDomain();
  if (!domain || !process.env.RESEND_INBOUND_WEBHOOK_SECRET) return fallback;

  let orderId: bigint;
  try {
    orderId = BigInt(inquiryId);
  } catch {
    throw new Error("Cannot create an email reply address for an invalid inquiry ID.");
  }

  let order = await prisma.placeCardOrder.findUnique({
    where: { id: orderId },
    select: { customerReplyToken: true, adminReplyToken: true },
  });
  if (!order) {
    throw new Error(`Cannot create an email reply address for inquiry ${inquiryId}.`);
  }

  const tokenField =
    inboundRole === "customer" ? "customerReplyToken" : "adminReplyToken";
  if (order[tokenField]?.length !== REPLY_TOKEN_HEX_LENGTH) {
    const token = randomBytes(REPLY_TOKEN_HEX_LENGTH / 2).toString("hex");
    if (inboundRole === "customer") {
      await prisma.placeCardOrder.updateMany({
        where: { id: orderId, customerReplyToken: order.customerReplyToken },
        data: { customerReplyToken: token },
      });
    } else {
      await prisma.placeCardOrder.updateMany({
        where: { id: orderId, adminReplyToken: order.adminReplyToken },
        data: { adminReplyToken: token },
      });
    }
    order = await prisma.placeCardOrder.findUnique({
      where: { id: orderId },
      select: { customerReplyToken: true, adminReplyToken: true },
    });
  }

  const token = order?.[tokenField];
  if (!token) {
    throw new Error(`Could not create an email reply address for inquiry ${inquiryId}.`);
  }

  return `r-${token}@${domain}`;
}
