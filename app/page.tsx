import { Typography } from "@mui/material";
import PictureCarousel from "./Components/PictureCarousel";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fetchImages() {
  const { data, error } = await supabase
    .from("carousel_images")
    .select("id, image_url, title, description, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  // Generate signed URLs for each image
  const imagesWithSignedUrls = await Promise.all(
    data.map(async (img) => {
      const fileName = img.image_url?.split("/").pop();
      const { data: signedUrlData } = await supabase.storage
        .from("carousel")
        .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
      return {
        ...img,
        signed_url: signedUrlData?.signedUrl ?? "",
      };
    })
  );
  return imagesWithSignedUrls;
}

export default async function Home() {
  const images = await fetchImages();
  return (
    <>
      <Typography variant="h3" align="center" gutterBottom>
        Welcome to Vatsii Designe
      </Typography>
      <PictureCarousel images={images} />
    </>
  );
}
