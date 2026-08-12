"use client";
import { Box, Card, Stack, Typography, Button } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import InstagramIcon from "@mui/icons-material/Instagram";
import PageShell from "../Components/PageShell";

export default function Contact() {
  return (
    <PageShell
      eyebrow="LA OSS SNAKKE"
      title="Kontakt"
      subtitle="Ta gjerne kontakt for spørsmål, forespørsler eller andre henvendelser!"
    >
      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "100%",
            maxWidth: 520,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 24px 60px -28px rgba(0,0,0,0.8)",
          }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
                boxShadow: "0 10px 30px rgba(139,94,60,0.5)",
              }}
            >
              <EmailIcon sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Send meg en e-post
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Jeg svarer vanligvis innen kort tid.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              href="mailto:orjanva@gmail.com"
              sx={{
                px: 4,
                py: 1.3,
              }}
            >
              orjanva@gmail.com
            </Button>
            <Button
              variant="text"
              startIcon={<InstagramIcon />}
              href="https://www.instagram.com/vatsii_designs/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "text.secondary", textTransform: "none" }}
            >
              @vatsii_designs
            </Button>
          </Stack>
        </Card>
      </Box>
    </PageShell>
  );
}
