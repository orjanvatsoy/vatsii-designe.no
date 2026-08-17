"use client";

import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";

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
}

function formatFileSize(sizeBytes: number) {
  return sizeBytes < 1024 * 1024
    ? `${Math.ceil(sizeBytes / 1024)} kB`
    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OrderAttachments({
  attachments,
  showHeading = true,
}: OrderAttachmentsProps) {
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
          const previewable = attachment.contentType.startsWith("image/");
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
                  height: 110,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,0.04)",
                }}
              >
                {previewable ? (
                  <Box
                    component="img"
                    src={attachment.url}
                    alt={attachment.fileName}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit:
                        attachment.contentType === "image/svg+xml"
                          ? "contain"
                          : "cover",
                    }}
                  />
                ) : (
                  <InsertDriveFileOutlinedIcon
                    color="disabled"
                    sx={{ fontSize: 42 }}
                  />
                )}
              </Box>
              <Stack spacing={0.75} sx={{ p: 1.25 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ overflowWrap: "anywhere" }}
                >
                  {attachment.fileName}
                </Typography>
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
    </Box>
  );
}
