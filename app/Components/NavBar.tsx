"use client";
import AppBar from "@mui/material/AppBar";
import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NavBar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setUserName(
        user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null
      );
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setRole(profile.role || "");
      }
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;
        setUserName(
          user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null
        );
        setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
        if (user?.id) {
          supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile) setRole(profile.role || "");
            });
        } else {
          setRole("");
        }
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
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <IconButton color="inherit" component={Link} href="/" sx={{ p: 0 }}>
              <HomeIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: "0.8rem",
                ml: 1,
                fontWeight: 500,
                letterSpacing: 1,
                lineHeight: 1.1,
                whiteSpace: "pre-line",
              }}
            >
              {`Vatsii\nDesigne`}
            </Typography>
          </Box>
          <IconButton component={Link} href="/login" color="inherit">
            <Avatar alt="Login" src={avatarUrl ?? undefined} />
          </IconButton>
          <IconButton
            color="inherit"
            edge="end"
            sx={{ mr: 1 }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/">
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/about">
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/contact">
                <ListItemText primary="Contact" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/products">
                <ListItemText primary="Produkter" />
              </ListItemButton>
            </ListItem>
            {role === "King" && (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={Link} href="/add-carousel-image">
                    <ListItemText primary="Edit Carousel" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} href="/admin">
                    <ListItemText primary="Admin Products" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/login">
                <Avatar
                  alt="Login"
                  src={avatarUrl ?? undefined}
                  sx={{ mr: 1 }}
                />
                <ListItemText primary={userName || "Login"} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
