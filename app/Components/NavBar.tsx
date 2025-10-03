"use client";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NavBar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setUserName(
        user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null
      );
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;
        setUserName(
          user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null
        );
        setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }} p={2}>
      <AppBar position="static" sx={{ borderRadius: 8 }}>
        <Toolbar>
          <Button color="inherit" component={Link} href="/">
            Home
          </Button>
          <Button color="inherit" component={Link} href="/about">
            About
          </Button>
          <Button color="inherit" component={Link} href="/contact">
            Contact
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            component={Link}
            href="/login"
            color="inherit"
            sx={{ ml: 2 }}
          >
            <Avatar alt="Login" src={avatarUrl ?? undefined} />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
