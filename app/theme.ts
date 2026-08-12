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
      main: "#3F6B4A",
    },
    warning: {
      main: "#ffca3a",
    },
    error: {
      main: "#fa3947",
    },
    info: {
      main: "#D9A066",
    },
    divider: "#3A332C",
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 8,
          paddingInline: 20,
          fontWeight: 700,
          letterSpacing: 0,
          textTransform: "none",
          transition:
            "background-color 160ms ease, border-color 160ms ease, color 160ms ease",
        },
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.text.primary,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.light,
          "&:hover": {
            borderColor: theme.palette.primary.light,
            backgroundColor: "rgba(139,94,60,0.12)",
          },
        }),
        text: ({ theme }) => ({
          color: theme.palette.primary.light,
          "&:hover": {
            backgroundColor: "rgba(139,94,60,0.1)",
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          borderColor: theme.palette.divider,
          backgroundImage: "none",
          boxShadow: "none",
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          backgroundColor: "rgba(28,28,26,0.42)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.light,
            borderWidth: 1,
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          fontWeight: 700,
        }),
      },
    },
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
