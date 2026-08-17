"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Alert, Avatar, Card, Divider, Stack, TextField } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../Components/AuthProvider";
import PageShell from "../Components/PageShell";

function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get("next");
  return nextPath?.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/bestillinger";
}

export default function UserPage() {
  const { user, role, loading, error: authError } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryCodeSent, setRecoveryCodeSent] = useState(false);
  const [recoveryVerified, setRecoveryVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + getSafeNextPath(),
      },
    });
  };

  const handlePasswordLogin = async () => {
    setError("");
    setSuccess("");
    if (!email.trim() || !password) {
      setError("Oppgi e-post og passord.");
      return;
    }

    setSubmitting(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (loginError) {
      setError("E-post eller passord er feil.");
      return;
    }
    window.location.href = getSafeNextPath();
  };

  const handleEmailCode = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Oppgi e-postadressen din.");
      return;
    }

    setSubmitting(true);
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      },
    });
    setSubmitting(false);
    if (linkError) {
      setError("Innloggingskoden kunne ikke sendes. Prøv igjen.");
      return;
    }
    setCodeSent(true);
    setSuccess("En sekssifret innloggingskode er sendt fra Vatsii Designe.");
  };

  const handleVerifyCode = async () => {
    setError("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Skriv inn den sekssifrede koden fra e-posten.");
      return;
    }

    setSubmitting(true);
    const { error: verificationError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: verificationCode,
      type: "email",
    });
    setSubmitting(false);
    if (verificationError) {
      setError("Koden er feil eller har utløpt. Be om en ny kode.");
      return;
    }
    window.location.href = getSafeNextPath();
  };

  const handleRequestPasswordReset = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Oppgi e-postadressen din.");
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
    );
    setSubmitting(false);
    if (resetError) {
      setError("Koden kunne ikke sendes. Prøv igjen.");
      return;
    }

    setRecoveryCodeSent(true);
    setSuccess("En sekssifret kode er sendt fra Vatsii Designe.");
  };

  const handleVerifyRecoveryCode = async () => {
    setError("");
    if (!/^\d{6}$/.test(recoveryCode)) {
      setError("Skriv inn den sekssifrede koden fra e-posten.");
      return;
    }

    setSubmitting(true);
    const { error: verificationError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: recoveryCode,
      type: "recovery",
    });
    setSubmitting(false);
    if (verificationError) {
      setError("Koden er feil eller har utløpt. Be om en ny kode.");
      return;
    }

    setRecoveryVerified(true);
    setSuccess("Koden er godkjent. Velg et nytt passord.");
  };

  const handleResetPassword = async () => {
    setError("");
    if (newPassword.length < 8) {
      setError("Passordet må ha minst 8 tegn.");
      return;
    }
    if (newPassword !== newPasswordConfirmation) {
      setError("Passordene er ikke like.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { password_configured: true },
    });
    setSubmitting(false);
    if (updateError) {
      setError("Passordet kunne ikke lagres. Prøv igjen.");
      return;
    }

    window.location.href = getSafeNextPath();
  };

  const handleSetPassword = async () => {
    setError("");
    setSuccess("");
    if (password.length < 8) {
      setError("Passordet må ha minst 8 tegn.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passordene er ikke like.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        ...user?.user_metadata,
        password_configured: true,
      },
    });
    setSubmitting(false);
    if (updateError) {
      setError("Passordet kunne ikke lagres. Prøv igjen.");
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setSuccess(
      "Passordet er lagret. Neste gang kan du logge inn uten e-postkode.",
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <PageShell>
        <Typography align="center" color="text.secondary">
          Laster...
        </Typography>
      </PageShell>
    );
  }

  if (!user || recoveryMode) {
    return (
      <PageShell
        eyebrow="VELKOMMEN"
        title="Logg inn"
        subtitle="Bruk e-post og passord, få en sekssifret innloggingskode eller fortsett med Google."
        maxWidth="sm"
      >
        <Box display="flex" justifyContent="center">
          <Card
            sx={{
              width: "100%",
              maxWidth: 440,
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 24px 60px -28px rgba(0,0,0,0.8)",
            }}
          >
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {recoveryMode ? "Opprett nytt passord" : "Velkommen tilbake"}
              </Typography>
              <TextField
                label="E-postadresse"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
                required
                disabled={codeSent || recoveryCodeSent}
              />
              {!recoveryMode && (
                <TextField
                  label="Passord"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                />
              )}
              {!recoveryMode && codeSent && (
                <TextField
                  label="Sekssifret kode"
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  autoComplete="one-time-code"
                  fullWidth
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 6 },
                  }}
                />
              )}
              {recoveryMode && recoveryCodeSent && !recoveryVerified && (
                <TextField
                  label="Sekssifret kode"
                  value={recoveryCode}
                  onChange={(event) =>
                    setRecoveryCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  autoComplete="one-time-code"
                  fullWidth
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 6 },
                  }}
                />
              )}
              {recoveryMode && recoveryVerified && (
                <>
                  <TextField
                    label="Nytt passord"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    helperText="Minst 8 tegn"
                    fullWidth
                  />
                  <TextField
                    label="Gjenta nytt passord"
                    type="password"
                    value={newPasswordConfirmation}
                    onChange={(event) =>
                      setNewPasswordConfirmation(event.target.value)
                    }
                    fullWidth
                  />
                </>
              )}
              {(error || authError) && (
                <Alert severity="error">{error || authError}</Alert>
              )}
              {success && <Alert severity="success">{success}</Alert>}
              {recoveryMode ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={
                    recoveryVerified
                      ? handleResetPassword
                      : recoveryCodeSent
                        ? handleVerifyRecoveryCode
                        : handleRequestPasswordReset
                  }
                  disabled={
                    submitting ||
                    !email.trim() ||
                    (recoveryCodeSent &&
                      !recoveryVerified &&
                      recoveryCode.length !== 6) ||
                    (recoveryVerified &&
                      (!newPassword || !newPasswordConfirmation))
                  }
                  fullWidth
                >
                  {submitting
                    ? "Behandler..."
                    : recoveryVerified
                      ? "Lagre nytt passord"
                      : recoveryCodeSent
                        ? "Kontroller kode"
                        : "Send kode"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handlePasswordLogin}
                    disabled={submitting || !email.trim() || !password}
                    fullWidth
                    sx={{ textTransform: "none" }}
                  >
                    {submitting ? "Logger inn..." : "Logg inn"}
                  </Button>
                  <Button
                    variant="text"
                    onClick={codeSent ? handleVerifyCode : handleEmailCode}
                    disabled={submitting || !email.trim()}
                    sx={{ textTransform: "none" }}
                  >
                    {codeSent
                      ? "Logg inn med kode"
                      : "Send meg en innloggingskode"}
                  </Button>
                </>
              )}
              {!recoveryMode && codeSent && (
                <Button
                  variant="text"
                  onClick={handleEmailCode}
                  disabled={submitting}
                >
                  Send ny kode
                </Button>
              )}
              <Button
                variant="text"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setRecoveryMode((current) => !current);
                }}
              >
                {recoveryMode ? "Tilbake til innlogging" : "Glemt passord?"}
              </Button>
              {!recoveryMode && (
                <>
                  <Divider flexItem>eller</Divider>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    startIcon={<GoogleIcon />}
                    onClick={handleLogin}
                    sx={{ px: 4 }}
                  >
                    Logg inn med Google
                  </Button>
                </>
              )}
            </Stack>
          </Card>
        </Box>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="DIN KONTO" title="Min profil" maxWidth="sm">
      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "100%",
            maxWidth: 440,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 24px 60px -28px rgba(0,0,0,0.8)",
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Avatar
              src={user.user_metadata?.avatar_url}
              sx={{
                width: 88,
                height: 88,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                border: "2px solid",
                borderColor: "primary.main",
              }}
            >
              {!user.user_metadata?.avatar_url
                ? user.email?.charAt(0).toUpperCase()
                : null}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            {user.app_metadata.provider === "email" && (
              <Typography variant="body2" color="primary.light">
                {user.user_metadata.password_configured
                  ? "Passord er opprettet"
                  : "Innlogget uten passord"}
              </Typography>
            )}
            {role && (
              <Box
                sx={{
                  px: 1.6,
                  py: 0.4,
                  borderRadius: 999,
                  bgcolor: "rgba(217,160,102,0.15)",
                  border: "1px solid rgba(217,160,102,0.3)",
                  color: "primary.light",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Rolle: {role}
              </Box>
            )}
            <Button href="/bestillinger" sx={{ textTransform: "none" }}>
              Mine forespørsler
            </Button>
            {user.app_metadata.provider === "email" && (
              <Stack spacing={2} width="100%" pt={1}>
                <Divider>
                  {user.user_metadata.password_configured
                    ? "Endre passord"
                    : "Opprett passord"}
                </Divider>
                <Typography variant="body2" color="text.secondary">
                  Da kan du logge inn direkte uten å få en ny e-postkode.
                </Typography>
                <TextField
                  label="Nytt passord"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  helperText="Minst 8 tegn"
                  fullWidth
                />
                <TextField
                  label="Gjenta passord"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleSetPassword}
                  disabled={submitting || !password || !confirmPassword}
                  sx={{ textTransform: "none" }}
                >
                  {submitting ? "Lagrer..." : "Lagre passord"}
                </Button>
              </Stack>
            )}
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                mt: 1,
                px: 3,
              }}
            >
              Logg ut
            </Button>
          </Stack>
        </Card>
      </Box>
    </PageShell>
  );
}
