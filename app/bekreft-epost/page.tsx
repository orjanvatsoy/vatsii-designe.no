"use client";

import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import PageShell from "../Components/PageShell";
import { supabase } from "../lib/supabaseClient";

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setEmail(sessionStorage.getItem("pendingVerificationEmail") ?? "");
  }, []);

  const handleVerify = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Oppgi e-postadressen koden ble sendt til.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Skriv inn den sekssifrede koden fra e-posten.");
      return;
    }

    setVerifying(true);
    const { error: verificationError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email",
    });
    setVerifying(false);

    if (verificationError) {
      setError("Koden er feil eller har utløpt. Be om en ny kode.");
      return;
    }

    sessionStorage.removeItem("pendingVerificationEmail");
    window.location.href = "/bestillinger";
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Oppgi e-postadressen din først.");
      return;
    }

    setResending(true);
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setResending(false);

    if (resendError) {
      setError("En ny kode kunne ikke sendes. Prøv igjen om litt.");
      return;
    }

    sessionStorage.setItem("pendingVerificationEmail", email.trim());
    setCode("");
    setSuccess("En ny kode er sendt fra Vatsii Designe.");
  };

  return (
    <PageShell
      eyebrow="NESTEN FERDIG"
      title="Bekreft e-postadressen din"
      subtitle="Forespørselen er mottatt. Bekreft adressen for å se og oppdatere den."
      maxWidth="sm"
    >
      <Card sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack spacing={3} alignItems="stretch">
            <Box textAlign="center">
              <MarkEmailReadOutlinedIcon
                color="primary"
                sx={{ fontSize: 48, mb: 1.5 }}
              />
              <Typography variant="h6" fontWeight={700}>
                Sjekk e-posten din
              </Typography>
              <Typography color="text.secondary" mt={1}>
                Skriv inn den sekssifrede koden vi sendte fra Vatsii Designe.
              </Typography>
            </Box>

            <TextField
              label="E-postadresse"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              fullWidth
              required
            />
            <TextField
              label="Sekssifret kode"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              autoComplete="one-time-code"
              autoFocus
              fullWidth
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: 6,
                  style: {
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    letterSpacing: "0.35rem",
                    textAlign: "center",
                  },
                },
              }}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={handleVerify}
              disabled={verifying || resending || code.length !== 6}
              fullWidth
            >
              {verifying ? "Kontrollerer..." : "Bekreft og åpne forespørselen"}
            </Button>
            <Button
              variant="text"
              startIcon={<EmailOutlinedIcon />}
              onClick={handleResend}
              disabled={verifying || resending || !email.trim()}
            >
              {resending ? "Sender ny kode..." : "Send ny kode"}
            </Button>
            <Button href="/bestillinger" color="inherit">
              Tilbake til Mine forespørsler
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
}
