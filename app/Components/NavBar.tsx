"use client";
import AppBar from "@mui/material/AppBar";
import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
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
import { getCurrentProfileRole } from "../lib/profileClient";

export default function NavBar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setUserName(
        user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null,
      );
      setUserEmail(user?.email ?? null);
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
      if (user?.id) {
        setRole(await getCurrentProfileRole());
      }
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;
        setUserName(
          user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null,
        );
        setUserEmail(user?.email ?? null);
        setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
        if (user?.id) {
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background:
            "linear-gradient(to bottom, rgba(15,14,10,0.72) 0%, rgba(15,14,10,0.38) 65%, rgba(15,14,10,0.12) 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(217,160,102,0.08)",
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 } }}>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <IconButton color="inherit" href="/" sx={{ p: 0 }}>
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
          <IconButton
            href={userEmail ? "/konto" : "/login"}
            color="inherit"
            aria-label={userEmail ? "Min konto" : "Logg inn"}
          >
            <Avatar
              alt={userName ?? userEmail ?? "Logg inn"}
              src={avatarUrl ?? undefined}
            >
              {!avatarUrl && userEmail
                ? userEmail.charAt(0).toUpperCase()
                : null}
            </Avatar>
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
      <Toolbar
        aria-hidden
        sx={{ minHeight: { xs: 64, sm: 72 }, pointerEvents: "none" }}
      />
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
              <ListItemButton href="/">
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton href="/about">
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton href="/contact">
                <ListItemText primary="Contact" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton href="/products">
                <ListItemText primary="Produkter" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton href="/bestillinger">
                <ListItemText primary="Mine forespørsler" />
              </ListItemButton>
            </ListItem>
            {role === "King" && (
              <>
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton href="/add-carousel-image">
                    <ListItemText primary="Edit Carousel" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton href="/admin">
                    <ListItemText primary="Admin Products" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton href="/admin/bestillinger">
                    <ListItemText primary="Innkomne forespørsler" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
            {(role === "User" || role === "King") && (
              <>
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton href="/iot">
                    <ListItemText primary="IoT" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton href={userEmail ? "/konto" : "/login"}>
                <Avatar
                  alt={userName ?? userEmail ?? "Logg inn"}
                  src={avatarUrl ?? undefined}
                  sx={{ mr: 1 }}
                >
                  {!avatarUrl && userEmail
                    ? userEmail.charAt(0).toUpperCase()
                    : null}
                </Avatar>
                <ListItemText
                  primary={userName || userEmail || "Logg inn"}
                  secondary={userEmail ? "Min konto" : undefined}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
