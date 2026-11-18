import "server-only";

import { prisma } from "./prisma";
import { formatSharedReplyTo } from "./email-reply-address";

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

  const order = await prisma.placeCardOrder.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) {
    throw new Error(`Cannot create an email reply address for inquiry ${inquiryId}.`);
  }

  return formatSharedReplyTo(orderId, domain);
}
