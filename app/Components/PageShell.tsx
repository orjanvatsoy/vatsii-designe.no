import { Box, Container, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageShellProps {
  /** Big gradient title shown in the glam header. Omit to hide the header. */
  title?: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** Supporting text below the title. */
  subtitle?: string;
  /** Constrain the content width. Defaults to "lg". */
  maxWidth?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}

/**
 * Shared page wrapper that gives every page the branded gradient background
 * and a glam header.
 */
export default function PageShell({
  title,
  eyebrow,
  subtitle,
  maxWidth = "lg",
  children,
}: PageShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        mt: { xs: "-64px", sm: "-72px" },
        pt: { xs: "64px", sm: "72px" },
        background:
          "radial-gradient(110% 60% at 50% 0%, rgba(139,94,60,0.22) 0%, rgba(28,28,26,0) 55%), linear-gradient(180deg, #1C1C1A 0%, #211F1B 100%)",
        pb: 10,
      }}
    >
      <Container maxWidth={maxWidth} sx={{ pt: { xs: 4, md: 6 } }}>
        {title && (
          <Stack
            spacing={1.5}
            alignItems="center"
            textAlign="center"
            mb={{ xs: 5, md: 7 }}
          >
            {eyebrow && (
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: 6,
                  color: "primary.light",
                  fontWeight: 600,
                }}
              >
                {eyebrow}
              </Typography>
            )}
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                fontSize: { xs: "2.4rem", sm: "3.2rem", md: "4rem" },
                background:
                  "linear-gradient(120deg, #EAE6E1 0%, #D9A066 55%, #8B5E3C 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  maxWidth: 560,
                  color: "text.secondary",
                  fontSize: "1.05rem",
                }}
              >
                {subtitle}
              </Typography>
            )}
            <Box
              sx={{
                width: 64,
                height: 3,
                borderRadius: 2,
                mt: 1,
                background:
                  "linear-gradient(90deg, rgba(217,160,102,0) 0%, #D9A066 50%, rgba(217,160,102,0) 100%)",
              }}
            />
          </Stack>
        )}

        {children}
      </Container>
    </Box>
  );
}
