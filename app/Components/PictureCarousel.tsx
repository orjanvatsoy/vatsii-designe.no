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

const PictureCarousel: React.FC = () => {
  const [images, setImages] = useState<
    Array<{ image_url: string; id?: string }>
  >([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("carousel_images")
        .select("id, image_url")
        .order("created_at", { ascending: false });
      if (data) setImages(data);
      setLoading(false);
    };
    fetchImages();
  }, []);
  // Delete image and DB row
  const handleDelete = async () => {
    if (!images[index]?.id || !images[index]?.image_url) return;
    setDeleting(true);
    // Delete from Storage
    const urlParts = images[index].image_url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    await supabase.storage.from("carousel").remove([fileName]);
    // Delete from DB
    await supabase.from("carousel_images").delete().eq("id", images[index].id);
    // Remove from local state
    setImages((prev) => prev.filter((_, i) => i !== index));
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

  if (loading) {
    return <Typography>Henter bilder...</Typography>;
  }
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
          image={current.image_url}
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
