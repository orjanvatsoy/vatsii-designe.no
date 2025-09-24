"use client";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Avatar } from "@mui/material";

export default function NavBar() {
  return (
    <Box sx={{ flexGrow: 1 }} p={2}>
      <AppBar position="static" sx={{ borderRadius: 8 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Vatsii Designe
          </Typography>
          <Button color="inherit">Home</Button>
          <Button color="inherit">About</Button>
          <Button color="inherit">Contact</Button>
          <Avatar alt="Vatsii Logo" src="/logo.png" />
        </Toolbar>
      </AppBar>
    </Box>
  );
}
