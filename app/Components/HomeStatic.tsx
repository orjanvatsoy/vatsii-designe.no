"use client";

import { Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const PictureCarousel = dynamic(() => import("./PictureCarousel"), {
  ssr: false,
});

type Picture = {
  public_url: string;
  id?: string;
  title?: string;
  description?: string;
};

export default function HomeStatic({ images }: { images: Picture[] }) {
  return (
    <>
      <Typography variant="h3" align="center" gutterBottom>
        Welcome to Vatsii Designe
      </Typography>
      <Suspense fallback={<Typography>Loading images...</Typography>}>
        <PictureCarousel images={images} />
      </Suspense>
    </>
  );
}
