import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BUCKET = "product-files";
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const PRODUCT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getProductId(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId") ?? "";
  return PRODUCT_ID_PATTERN.test(productId) ? productId : null;
}

function isLightBurnFile(file: File) {
  return /\.lbrn2?$/i.test(file.name);
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(request: Request) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const productId = getProductId(request);
  if (!productId) {
    return NextResponse.json({ error: "Ugyldig produkt." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { lightburnObjectKey: true, lightburnFileName: true },
  });
  if (!product?.lightburnObjectKey || !product.lightburnFileName) {
    return NextResponse.json(
      { error: "Produktet har ingen LightBurn-fil." },
      { status: 404 },
    );
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(product.lightburnObjectKey);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(product.lightburnFileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(request: Request) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const formData = await request.formData();
  const productId = String(formData.get("productId") ?? "");
  const candidate = formData.get("file");
  const file =
    candidate instanceof File && candidate.size > 0 ? candidate : null;

  if (!PRODUCT_ID_PATTERN.test(productId) || !file || !isLightBurnFile(file)) {
    return NextResponse.json(
      { error: "Velg en gyldig .lbrn- eller .lbrn2-fil." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "LightBurn-filen kan ikke være større enn 50 MB." },
      { status: 400 },
    );
  }

  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { lightburnObjectKey: true },
  });
  if (!currentProduct) {
    return NextResponse.json(
      { error: "Produktet finnes ikke." },
      { status: 404 },
    );
  }

  const objectKey = `${adminResult.user.id}/${productId}/${Date.now()}_${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectKey, file, { contentType: "application/octet-stream" });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        lightburnObjectKey: objectKey,
        lightburnFileName: file.name,
        lightburnSizeBytes: file.size,
        lightburnUpdatedAt: new Date(),
      },
      select: {
        lightburnFileName: true,
        lightburnSizeBytes: true,
        lightburnUpdatedAt: true,
      },
    });

    if (currentProduct.lightburnObjectKey) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove([currentProduct.lightburnObjectKey]);
      if (removeError)
        console.error("Failed to remove replaced LightBurn file:", removeError);
    }

    return NextResponse.json({
      file: {
        name: updated.lightburnFileName,
        sizeBytes: updated.lightburnSizeBytes,
        updatedAt: updated.lightburnUpdatedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([objectKey]);
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const productId = getProductId(request);
  if (!productId) {
    return NextResponse.json({ error: "Ugyldig produkt." }, { status: 400 });
  }

  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { lightburnObjectKey: true },
  });
  if (!currentProduct) {
    return NextResponse.json(
      { error: "Produktet finnes ikke." },
      { status: 404 },
    );
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      lightburnObjectKey: null,
      lightburnFileName: null,
      lightburnSizeBytes: null,
      lightburnUpdatedAt: null,
    },
  });

  if (currentProduct.lightburnObjectKey) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([currentProduct.lightburnObjectKey]);
    if (error) console.error("Failed to remove LightBurn file:", error);
  }

  return NextResponse.json({ success: true });
}
