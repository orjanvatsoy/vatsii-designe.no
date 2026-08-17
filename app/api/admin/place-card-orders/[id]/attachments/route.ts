import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/requireAdmin";
import { signDownloadUrl, signImageUrl } from "../../../../../lib/storage";

const BUCKET = "inquiry-attachments";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_ORDER = 20;
const ALLOWED_FILES = [
  { extension: /\.jpe?g$/i, contentType: "image/jpeg" },
  { extension: /\.png$/i, contentType: "image/png" },
  { extension: /\.webp$/i, contentType: "image/webp" },
  { extension: /\.svg$/i, contentType: "image/svg+xml" },
  { extension: /\.pdf$/i, contentType: "application/pdf" },
  { extension: /\.lbrn2?$/i, contentType: "application/octet-stream" },
];

const serverSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function isSafeSvg(file: File, contentType: string) {
  if (contentType !== "image/svg+xml") return true;
  const source = await file.text();
  return (
    /<svg(?:\s|>)/i.test(source) &&
    !/<(?:script|foreignObject|iframe|object|embed)(?:\s|>)/i.test(source) &&
    !/\son[a-z]+\s*=/i.test(source) &&
    !/(?:javascript:|<!DOCTYPE|<\?xml-stylesheet)/i.test(source)
  );
}

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
    return NextResponse.json({ error: "Ugyldig ordre." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ugyldig fil." }, { status: 400 });
  }
  const candidate = formData.get("file");
  const file =
    candidate instanceof File && candidate.size > 0 ? candidate : null;
  const fileType = file
    ? ALLOWED_FILES.find(({ extension }) => extension.test(file.name))
    : null;
  if (
    !file ||
    !fileType ||
    (file.type &&
      file.type !== fileType.contentType &&
      fileType.contentType !== "application/octet-stream") ||
    file.size > MAX_FILE_BYTES ||
    !(await isSafeSvg(file, fileType.contentType))
  ) {
    return NextResponse.json(
      {
        error: "Velg JPEG, PNG, WebP, SVG, PDF, LBRN eller LBRN2, maks 10 MB.",
      },
      { status: 400 },
    );
  }

  const order = await prisma.placeCardOrder.findUnique({
    where: { id: orderId },
    select: { id: true, _count: { select: { attachments: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Ordren finnes ikke." }, { status: 404 });
  }
  if (order._count.attachments >= MAX_ATTACHMENTS_PER_ORDER) {
    return NextResponse.json(
      { error: "Ordren kan ha maksimalt 20 vedlegg." },
      { status: 400 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `orders/${orderId}/${randomUUID()}_${safeName}`;
  const { error: uploadError } = await serverSupabase.storage
    .from(BUCKET)
    .upload(objectKey, file, { contentType: fileType.contentType });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  try {
    const attachment = await prisma.inquiryAttachment.create({
      data: {
        orderId,
        objectKey,
        fileName: file.name.slice(0, 255),
        contentType: fileType.contentType,
        sizeBytes: file.size,
      },
    });
    return NextResponse.json({
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        url: await signImageUrl(objectKey, BUCKET, 60 * 60),
        downloadUrl: await signDownloadUrl(
          objectKey,
          BUCKET,
          attachment.fileName,
        ),
      },
    });
  } catch (error) {
    await serverSupabase.storage.from(BUCKET).remove([objectKey]);
    console.error("Failed to save order attachment:", error);
    return NextResponse.json(
      { error: "Vedlegget kunne ikke lagres." },
      { status: 500 },
    );
  }
}
