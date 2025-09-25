"use client";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Link from "next/link";

export default function NavBar() {
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
        </Toolbar>
      </AppBar>
    </Box>
  );
}
