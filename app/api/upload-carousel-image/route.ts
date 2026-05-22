import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!file || !title) {
    return NextResponse.json(
      { error: "Missing file or title" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  // Sanitize file name to avoid path/character issues.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}_${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("carousel")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL (for preview, but you will use signed URL for display)
  const image_url = `${supabaseUrl}/storage/v1/object/public/carousel/${fileName}`;

  // Insert metadata into DB
  const { error: dbError } = await supabase
    .from("carousel_images")
    .insert([{ image_url, title, description }]);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, image_url });
}
