import { Box } from "@mui/material";
import PictureCarousel from "./Components/PictureCarousel";
import HeroOverlay from "./Components/HeroOverlay";
import { prisma } from "./lib/prisma";
import { signImageUrl } from "./lib/storage";

async function fetchImages() {
  const data = await prisma.carouselImage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const images = await Promise.all(
    data.map(async (image) => ({
      id: image.id.toString(),
      title: image.title ?? undefined,
      description: image.description ?? undefined,
      public_url: await signImageUrl(image.imageUrl, "carousel"),
    })),
  );

  return images.filter(
    (img) =>
      !!img.public_url &&
      typeof img.public_url === "string" &&
      img.public_url.startsWith("http"),
  );
}

export const revalidate = 86400;

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
