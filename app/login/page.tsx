"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Avatar, Card, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import PageShell from "../Components/PageShell";

export default function UserPage() {
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const getUserAndRole = async () => {
      const { data, error } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      if (data?.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profile) setRole(profile.role || "");
        if (profileError) setError(profileError.message);
      }
      setLoading(false);
      if (error) setError(error.message);
    };
    getUserAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
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
        subtitle="Logg inn for tilgang til din profil og mer."
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
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleLogin}
                sx={{
                  px: 4,
                  py: 1.3,
                  borderRadius: 999,
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "0 12px 32px rgba(139,94,60,0.5)",
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

  // User info card
  const userObj = user as {
    id?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
      name?: string;
    };
    email?: string;
  };

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
            <Avatar
              src={userObj.user_metadata?.avatar_url}
              sx={{
                width: 88,
                height: 88,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                border: "2px solid",
                borderColor: "primary.main",
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {userObj.user_metadata?.full_name ||
                userObj.user_metadata?.name ||
                "Unknown User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userObj.email}
            </Typography>
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
              Rolle: {role || "None"}
            </Box>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                mt: 1,
                borderRadius: 999,
                px: 3,
                fontWeight: 700,
                textTransform: "none",
                borderColor: "divider",
                color: "text.primary",
                "&:hover": { borderColor: "primary.light" },
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
