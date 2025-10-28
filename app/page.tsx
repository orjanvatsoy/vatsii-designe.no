import { createClient } from "@supabase/supabase-js";
import HomeStatic from "./Components/HomeStatic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchImages() {
  const { data, error } = await supabase
    .from("carousel_images")
    .select("id, image_url, title, description, created_at")
    .order("created_at", { ascending: false })
    .abortSignal(AbortSignal.timeout(5000));
  if (error || !data) return [];

  // Generate public URLs for each image
  const imagesWithPublicUrls = data.map((img) => {
    const fileName = img.image_url?.split("/").pop();
    const { data: publicUrlData } = supabase.storage
      .from("carousel")
      .getPublicUrl(fileName);
    return {
      ...img,
      public_url: publicUrlData?.publicUrl ?? "",
    };
  });
  return imagesWithPublicUrls;
}

export const revalidate = 0;

export default async function Home() {
  const images = await fetchImages();
  return <HomeStatic images={images} />;
}
