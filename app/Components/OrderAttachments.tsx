"use client";

import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Rotate90DegreesCwIcon from "@mui/icons-material/Rotate90DegreesCw";
import Rotate90DegreesCcwIcon from "@mui/icons-material/Rotate90DegreesCcw";
import SearchIcon from "@mui/icons-material/Search";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export interface OrderAttachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  downloadUrl: string;
}

interface OrderAttachmentsProps {
  attachments: OrderAttachment[];
  showHeading?: boolean;
  showFileName?: boolean;
}

function formatFileSize(sizeBytes: number) {
  return sizeBytes < 1024 * 1024
    ? `${Math.ceil(sizeBytes / 1024)} kB`
    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewableImage(attachment: OrderAttachment) {
  return (
    attachment.contentType.startsWith("image/") ||
    /\.(?:jpe?g|png|webp|svg)$/i.test(attachment.fileName)
  );
}

function isSvgAttachment(attachment: OrderAttachment) {
  return /(?:image\/svg\+xml|\.svg$)/i.test(
    `${attachment.contentType} ${attachment.fileName}`,
  );
}

// Light oak accent from the app theme (theme.ts palette.primary.light) — reads clearly against the dark UI.
const SVG_CONTRAST_COLOR = "#D9A066";

// SVG design files often use dark strokes/fills meant for a white canvas, which
// disappear against this app's dark theme. Recolor them to a theme contrast
// color so they stay visible without altering the original file.
const recoloredSvgCache = new Map<string, Promise<string | null>>();

function getContrastSvgSrc(url: string): Promise<string | null> {
  let cached = recoloredSvgCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((response) => (response.ok ? response.text() : null))
      .then((source) => {
        if (!source || !/<svg(?:\s|>)/i.test(source)) return null;
        const recolored = source.replace(
          /<svg([^>]*)>/i,
          `<svg$1><style>*{fill:${SVG_CONTRAST_COLOR} !important;stroke:${SVG_CONTRAST_COLOR} !important;}</style>`,
        );
        return `data:image/svg+xml,${encodeURIComponent(recolored)}`;
      })
      .catch(() => null);
    recoloredSvgCache.set(url, cached);
  }
  return cached;
}

function useContrastSvgSrc(attachment: OrderAttachment | null) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    if (!attachment || !isSvgAttachment(attachment)) return;
    let cancelled = false;
    getContrastSvgSrc(attachment.url).then((result) => {
      if (!cancelled) setSrc(result);
    });
    return () => {
      cancelled = true;
    };
  }, [attachment]);

  return src;
}

function AttachmentPreview({
  attachment,
  onOpen,
}: {
  attachment: OrderAttachment;
  onOpen: () => void;
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const contrastSrc = useContrastSvgSrc(attachment);

  if (!isPreviewableImage(attachment) || loadFailed) {
    return (
      <InsertDriveFileOutlinedIcon color="disabled" sx={{ fontSize: 42 }} />
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      aria-label={`Åpne stort bilde av ${attachment.fileName}`}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        p: 0,
        border: 0,
        background: "none",
        cursor: "zoom-in",
        display: "block",
        "&:hover .attachment-zoom-hint": { opacity: 1 },
      }}
    >
      <Box
        component="img"
        src={contrastSrc ?? attachment.url}
        alt={attachment.fileName}
        onError={() => setLoadFailed(true)}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: isSvgAttachment(attachment) ? "contain" : "cover",
        }}
      />
      <Box
        className="attachment-zoom-hint"
        aria-hidden
        sx={{
          position: "absolute",
          right: 6,
          bottom: 6,
          width: 28,
          height: 28,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "rgba(20,20,18,0.78)",
          color: "common.white",
          opacity: { xs: 1, sm: 0.72 },
          transition: "opacity 160ms ease",
        }}
      >
        <SearchIcon sx={{ fontSize: 16 }} />
      </Box>
    </Box>
  );
}

function AttachmentViewerDialog({
  attachment,
  onClose,
}: {
  attachment: OrderAttachment | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const contrastSrc = useContrastSvgSrc(attachment);

  if (!attachment) return null;

  const handleClose = () => {
    onClose();
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog
      open={Boolean(attachment)}
      onClose={handleClose}
      fullScreen
      aria-labelledby="attachment-viewer-title"
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
          id="attachment-viewer-title"
          fontWeight={700}
          noWrap
          sx={{ minWidth: 0 }}
        >
          {attachment.fileName}
        </Typography>
        <Stack direction="row" alignItems="center" flexShrink={0}>
          <Tooltip title="Roter mot venstre">
            <IconButton
              color="inherit"
              aria-label="Roter mot venstre"
              onClick={() => setRotation((value) => value - 90)}
            >
              <Rotate90DegreesCcwIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Roter mot høyre">
            <IconButton
              color="inherit"
              aria-label="Roter mot høyre"
              onClick={() => setRotation((value) => value + 90)}
            >
              <Rotate90DegreesCwIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom ut">
            <span>
              <IconButton
                color="inherit"
                aria-label="Zoom ut"
                disabled={zoom <= 0.5}
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
              >
                <ZoomOutIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ width: 44, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <Tooltip title="Zoom inn">
            <span>
              <IconButton
                color="inherit"
                aria-label="Zoom inn"
                disabled={zoom >= 4}
                onClick={() => setZoom((value) => Math.min(4, value + 0.25))}
              >
                <ZoomInIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Tilbakestill">
            <IconButton
              color="inherit"
              aria-label="Tilbakestill zoom og rotasjon"
              onClick={() => {
                setZoom(1);
                setRotation(0);
              }}
            >
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Åpne original">
            <IconButton
              color="inherit"
              aria-label="Åpne originalfilen i ny fane"
              component="a"
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lukk">
            <IconButton
              color="inherit"
              aria-label="Lukk filvisning"
              onClick={handleClose}
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
          display: "grid",
          placeItems: "center",
          p: 2,
        }}
      >
        <Box
          component="img"
          src={contrastSrc ?? attachment.url}
          alt={attachment.fileName}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            transform: `rotate(${rotation}deg) scale(${zoom})`,
            transition: "transform 160ms ease",
          }}
        />
      </Box>
    </Dialog>
  );
}

export default function OrderAttachments({
  attachments,
  showHeading = true,
  showFileName = true,
}: OrderAttachmentsProps) {
  const [selected, setSelected] = useState<OrderAttachment | null>(null);

  if (attachments.length === 0) return null;

  return (
    <Box>
      {showHeading && (
        <Typography variant="h6" fontWeight={700} mb={1.5}>
          Filer og bilder
        </Typography>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 1.5,
        }}
      >
        {attachments.map((attachment) => {
          return (
            <Box
              key={attachment.id}
              sx={{
                minWidth: 0,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: 150,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,0.04)",
                }}
              >
                <AttachmentPreview
                  attachment={attachment}
                  onOpen={() => setSelected(attachment)}
                />
              </Box>
              <Stack spacing={0.75} sx={{ p: 1.25 }}>
                {showFileName && (
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    {attachment.fileName}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(attachment.sizeBytes)}
                </Typography>
                <Button
                  component="a"
                  href={attachment.downloadUrl}
                  size="small"
                  startIcon={<DownloadIcon />}
                  download={attachment.fileName}
                >
                  Last ned
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Box>
      <AttachmentViewerDialog
        attachment={selected}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
