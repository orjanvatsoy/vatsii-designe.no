"use client";
import { Box, Button, Stack, Typography } from "@mui/material";

export default function HeroOverlay() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Top group: overline + title */}
      <Stack
        spacing={2}
        alignItems="center"
        textAlign="center"
        sx={{
          maxWidth: 760,
          px: { xs: 2.5, sm: 3.5, md: 4.5 },
          py: { xs: 2, md: 2.5 },
          borderRadius: 4,
          bgcolor: "rgba(20,19,14,0.5)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px -30px rgba(0,0,0,0.85)",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 6,
            color: "primary.light",
            fontWeight: 600,
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          HÅNDLAGET MED OMTANKE
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            lineHeight: 1.0,
            fontSize: { xs: "2.4rem", sm: "3.6rem", md: "5rem" },
            letterSpacing: { xs: 0, md: 2 },
            color: "#fff",
            textShadow: "0 6px 40px rgba(0,0,0,0.7)",
          }}
        >
          Vatsii Designe
        </Typography>
      </Stack>

      {/* Bottom group: actions */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        sx={{ width: { xs: "100%", sm: "auto" }, px: { xs: 2, md: 4 } }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          href="/products"
          sx={{
            px: 4.5,
            py: 1.4,
            fontSize: "1rem",
          }}
        >
          Se alle produkter
        </Button>
        <Button
          variant="outlined"
          size="large"
          href="/contact"
          sx={{
            px: 4.5,
            py: 1.4,
            fontSize: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          Ta kontakt
        </Button>
      </Stack>
    </Box>
  );
}
