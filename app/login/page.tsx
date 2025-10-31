"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export default function UserPage() {
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      }
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
    return <Typography>Loading...</Typography>;
  }

  if (!user) {
    return (
      <>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
          mt={8}
        >
          <Typography variant="h4">Logg inn</Typography>
          <Button variant="outlined" onClick={handleLogin}>
            Logg inn med Google
          </Button>
          {typeof window !== "undefined" &&
            window.location.hostname === "localhost" && (
              <Box mt={2}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="dev-role-select-label">
                    Dev: Bytt rolle
                  </InputLabel>
                  <Select
                    labelId="dev-role-select-label"
                    id="dev-role-select"
                    value={role}
                    label="Dev: Bytt rolle"
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <MenuItem value="">Ingen</MenuItem>
                    <MenuItem value="User">User</MenuItem>
                    <MenuItem value="King">King</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
        </Box>
      </>
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
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      mt={8}
    >
      <Typography variant="h4">User</Typography>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <Typography variant="h6">
          {userObj.user_metadata?.full_name ||
            userObj.user_metadata?.name ||
            "Unknown User"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userObj.email}
        </Typography>
        <Typography variant="body2" color="primary">
          Role: {role || "None"}
        </Typography>

        {error && <Typography color="error">{error}</Typography>}
      </Box>
      <Button variant="contained" color="secondary" onClick={handleLogout}>
        Log out
      </Button>
    </Box>
  );
}
