"use client";

import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
  Box,
  Dialog,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";

interface ProductImageViewerProps {
  src: string;
  alt: string;
  priority?: boolean;
  compact?: boolean;
  positionX?: number;
  positionY?: number;
  rotation?: number;
  imageZoom?: number;
}

export default function ProductImageViewer({
  src,
  alt,
  priority = false,
  compact = false,
  positionX = 50,
  positionY = 50,
  rotation = 0,
  imageZoom = 100,
}: ProductImageViewerProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const coverScale = (rotation % 180 === 0 ? 1 : 1.7) * (imageZoom / 100);

  const closeViewer = () => {
    setOpen(false);
    setZoom(1);
  };

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={`Åpne stort bilde av ${alt}`}
        onClick={() => setOpen(true)}
        sx={{
          position: "relative",
          width: "100%",
          height: compact
            ? { xs: 170, sm: 210 }
            : { xs: 280, sm: 380, md: 440 },
          display: "block",
          p: 0,
          border: 0,
          bgcolor: "#16150F",
          cursor: "zoom-in",
          overflow: "hidden",
          "&:focus-visible": {
            outline: "3px solid",
            outlineColor: "primary.light",
            outlineOffset: -3,
          },
          "&:hover .product-detail-image": {
            transform: `rotate(${rotation}deg) scale(${coverScale * 1.025})`,
          },
          "&:hover .zoom-hint, &:focus-visible .zoom-hint": {
            opacity: 1,
          },
        }}
      >
        <Image
          className="product-detail-image"
          src={src}
          alt={alt}
          fill
          style={{
            objectFit: "cover",
            objectPosition: `${positionX}% ${positionY}%`,
            transform: `rotate(${rotation}deg) scale(${coverScale})`,
            transition: "transform 220ms ease",
          }}
          priority={priority}
          sizes={
            compact
              ? "(max-width: 600px) 100vw, 33vw"
              : "(max-width: 600px) 100vw, 720px"
          }
        />
        <Box
          className="zoom-hint"
          aria-hidden
          sx={{
            position: "absolute",
            right: 16,
            bottom: 16,
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "rgba(20,20,18,0.82)",
            color: "common.white",
            opacity: { xs: 1, md: 0.72 },
            transition: "opacity 160ms ease",
          }}
        >
          <ZoomInIcon />
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={closeViewer}
        fullScreen
        aria-labelledby="product-image-viewer-title"
        slotProps={{
          paper: { sx: { bgcolor: "#11110F", backgroundImage: "none" } },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: 64,
            px: { xs: 1, sm: 2 },
            borderBottom: "1px solid rgba(255,255,255,0.16)",
            bgcolor: "#1B1B18",
          }}
        >
          <Typography
            id="product-image-viewer-title"
            fontWeight={700}
            noWrap
            sx={{ minWidth: 0 }}
          >
            {alt}
          </Typography>
          <Stack direction="row" alignItems="center" flexShrink={0}>
            <Tooltip title="Zoom ut">
              <span>
                <IconButton
                  color="inherit"
                  aria-label="Zoom ut"
                  disabled={zoom <= 1}
                  onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
                >
                  <ZoomOutIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Typography
              variant="caption"
              sx={{ width: 44, textAlign: "center" }}
            >
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title="Zoom inn">
              <span>
                <IconButton
                  color="inherit"
                  aria-label="Zoom inn"
                  disabled={zoom >= 4}
                  onClick={() => setZoom((value) => Math.min(4, value + 0.5))}
                >
                  <ZoomInIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Tilbakestill zoom">
              <IconButton
                color="inherit"
                aria-label="Tilbakestill zoom"
                onClick={() => setZoom(1)}
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Åpne original">
              <IconButton
                color="inherit"
                aria-label="Åpne originalbildet i ny fane"
                component="a"
                href={src}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Lukk">
              <IconButton
                color="inherit"
                aria-label="Lukk bildevisning"
                onClick={closeViewer}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box
          sx={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            overscrollBehavior: "contain",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: `${zoom * 100}%`,
              height: `${zoom * 100}%`,
              minWidth: "100%",
              minHeight: "100%",
              transition: "width 160ms ease, height 160ms ease",
            }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              style={{
                objectFit: "contain",
                transform: `rotate(${rotation}deg) scale(${rotation % 180 === 0 ? 1 : 0.7})`,
              }}
              priority
            />
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
