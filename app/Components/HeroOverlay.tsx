"use client";
import { useState } from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

export default function HeroOverlay() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        startIcon={<KeyboardArrowUpIcon />}
        sx={{
          color: "#fff",
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: 1,
          px: 2.5,
          py: 1,
          borderRadius: 999,
          bgcolor: "rgba(20,19,14,0.55)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.12)",
          "&:hover": { bgcolor: "rgba(20,19,14,0.75)" },
        }}
      >
        Vis info
      </Button>
    );
  }

  return (
    <Stack
      spacing={3}
      alignItems="center"
      textAlign="center"
      sx={{
        position: "relative",
        maxWidth: 760,
        px: { xs: 3, sm: 5, md: 7 },
        py: { xs: 4, md: 5 },
        borderRadius: 5,
        bgcolor: "rgba(20,19,14,0.55)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.85)",
      }}
    >
      {/* Hide toggle */}
      <IconButton
        aria-label="Skjul info"
        onClick={() => setOpen(false)}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "rgba(255,255,255,0.75)",
          "&:hover": {
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.1)",
          },
        }}
      >
        <KeyboardArrowDownIcon />
      </IconButton>

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
      <Typography
        sx={{
          maxWidth: 640,
          fontSize: { xs: "1rem", md: "1.2rem" },
          color: "rgba(234,230,225,0.92)",
          fontWeight: 400,
          textShadow: "0 2px 16px rgba(0,0,0,0.7)",
        }}
      >
        Unike trearbeider og design laget for å vare. Oppdag håndlagde produkter
        med karakter, varme og nordisk sjel.
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mt={1}
        sx={{ width: { xs: "100%", sm: "auto" } }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          href="/products"
          sx={{
            px: 4.5,
            py: 1.4,
            borderRadius: 999,
            fontWeight: 700,
            fontSize: "1rem",
            boxShadow: "0 14px 40px rgba(139,94,60,0.55)",
            textTransform: "none",
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
            borderRadius: 999,
            fontWeight: 700,
            fontSize: "1rem",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(4px)",
            textTransform: "none",
            "&:hover": {
              borderColor: "#fff",
              bgcolor: "rgba(255,255,255,0.08)",
            },
          }}
        >
          Ta kontakt
        </Button>
      </Stack>
    </Stack>
  );
}
