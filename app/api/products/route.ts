import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/requireAdmin";
import { prisma } from "../../lib/prisma";

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

export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const products = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return NextResponse.json({
    categories: products.map((product) => product.category),
  });
}

export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;
  const userId = adminResult.user.id;

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const imageFile = formData.get("image") as File;

  if (!name || !description || !category || !imageFile) {
    return NextResponse.json(
      { error: "All fields are required!" },
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
