import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/requireAdmin";
import { objectKeyFromImageUrl } from "../../lib/storage";
import { prisma } from "../../lib/prisma";

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
  let imageId: bigint;
  try {
    imageId = BigInt(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = await prisma.carouselImage.findUnique({
    where: { id: imageId },
    select: { imageUrl: true },
  });

  if (!row) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Remove the file from storage (key format: <userId>/<filename>).
  const objectKey = objectKeyFromImageUrl(row.imageUrl, "carousel");
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
  try {
    await prisma.carouselImage.delete({ where: { id: imageId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { error: "Kunne ikke slette fra database: " + message },
      { status: 500 },
    );
  }

  // Refresh the cached home page so the change shows immediately.
  revalidatePath("/");
  revalidatePath("/api/carousel-images");

  return NextResponse.json({ success: true });
}
