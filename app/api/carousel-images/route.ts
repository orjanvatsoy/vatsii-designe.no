import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Use environment variables for service role key and URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  // Log environment variables
  console.log(
    "SUPABASE_SERVICE_ROLE_KEY:",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log(
    "NEXT_PUBLIC_SUPABASE_URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  // Fetch all carousel images
  console.log("Fetching carousel images from DB...");
  const { data, error } = await supabase
    .from("carousel_images")
    .select("id, image_url, title, description, created_at")
    .order("created_at", { ascending: false });
  console.log("DB fetch result:", { data, error });

  if (error) {
    console.error("Supabase DB error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs for each image
  const imagesWithSignedUrls = await Promise.all(
    (data ?? []).map(async (img) => {
      console.log("Image row:", img);
      // Extract filename from image_url
      const fileName = img.image_url?.split("/").pop();
      console.log("Extracted fileName:", fileName);
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("carousel")
          .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
      if (signedUrlError) {
        console.error("Signed URL error:", signedUrlError.message);
      }
      return {
        ...img,
        signed_url: signedUrlData?.signedUrl ?? null,
        signed_url_error: signedUrlError?.message ?? null,
      };
    })
  );

  return NextResponse.json(imagesWithSignedUrls);
}
