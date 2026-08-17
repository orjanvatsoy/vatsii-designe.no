import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/requireAdmin";
import { prisma } from "../../lib/prisma";
import { signImageUrl } from "../../lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const INQUIRY_INPUT_MODES = new Set([
  "name_list",
  "single_name",
  "comment",
  "custom_order",
]);

export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    categories: [...new Set(products.map((product) => product.category))].sort(
      (left, right) => left.localeCompare(right, "nb-NO"),
    ),
    products: await Promise.all(
      products.map(async (product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        inquiryInputMode: product.inquiryInputMode,
        imagePositionX: product.imagePositionX,
        imagePositionY: product.imagePositionY,
        imageRotation: product.imageRotation,
        active: product.active,
        imageUrl: product.imageUrl
          ? await signImageUrl(product.imageUrl, "products")
          : "",
      })),
    ),
  });
}

export async function PATCH(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const formData = await req.formData();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const inquiryInputMode = String(formData.get("inquiryInputMode") ?? "");
  const imagePositionX = Number(formData.get("imagePositionX"));
  const imagePositionY = Number(formData.get("imagePositionY"));
  const imageRotation = Number(formData.get("imageRotation"));
  const active = formData.get("active") === "true";
  const image = formData.get("image");
  const imageFile = image instanceof File && image.size > 0 ? image : null;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    ) ||
    !name ||
    !description ||
    !category ||
    !INQUIRY_INPUT_MODES.has(inquiryInputMode) ||
    !Number.isInteger(imagePositionX) ||
    imagePositionX < 0 ||
    imagePositionX > 100 ||
    !Number.isInteger(imagePositionY) ||
    imagePositionY < 0 ||
    imagePositionY > 100 ||
    ![0, 90, 180, 270].includes(imageRotation)
  ) {
    return NextResponse.json(
      { error: "Produktdataene er ugyldige." },
      { status: 400 },
    );
  }

  if (imageFile && !ALLOWED_MIME.has(imageFile.type)) {
    return NextResponse.json(
      { error: "Bildet må være JPEG, PNG, WebP eller GIF." },
      { status: 400 },
    );
  }
  if (imageFile && imageFile.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Bildet kan ikke være større enn 5 MB." },
      { status: 400 },
    );
  }

  const currentProduct = await prisma.product.findUnique({ where: { id } });
  if (!currentProduct) {
    return NextResponse.json(
      { error: "Produktet finnes ikke." },
      { status: 404 },
    );
  }

  let newObjectKey: string | null = null;
  if (imageFile) {
    const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    newObjectKey = `${adminResult.user.id}/${Date.now()}_${safeName}`;
    const { error: storageError } = await supabase.storage
      .from("products")
      .upload(newObjectKey, imageFile, { contentType: imageFile.type });
    if (storageError) {
      return NextResponse.json(
        { error: storageError.message },
        { status: 500 },
      );
    }
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        category,
        inquiryInputMode,
        imagePositionX,
        imagePositionY,
        imageRotation,
        active,
        ...(newObjectKey ? { imageUrl: newObjectKey } : {}),
      },
    });

    if (newObjectKey && currentProduct.imageUrl) {
      const { error: removeError } = await supabase.storage
        .from("products")
        .remove([currentProduct.imageUrl]);
      if (removeError) {
        console.error("Failed to remove replaced product image:", removeError);
      }
    }

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    if (
      [currentProduct.category, category].some(
        (value) => value.trim().toLowerCase() === "bordkort",
      )
    ) {
      revalidatePath("/products/bordkort");
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        inquiryInputMode: product.inquiryInputMode,
        imagePositionX: product.imagePositionX,
        imagePositionY: product.imagePositionY,
        imageRotation: product.imageRotation,
        active: product.active,
        imageUrl: product.imageUrl
          ? await signImageUrl(product.imageUrl, "products")
          : "",
      },
    });
  } catch (error) {
    if (newObjectKey) {
      await supabase.storage.from("products").remove([newObjectKey]);
    }
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;
  const userId = adminResult.user.id;

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const inquiryInputMode = formData.get("inquiryInputMode") as string;
  const imageFile = formData.get("image") as File;

  if (
    !name ||
    !description ||
    !category ||
    !INQUIRY_INPUT_MODES.has(inquiryInputMode) ||
    !imageFile
  ) {
    return NextResponse.json(
      { error: "Alle felt må fylles ut." },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME.has(imageFile.type)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 },
    );
  }

  if (imageFile.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  // Upload image to Supabase Storage with userId/objectKey path
  const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}_${safeName}`;
  const objectKey = `${userId}/${fileName}`;
  const { error: storageError } = await supabase.storage
    .from("products")
    .upload(objectKey, imageFile, { contentType: imageFile.type });
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  try {
    await prisma.product.create({
      data: {
        name,
        description,
        category,
        inquiryInputMode,
        imageUrl: objectKey,
      },
    });
  } catch (error) {
    await supabase.storage.from("products").remove([objectKey]);
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  revalidatePath("/products");
  if (category.trim().toLowerCase() === "bordkort") {
    revalidatePath("/products/bordkort");
  }

  return NextResponse.json({ success: true });
}
