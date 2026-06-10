import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/requireAdmin";
import { objectKeyFromImageUrl } from "../../lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: Request) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Look up the row so we can derive the storage object key reliably.
  const { data: row, error: fetchError } = await supabase
    .from("carousel_images")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Remove the file from storage (key format: <userId>/<filename>).
  const objectKey = objectKeyFromImageUrl(row.image_url, "carousel");
  if (objectKey) {
    const { error: storageError } = await supabase.storage
      .from("carousel")
      .remove([objectKey]);
    if (storageError) {
      return NextResponse.json(
        { error: "Kunne ikke slette fra storage: " + storageError.message },
        { status: 500 },
      );
    }
  }

  // Remove the database row.
  const { error: dbError } = await supabase
    .from("carousel_images")
    .delete()
    .eq("id", id);
  if (dbError) {
    return NextResponse.json(
      { error: "Kunne ikke slette fra database: " + dbError.message },
      { status: 500 },
    );
  }

  // Refresh the cached home page so the change shows immediately.
  revalidatePath("/");

  return NextResponse.json({ success: true });
}
