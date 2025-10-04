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

  // Generate signed URLs for each image
  const imagesWithSignedUrls = await Promise.all(
    (data ?? []).map(async (img) => {
      // Extract filename from image_url
      const fileName = img.image_url?.split("/").pop();
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("carousel")
          .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
      return {
        ...img,
        signed_url: signedUrlData?.signedUrl ?? null,
        signed_url_error: signedUrlError?.message ?? null,
      };
    })
  );

  return NextResponse.json(imagesWithSignedUrls);
}
