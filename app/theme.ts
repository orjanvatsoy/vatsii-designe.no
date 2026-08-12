"use client";
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: `"Asap", "Helvetica", "Arial", sans-serif`,
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#8B5E3C", // Valnøtt brun
      light: "#D9A066", // Lys eik
      dark: "#5A3924",
    },
    secondary: {
      main: "#3F6B4A", // Jordgrønn
      dark: "#324F3A",
    },
    background: {
      default: "#1C1C1A", // Hovedbakgrunn
      paper: "#2A2A26", // Kort/containers
    },
    text: {
      primary: "#EAE6E1",
      secondary: "#C0B8AD",
    },
    success: {
      main: "#06d6a0", // kan beholdes som ekstra accent
    },
    warning: {
      main: "#ffca3a",
    },
    error: {
      main: "#fa3947",
    },
    info: {
      main: "#41DDFF",
    },
    divider: "#3A332C",
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const accent =
            ownerState.severity === "error"
              ? theme.palette.error.main
              : ownerState.severity === "warning"
                ? theme.palette.warning.main
                : ownerState.severity === "success"
                  ? theme.palette.secondary.main
                  : theme.palette.primary.light;

          return {
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: 8,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: "none",
            "& .MuiAlert-icon": {
              color: accent,
            },
          };
        },
      },
    },
  },
});
