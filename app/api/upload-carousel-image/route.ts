import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;
  const userId = adminResult.user.id;

  const formData = await req.formData();
  const sharedTitle = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";

  // Support both bulk ("files") and legacy single ("file") uploads.
  const files = [
    ...formData.getAll("files"),
    ...formData.getAll("file"),
  ].filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Missing file(s)" }, { status: 400 });
  }

  const uploaded: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      errors.push(`${file.name}: ikke støttet filtype`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`${file.name}: filen er for stor (maks 5 MB)`);
      continue;
    }

    // Sanitize file name to avoid path/character issues.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}_${safeName}`;
    const objectKey = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("carousel")
      .upload(objectKey, file, { contentType: file.type });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const image_url = `${supabaseUrl}/storage/v1/object/public/carousel/${objectKey}`;

    // Use the shared title when given, otherwise fall back to the file name.
    const title = sharedTitle || file.name.replace(/\.[^.]+$/, "");

    const { error: dbError } = await supabase
      .from("carousel_images")
      .insert([{ image_url, title, description }]);

    if (dbError) {
      // Roll back the orphaned storage object so we don't leave junk.
      await supabase.storage.from("carousel").remove([objectKey]);
      errors.push(`${file.name}: ${dbError.message}`);
      continue;
    }

    uploaded.push(image_url);
  }

  // Refresh the cached home page so new images show immediately.
  if (uploaded.length > 0) revalidatePath("/");

  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: errors.join("; ") || "Ingen bilder ble lastet opp." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    uploadedCount: uploaded.length,
    errors,
  });
}
