"use client";

import EmailIcon from "@mui/icons-material/Email";
import InstagramIcon from "@mui/icons-material/Instagram";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PageShell from "../Components/PageShell";

const topics = [
  "Produktspørsmål",
  "Spesialbestilling",
  "Eksisterende forespørsel",
  "Samarbeid",
  "Annet",
] as const;

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        setError(result.error ?? "Meldingen kunne ikke sendes.");
        return;
      }

      setSuccess("Meldingen er sendt. Jeg svarer så snart jeg kan.");
      setTopic("");
      setMessage("");
      setWebsite("");
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen senere.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="LA OSS SNAKKE"
      title="Kontakt"
      subtitle="Fortell kort hva du lurer på, så svarer jeg deg på e-post."
      maxWidth="lg"
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 280px" },
          gap: { xs: 5, md: 7 },
          alignItems: "start",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 720,
            boxSizing: "border-box",
            p: { xs: 2.5, sm: 4 },
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Send en melding
              </Typography>
              <Typography color="text.secondary" mt={0.5}>
                Feltene merket med * må fylles ut.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Navn"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
              <TextField
                label="E-postadresse"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                slotProps={{ htmlInput: { maxLength: 254 } }}
              />
            </Box>

            <TextField
              select
              label="Hva gjelder henvendelsen?"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              required
            >
              {topics.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Melding"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              multiline
              minRows={6}
              required
              helperText={`${message.length}/5000 tegn`}
              slotProps={{
                htmlInput: { minLength: 10, maxLength: 5000 },
              }}
            />

            <TextField
              label="Nettside"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              autoComplete="off"
              tabIndex={-1}
              sx={{ display: "none" }}
              aria-hidden
            />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              disabled={
                submitting ||
                !name.trim() ||
                !email.trim() ||
                !topic ||
                message.trim().length < 10
              }
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, px: 4 }}
            >
              {submitting ? "Sender..." : "Send melding"}
            </Button>

            <Typography variant="caption" color="text.secondary">
              Kontaktopplysningene brukes bare for å svare på henvendelsen.
            </Typography>
          </Stack>
        </Box>

        <Stack
          component="aside"
          spacing={2.5}
          sx={{
            pt: { xs: 3, md: 0 },
            borderTop: { xs: "1px solid", md: 0 },
            borderLeft: { xs: 0, md: "1px solid" },
            borderColor: "divider",
            pl: { md: 4 },
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Andre kontaktmåter
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Du kan også kontakte meg direkte.
            </Typography>
          </Box>
          <Divider />
          <Stack spacing={1} alignItems="flex-start">
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              href="mailto:orjanva@gmail.com"
            >
              Send e-post
            </Button>
            <Typography variant="body2" color="text.secondary">
              orjanva@gmail.com
            </Typography>
          </Stack>
          <Button
            variant="text"
            startIcon={<InstagramIcon />}
            href="https://www.instagram.com/vatsii_designs/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ alignSelf: "flex-start", color: "text.secondary" }}
          >
            @vatsii_designs
          </Button>
        </Stack>
      </Box>
    </PageShell>
  );
}
