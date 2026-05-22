import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../lib/requireAdmin";

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

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

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

  // Upload image to Supabase Storage
  const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}_${safeName}`;
  const { error: storageError } = await supabase.storage
    .from("products")
    .upload(fileName, imageFile, { contentType: imageFile.type });
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("products")
    .getPublicUrl(fileName);
  const imageUrl = publicUrlData?.publicUrl;

  // Save product to DB
  const { error: dbError } = await supabase.from("products").insert([
    {
      name,
      description,
      category,
      image_url: imageUrl,
    },
  ]);
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
