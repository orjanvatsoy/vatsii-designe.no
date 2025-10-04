"use client";
import React, { useState, useRef, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { supabase } from "../lib/supabaseClient";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CardMedia from "@mui/material/CardMedia";
import CardActions from "@mui/material/CardActions";

// Images will be fetched from Supabase

interface PictureCarouselProps {
  images: Array<{
    public_url: string;
    id?: string;
    title?: string;
    description?: string;
  }>;
}

const PictureCarousel: React.FC<PictureCarouselProps> = ({ images }) => {
  const [index, setIndex] = useState(0);
  const [role, setRole] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  // Fetch user role for delete access
  useEffect(() => {
    const getRole = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setRole(profile.role || "");
      }
    };
    getRole();
  }, []);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Delete image and DB row
  const handleDelete = async () => {
    if (!images[index]?.id || !images[index]?.public_url) return;
    setDeleting(true);
    // Delete from Storage and DB (still client-side, could be moved to API for more security)
    const urlParts = images[index].public_url.split("/");
    const fileName = urlParts[urlParts.length - 1].split("?")[0];
    await supabase.storage.from("carousel").remove([fileName]);
    await supabase.from("carousel_images").delete().eq("id", images[index].id);
    // You must trigger a refresh from parent after delete, or use router.refresh()
    setIndex(0);
    setDeleting(false);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Touch event handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      if (Math.abs(distance) > 50) {
        if (distance > 0) {
          handleNext(); // swipe left
        } else {
          handlePrev(); // swipe right
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!images.length) {
    return <Typography>Ingen bilder funnet.</Typography>;
  }

  const current = images[index];

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Card sx={{ minWidth: 320, maxWidth: 500 }}>
        <CardMedia
          component="img"
          height="440"
          image={current.public_url}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
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
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            {role === "King" && (
              <Button
                color="error"
                variant="contained"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Sletter..." : "Slett bilde"}
              </Button>
            )}
          </Box>
          <IconButton onClick={handleNext} aria-label="next image">
            <ArrowForwardIosIcon />
          </IconButton>
        </CardActions>
      </Card>
    </Box>
  );
};

export default PictureCarousel;
