import { Box } from "@mui/material";
import PictureCarousel from "./Components/PictureCarousel";
import HeroOverlay from "./Components/HeroOverlay";
import { signImageUrl } from "./lib/storage";
import { prisma } from "./lib/prisma";

async function fetchImages() {
  const data = await prisma.carouselImage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const imagesWithSignedUrls = await Promise.all(
    data.map(async (image) => ({
      id: image.id.toString(),
      title: image.title ?? undefined,
      description: image.description ?? undefined,
      public_url: await signImageUrl(image.imageUrl, "carousel"),
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
