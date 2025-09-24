"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CardMedia from "@mui/material/CardMedia";
import CardActions from "@mui/material/CardActions";
import { CardHeader } from "@mui/material";

const images = [
  {
    src: "/CarouselPic/IMG_4936.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5202.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5203.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5204.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5223.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5563.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5683.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5829.JPEG",
  },
  {
    src: "/CarouselPic/IMG_5844.JPEG",
  },
];

export default function PictureCarousel() {
  const [index, setIndex] = React.useState(0);

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Card sx={{ minWidth: 320, maxWidth: 500 }}>
        <CardMedia component="img" height="440" image={images[index].src} />
        <CardActions
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton onClick={handlePrev} aria-label="previous image">
            <ArrowBackIosNewIcon />
          </IconButton>
          <IconButton onClick={handleNext} aria-label="next image">
            <ArrowForwardIosIcon />
          </IconButton>
        </CardActions>
      </Card>
    </Box>
  );
}
