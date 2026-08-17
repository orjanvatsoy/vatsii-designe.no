import "server-only";

import { Resend } from "resend";

const FROM_EMAIL =
  process.env.ORDER_EMAIL_FROM ?? "Vatsii Designe <onboarding@resend.dev>";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
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

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipient,
    subject: `Ny produktforespørsel #${input.inquiryId}`,
    text: [
      `Ny forespørsel fra ${input.customerName ?? input.customerEmail}.`,
      `E-post: ${input.customerEmail}`,
      `Produkt: ${input.productName}`,
      input.inputMode === "name_list" || input.inputMode === "custom_order"
        ? `Antall: ${input.quantity}`
        : `Innholdstype: ${input.inputMode === "single_name" ? "Navn" : "Kommentar"}`,
      `Åpne forespørselen: ${input.adminUrl}`,
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

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    subject: `Svar på produktforespørsel #${input.inquiryId}`,
    text: [
      `Vi har vurdert forespørselen din for ${input.productName}.`,
      `Estimert pris: ${new Intl.NumberFormat("nb-NO").format(input.estimatedPrice)} kr`,
      `Estimert leveringstid: ${input.deliveryEstimate}`,
      "Forespørselen er uforpliktende.",
      `Se forespørselen: ${input.accountUrl}`,
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

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    subject: `Produktforespørsel #${input.inquiryId} er kansellert`,
    text: [
      `Vi har dessverre kansellert forespørselen din for ${input.productName}.`,
      `Begrunnelse: ${input.reason}`,
      `Se forespørselen: ${input.accountUrl}`,
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
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("Message email skipped: RESEND_API_KEY is missing.");
    return false;
  }

  const sender = input.senderRole === "admin" ? "Vatsii Designe" : "kunden";
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.recipient,
    subject: `Ny melding om forespørsel #${input.inquiryId}`,
    text: [
      `Du har fått en ny melding fra ${sender} om ${input.productName}.`,
      "",
      input.message,
      "",
      `Åpne samtalen: ${input.url}`,
    ].join("\n"),
  });

  if (error) throw new Error(error.message);
  return true;
}
