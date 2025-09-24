import { Typography } from "@mui/material";
import PictureCarousel from "./Components/PictureCarousel";

export default function Home() {
  return (
    <>
      <Typography variant="h3" align="center" gutterBottom>
        Welcome to Vatsii Designe
      </Typography>
      <PictureCarousel />
    </>
  );
}
