import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendNewInquiryEmail } from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/requireUser";

const ATTACHMENT_BUCKET = "inquiry-attachments";
const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const serverSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const dynamic = "force-dynamic";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const hasAuthorization = Boolean(request.headers.get("authorization"));
  const authResult = hasAuthorization ? await requireUser(request) : null;
  if (authResult instanceof NextResponse) return authResult;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  if (readText(formData, "website")) {
    return NextResponse.json({ success: true });
  }

  const productId = readText(formData, "productId");
  const description = readText(formData, "description");
  const dimensions = readText(formData, "dimensions");
  const quantityValue = Number(readText(formData, "quantity"));
  const budgetText = readText(formData, "budget");
  const budget = budgetText ? Number(budgetText) : null;
  const deliveryDateText = readText(formData, "deliveryDate");
  const customerEmail = (
    authResult?.user.email ?? readText(formData, "customerEmail")
  ).toLowerCase();
  const accountName =
    authResult?.user.user_metadata.full_name ??
    authResult?.user.user_metadata.name ??
    "";
  const customerName = String(
    readText(formData, "customerName") || accountName,
  ).trim();
  const attachments = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!UUID_PATTERN.test(productId)) {
    return NextResponse.json({ error: "Ugyldig produkt." }, { status: 400 });
  }
  if (description.length < 10 || description.length > 3000) {
    return NextResponse.json(
      { error: "Beskriv hva du ønsker laget med 10–3000 tegn." },
      { status: 400 },
    );
  }
  if (dimensions.length === 0 || dimensions.length > 300) {
    return NextResponse.json(
      { error: "Oppgi mål eller ønsket størrelse, maks 300 tegn." },
      { status: 400 },
    );
  }
  if (
    !Number.isInteger(quantityValue) ||
    quantityValue < 1 ||
    quantityValue > 10000
  ) {
    return NextResponse.json(
      { error: "Antall må være et heltall mellom 1 og 10 000." },
      { status: 400 },
    );
  }
  if (
    budget !== null &&
    (!Number.isInteger(budget) || budget < 0 || budget > 10_000_000)
  ) {
    return NextResponse.json(
      { error: "Budsjettet må oppgis i hele kroner." },
      { status: 400 },
    );
  }

  let desiredDeliveryDate: Date | null = null;
  if (deliveryDateText) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDateText)) {
      return NextResponse.json(
        { error: "Ugyldig leveringsdato." },
        { status: 400 },
      );
    }
    desiredDeliveryDate = new Date(`${deliveryDateText}T00:00:00.000Z`);
    if (
      Number.isNaN(desiredDeliveryDate.getTime()) ||
      desiredDeliveryDate.toISOString().slice(0, 10) !== deliveryDateText
    ) {
      return NextResponse.json(
        { error: "Ugyldig leveringsdato." },
        { status: 400 },
      );
    }
  }

  if (!EMAIL_PATTERN.test(customerEmail) || customerEmail.length > 254) {
    return NextResponse.json(
      { error: "Oppgi en gyldig e-postadresse." },
      { status: 400 },
    );
  }
  if (!customerName || customerName.length > 120) {
    return NextResponse.json(
      { error: "Oppgi navnet ditt, maks 120 tegn." },
      { status: 400 },
    );
  }
  if (
    attachments.length > MAX_ATTACHMENTS ||
    attachments.some(
      (file) => file.size > MAX_FILE_BYTES || !ALLOWED_MIME.has(file.type),
    ) ||
    attachments.reduce((total, file) => total + file.size, 0) >
      MAX_TOTAL_FILE_BYTES
  ) {
    return NextResponse.json(
      {
        error:
          "Du kan laste opp inntil 5 JPEG-, PNG-, WebP- eller PDF-filer, maks 5 MB per fil og 20 MB totalt.",
      },
      { status: 400 },
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true, inquiryInputMode: "custom_order" },
    select: { name: true },
  });
  if (!product) {
    return NextResponse.json(
      { error: "Produktet er ikke tilgjengelig for spesialbestilling." },
      { status: 404 },
    );
  }

  const recentInquiryCount = await prisma.placeCardOrder.count({
    where: {
      customerEmail: { equals: customerEmail, mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentInquiryCount >= 5) {
    return NextResponse.json(
      { error: "For mange forespørsler på kort tid. Prøv igjen senere." },
      { status: 429 },
    );
  }

  const order = await prisma.placeCardOrder.create({
    data: {
      userId: authResult?.user.id ?? null,
      customerEmail,
      customerName,
      productId,
      inputMode: "custom_order",
      names: description,
      quantity: quantityValue,
      customDimensions: dimensions,
      customBudget: budget,
      desiredDeliveryDate,
    },
    select: { id: true },
  });

  const uploadedKeys: string[] = [];
  try {
    for (const file of attachments) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectKey = `orders/${order.id}/${randomUUID()}_${safeName}`;
      const { error: uploadError } = await serverSupabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(objectKey, file, { contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);
      uploadedKeys.push(objectKey);

      await prisma.inquiryAttachment.create({
        data: {
          orderId: order.id,
          objectKey,
          fileName: file.name.slice(0, 255),
          contentType: file.type,
          sizeBytes: file.size,
        },
      });
    }
  } catch (error) {
    if (uploadedKeys.length > 0) {
      await serverSupabase.storage.from(ATTACHMENT_BUCKET).remove(uploadedKeys);
    }
    await prisma.placeCardOrder.delete({ where: { id: order.id } });
    console.error("Failed to save custom-order attachments:", error);
    return NextResponse.json(
      { error: "Vedleggene kunne ikke lagres. Prøv igjen." },
      { status: 500 },
    );
  }

  const origin = new URL(request.url).origin;
  try {
    await sendNewInquiryEmail({
      inquiryId: order.id.toString(),
      customerName,
      customerEmail,
      productName: product.name,
      quantity: quantityValue,
      inputMode: "custom_order",
      adminUrl: `${origin}/admin/bestillinger/${order.id}`,
    });
  } catch (error) {
    console.error("Failed to send custom-order email:", error);
  }

  return NextResponse.json({
    success: true,
    orderId: order.id.toString(),
    requiresEmailVerification: !authResult,
  });
}
