"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getCurrentProfileRole } from "../lib/profileClient";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Alert, Avatar, Card, Divider, Stack, TextField } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import type { User } from "@supabase/supabase-js";
import PageShell from "../Components/PageShell";

export default function UserPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const getUserAndRole = async () => {
      const { data, error } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.id) {
        setRole(await getCurrentProfileRole());
      }
      setLoading(false);
      if (error) setError(error.message);
    };
    getUserAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user.id) {
          getCurrentProfileRole().then(setRole);
        } else {
          setRole("");
        }
      },
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/",
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
    window.location.href = "/bestillinger";
  };

  const handleMagicLink = async () => {
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
        emailRedirectTo: `${window.location.origin}/bestillinger`,
        shouldCreateUser: false,
      },
    });
    setSubmitting(false);
    if (linkError) {
      setError("Innloggingslenken kunne ikke sendes. Prøv igjen.");
      return;
    }
    setSuccess("Vi har sendt en innloggingslenke til e-postadressen din.");
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
    const { data, error: updateError } = await supabase.auth.updateUser({
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
    setUser(data.user);
    setPassword("");
    setConfirmPassword("");
    setSuccess(
      "Passordet er lagret. Neste gang kan du logge inn uten e-postlenke.",
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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

  if (!user) {
    return (
      <PageShell
        eyebrow="VELKOMMEN"
        title="Logg inn"
        subtitle="Bruk e-post og passord, få en engangslenke eller fortsett med Google."
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
                Velkommen tilbake
              </Typography>
              <TextField
                label="E-postadresse"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Passord"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
              />
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
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
                onClick={handleMagicLink}
                disabled={submitting || !email.trim()}
                sx={{ textTransform: "none" }}
              >
                Send meg en innloggingslenke
              </Button>
              <Divider flexItem>eller</Divider>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleLogin}
                sx={{
                  px: 4,
                }}
              >
                Logg inn med Google
              </Button>
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
                  Da kan du logge inn direkte uten å få en ny e-postlenke.
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
