import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Use environment variables for service role key and URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  // Fetch all carousel images
  const { data, error } = await supabase
    .from("carousel_images")
    .select("id, image_url, title, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // ...existing code...
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs for each image, supporting both old and new object key formats
  const imagesWithSignedUrls = await Promise.all(
    (data ?? []).map(async (img) => {
      let objectKey = null;
      if (img.image_url?.includes("/carousel/")) {
        // New format: .../carousel/userid/filename.jpg
        objectKey = img.image_url.split("/carousel/")[1];
      } else if (img.image_url) {
        // Old format: just the filename
        objectKey = img.image_url.split("/").pop();
      }
      let signedUrlData = null;
      let signedUrlError = null;
      if (objectKey) {
        const result = await supabase.storage
          .from("carousel")
          .createSignedUrl(objectKey, 60 * 60); // 1 hour expiry
        signedUrlData = result.data;
        signedUrlError = result.error;
      }
      return {
        ...img,
        signed_url: signedUrlData?.signedUrl ?? null,
        signed_url_error: signedUrlError?.message ?? null,
      };
    }),
  );

  return NextResponse.json(imagesWithSignedUrls);
}
