import { Box } from "@mui/material";
import PictureCarousel from "./Components/PictureCarousel";
import HeroOverlay from "./Components/HeroOverlay";
import { createClient } from "@supabase/supabase-js";
import { signImageUrl } from "./lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchImages() {
  // Fetch images directly from Supabase and generate signed URLs
  const { data, error } = await supabase
    .from("carousel_images")
    .select("id, image_url, title, description, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const imagesWithSignedUrls = await Promise.all(
    data.map(async (img) => ({
      ...img,
      public_url: await signImageUrl(img.image_url, "carousel"),
    })),
  );
  // Filter out images with missing or invalid URLs
  return imagesWithSignedUrls.filter(
    (img) =>
      !!img.public_url &&
      typeof img.public_url === "string" &&
      img.public_url.startsWith("http"),
  );
}

export const revalidate = 300;

export default async function Home() {
  const images = await fetchImages();

  return (
    <Box
      className="full-bleed"
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: 560,
        overflow: "hidden",
      }}
    >
      <PictureCarousel images={images} fullBleed overlay={<HeroOverlay />} />
    </Box>
  );
}
