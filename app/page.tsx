import { Typography } from "@mui/material";
import PictureCarousel from "./Components/PictureCarousel";

async function fetchImages() {
  const res = await fetch("http://localhost:3000/api/carousel-images", {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return await res.json();
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
