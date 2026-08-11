"use client";
import React, { useState, useRef, useEffect } from "react";
import { Skeleton } from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import { getCurrentProfileRole } from "../lib/profileClient";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Typography, Box, IconButton, Button } from "@mui/material";
import Image from "next/image";

// Images will be fetched from Supabase

interface PictureCarouselProps {
  images: Array<{
    public_url: string;
    id?: string;
    title?: string;
    description?: string;
  }>;
  fullBleed?: boolean;
  overlay?: React.ReactNode;
}

const PictureCarousel: React.FC<PictureCarouselProps> = ({
  images,
  fullBleed = false,
  overlay,
}) => {
  const [pictures, setPictures] = useState(images);
  const [index, setIndex] = useState(0);
  const [role, setRole] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false); // Declare useState for imageLoaded only once
  // Fetch user role for delete access
  useEffect(() => {
    const getRole = async () => {
      setRole(await getCurrentProfileRole());
    };
    getRole();
  }, []);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Delete image and DB row via the admin API (service-role, bypasses RLS).
  const handleDelete = async () => {
    setErrorMsg("");
    const target = pictures[index];
    if (!target?.id) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setErrorMsg("Du må være logget inn.");
        setDeleting(false);
        return;
      }
      const res = await fetch("/api/delete-carousel-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: target.id }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || "Kunne ikke slette bilde.");
        setDeleting(false);
        return;
      }
      // Update the local list so the change is reflected immediately.
      const newPictures = pictures.filter((_, i) => i !== index);
      setPictures(newPictures);
      setIndex(0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg("Uventet feil: " + err.message);
      } else {
        setErrorMsg("Uventet feil: " + String(err));
      }
    }
    setDeleting(false);
  };

  const handlePrev = () => {
    setImageLoaded(false);
    setIndex((prev) => (prev === 0 ? pictures.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setImageLoaded(false);
    setIndex((prev) => (prev === pictures.length - 1 ? 0 : prev + 1));
  };
  const goTo = (i: number) => {
    if (i === index) return;
    setImageLoaded(false);
    setIndex(i);
  };

  // Respect users who prefer reduced motion.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Track mobile viewport so the hero image can center vertically on phones.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Auto-advance every 6s, pause on hover/focus and when reduced motion is on.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || reducedMotion || pictures.length <= 1) return;
    const id = setInterval(() => {
      setImageLoaded(false);
      setIndex((prev) => (prev === pictures.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(id);
  }, [paused, reducedMotion, pictures.length]);

  // Keyboard navigation (left/right arrows).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (pictures.length <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
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

  if (!pictures.length) {
    if (fullBleed) {
      return (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(120% 90% at 50% -10%, rgba(139,94,60,0.35) 0%, rgba(22,21,15,0) 60%), linear-gradient(180deg, #1C1C1A 0%, #211F1B 100%)",
          }}
        >
          {overlay && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 3, md: 8 },
              }}
            >
              {overlay}
            </Box>
          )}
        </Box>
      );
    }
    return <Typography>Ingen bilder funnet.</Typography>;
  }

  // Vis feilmelding hvis noe går galt
  if (errorMsg) {
    return <Typography color="error">{errorMsg}</Typography>;
  }

  const current = pictures[index];

  return (
    <Box
      sx={{
        position: "relative",
        height: fullBleed ? "100%" : "auto",
        outline: "none",
      }}
      role="region"
      aria-roledescription="karusell"
      aria-label="Bildekarusell"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: fullBleed ? "100%" : { xs: 320, sm: 420, md: 480 },
          bgcolor: "#16150F",
          overflow: "hidden",
        }}
        aria-live="polite"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!imageLoaded && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          />
        )}
        <Image
          key={current.public_url}
          src={current.public_url}
          alt={current.title || "Bilde"}
          fill
          style={{
            objectFit: fullBleed && !isMobile ? "contain" : "cover",
            objectPosition: fullBleed && !isMobile ? "center 80%" : "center",
            backgroundColor: fullBleed ? "#000" : undefined,
            opacity: imageLoaded ? 1 : 0,
            transform:
              imageLoaded || reducedMotion || fullBleed
                ? "scale(1)"
                : "scale(1.04)",
            transition: reducedMotion
              ? "opacity 0.3s ease"
              : fullBleed
                ? "opacity 0.6s ease"
                : "opacity 0.8s ease, transform 7s ease-out",
          }}
          priority={index === 0}
          sizes="100vw"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Cinematic gradient overlay */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: fullBleed
              ? "linear-gradient(to top, rgba(15,14,10,0.85) 0%, rgba(15,14,10,0.35) 40%, rgba(15,14,10,0.25) 70%, rgba(15,14,10,0.55) 100%)"
              : "linear-gradient(to top, rgba(15,14,10,0.85) 0%, rgba(15,14,10,0.15) 35%, rgba(15,14,10,0) 60%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Hero overlay content (full-bleed only) */}
        {fullBleed && overlay && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              display: "flex",
              alignItems: "stretch",
              justifyContent: "center",
              px: { xs: 2, md: 6 },
              py: { xs: 9, md: 11 },
              pointerEvents: "none",
              "& a, & button": { pointerEvents: "auto" },
            }}
          >
            {overlay}
          </Box>
        )}

        {/* Per-image caption (card mode only) */}
        {!fullBleed && (current.title || current.description) && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              p: { xs: 2, sm: 3 },
              zIndex: 3,
            }}
          >
            {current.title && (
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#fff", lineHeight: 1.2 }}
              >
                {current.title}
              </Typography>
            )}
            {current.description && (
              <Typography
                variant="body2"
                sx={{ color: "rgba(234,230,225,0.85)", mt: 0.5 }}
              >
                {current.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Floating nav arrows */}
        {pictures.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              aria-label="previous image"
              sx={{
                position: "absolute",
                top: "50%",
                left: { xs: 12, md: 28 },
                transform: "translateY(-50%)",
                zIndex: 4,
                color: "#fff",
                bgcolor: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(139,94,60,0.85)" },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              aria-label="next image"
              sx={{
                position: "absolute",
                top: "50%",
                right: { xs: 12, md: 28 },
                transform: "translateY(-50%)",
                zIndex: 4,
                color: "#fff",
                bgcolor: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(139,94,60,0.85)" },
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </>
        )}

        {/* Image counter */}
        {pictures.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 76, md: 96 },
              right: { xs: 12, md: 28 },
              zIndex: 4,
              px: 1.4,
              py: 0.4,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(6px)",
            }}
          >
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(pictures.length).padStart(2, "0")}
          </Box>
        )}

        {/* Dot indicators (overlaid in full-bleed) */}
        {pictures.length > 1 && (
          <Box
            sx={{
              position: fullBleed ? "absolute" : "static",
              bottom: fullBleed ? 28 : undefined,
              left: fullBleed ? 0 : undefined,
              right: fullBleed ? 0 : undefined,
              zIndex: 4,
              display: "flex",
              justifyContent: "center",
              gap: 1,
              py: fullBleed ? 0 : 1.5,
            }}
          >
            {pictures.map((_, i) => (
              <Box
                key={i}
                role="button"
                aria-label={`Gå til bilde ${i + 1}`}
                onClick={() => goTo(i)}
                sx={{
                  width: i === index ? 28 : 8,
                  height: 8,
                  borderRadius: 999,
                  cursor: "pointer",
                  bgcolor:
                    i === index ? "primary.light" : "rgba(234,230,225,0.4)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Admin delete control */}
      {role === "King" && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            position: fullBleed ? "absolute" : "static",
            bottom: fullBleed ? 16 : undefined,
            right: fullBleed ? 16 : undefined,
            left: fullBleed ? "auto" : undefined,
            zIndex: 5,
            pb: fullBleed ? 0 : 2,
            pt: fullBleed ? 0 : 0,
          }}
        >
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Sletter..." : "Slett bilde"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PictureCarousel;
