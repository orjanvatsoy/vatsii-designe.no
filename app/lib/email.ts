import "server-only";

import { Resend } from "resend";
import {
  getOrderReplyTo,
  isResendInboundConfigured,
} from "./email-reply-routing";

const FROM_EMAIL =
  process.env.ORDER_EMAIL_FROM ?? "Vatsii Designe <onboarding@resend.dev>";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function getReplyInstructions(url: string) {
  return [
    ...(isResendInboundConfigured()
      ? [
          "Du kan svare direkte på denne e-posten; svaret legges i samtalen.",
          "Svaradressen på reply-domenet vårt er unik for denne samtalen.",
        ]
      : []),
    `Åpne samtalen: ${url}`,
  ];
}

export async function sendContactEmail(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}) {
  const resend = getResend();
  const recipient =
    process.env.CONTACT_EMAIL_TO ?? process.env.ORDER_NOTIFICATION_EMAIL;
  const from = process.env.CONTACT_EMAIL_FROM ?? FROM_EMAIL;

  if (!resend || !recipient) {
    console.warn(
      "Contact email skipped: RESEND_API_KEY or contact recipient is missing.",
    );
    return false;
  }

  const { error } = await resend.emails.send({
    from,
    to: recipient,
    replyTo: input.email,
    subject: `Ny melding fra kontaktskjemaet: ${input.topic}`,
    text: [
      `Navn: ${input.name}`,
      `E-post: ${input.email}`,
      `Tema: ${input.topic}`,
      "",
      input.message,
    ].join("\n"),
  });
  if (error) throw new Error(error.message);

  return true;
}

export async function sendNewInquiryEmail(input: {
  inquiryId: string;
  customerName: string | null;
  customerEmail: string;
  productName: string;
  quantity: number;
  inputMode: string;
  adminUrl: string;
}) {
  const resend = getResend();
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!resend || !recipient) {
    console.warn(
      "New inquiry email skipped: RESEND_API_KEY or ORDER_NOTIFICATION_EMAIL is missing.",
    );
    return;
  }

  const replyTo = await getOrderReplyTo(
    input.inquiryId,
    "admin",
    input.customerEmail,
  );
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipient,
    ...(replyTo ? { replyTo } : {}),
    subject: `Ny produktforespørsel #${input.inquiryId}`,
    text: [
      `Ny forespørsel fra ${input.customerName ?? input.customerEmail}.`,
      `E-post: ${input.customerEmail}`,
      `Produkt: ${input.productName}`,
      input.inputMode === "name_list" || input.inputMode === "custom_order"
        ? `Antall: ${input.quantity}`
        : `Innholdstype: ${input.inputMode === "single_name" ? "Navn" : "Kommentar"}`,
      ...getReplyInstructions(input.adminUrl),
    ].join("\n"),
  });

  if (error) throw new Error(error.message);
}

export async function sendInquiryEstimateEmail(input: {
  inquiryId: string;
  customerEmail: string;
  productName: string;
  estimatedPrice: number;
  deliveryEstimate: string;
  accountUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("Estimate email skipped: RESEND_API_KEY is missing.");
    return;
  }

  const replyTo = await getOrderReplyTo(
    input.inquiryId,
    "customer",
    process.env.ORDER_NOTIFICATION_EMAIL,
  );
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    ...(replyTo ? { replyTo } : {}),
    subject: `Svar på produktforespørsel #${input.inquiryId}`,
    text: [
      `Vi har vurdert forespørselen din for ${input.productName}.`,
      `Estimert pris: ${new Intl.NumberFormat("nb-NO").format(input.estimatedPrice)} kr`,
      `Estimert leveringstid: ${input.deliveryEstimate}`,
      "Forespørselen er uforpliktende.",
      ...getReplyInstructions(input.accountUrl),
    ].join("\n"),
  });

  if (error) throw new Error(error.message);
}

export async function sendOrderCancellationEmail(input: {
  inquiryId: string;
  customerEmail: string;
  productName: string;
  reason: string;
  accountUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("Cancellation email skipped: RESEND_API_KEY is missing.");
    return false;
  }

  const replyTo = await getOrderReplyTo(
    input.inquiryId,
    "customer",
    process.env.ORDER_NOTIFICATION_EMAIL,
  );
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    ...(replyTo ? { replyTo } : {}),
    subject: `Produktforespørsel #${input.inquiryId} er kansellert`,
    text: [
      `Vi har dessverre kansellert forespørselen din for ${input.productName}.`,
      `Begrunnelse: ${input.reason}`,
      ...getReplyInstructions(input.accountUrl),
    ].join("\n"),
  });

  if (error) throw new Error(error.message);
  return true;
}

export async function sendOrderMessageEmail(input: {
  recipient: string;
  inquiryId: string;
  productName: string;
  senderRole: "customer" | "admin";
  message: string;
  url: string;
  inReplyTo?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("Message email skipped: RESEND_API_KEY is missing.");
    return false;
  }

  const sender = input.senderRole === "admin" ? "Vatsii Designe" : "kunden";
  const replyTo = await getOrderReplyTo(
    input.inquiryId,
    input.senderRole === "admin" ? "customer" : "admin",
    process.env.ORDER_NOTIFICATION_EMAIL,
  );
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.recipient,
    ...(replyTo ? { replyTo } : {}),
    ...(input.inReplyTo
      ? { headers: { "In-Reply-To": input.inReplyTo } }
      : {}),
    subject: `${input.inReplyTo ? "Re: " : ""}Ny melding om forespørsel #${input.inquiryId}`,
    text: [
      `Du har fått en ny melding fra ${sender} om ${input.productName}.`,
      "",
      input.message,
      "",
      ...getReplyInstructions(input.url),
    ].join("\n"),
  });

  if (error) throw new Error(error.message);
  return true;
}
