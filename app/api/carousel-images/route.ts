import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

// Use environment variables for service role key and URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  // Fetch all carousel images
  const data = await prisma.carouselImage.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Generate signed URLs for each image, supporting both old and new object key formats
  const imagesWithSignedUrls = await Promise.all(
    data.map(async (img) => {
      let objectKey = null;
      if (img.imageUrl.includes("/carousel/")) {
        // New format: .../carousel/userid/filename.jpg
        objectKey = img.imageUrl.split("/carousel/")[1];
      } else if (img.imageUrl) {
        // Old format: just the filename
        objectKey = img.imageUrl.split("/").pop();
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
        id: img.id.toString(),
        image_url: img.imageUrl,
        title: img.title,
        description: img.description,
        created_at: img.createdAt,
        signed_url: signedUrlData?.signedUrl ?? null,
        signed_url_error: signedUrlError?.message ?? null,
      };
    }),
  );

  return NextResponse.json(imagesWithSignedUrls);
}
