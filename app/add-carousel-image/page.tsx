"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Breadcrumbs, Container, Link as MuiLink } from "@mui/material";
import Link from "next/link";

export default function AddCarouselImagePage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!imageFile) {
      setError("Du må velge et bilde!");
      return;
    }
    setUploading(true);
    // Send to API route
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("title", title);
    formData.append("description", description);
    const res = await fetch("/api/upload-carousel-image", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Ukjent feil ved opplasting");
      setUploading(false);
      return;
    }
    setSuccess("Bilde og tekst lagret!");
    setImageFile(null);
    setTitle("");
    setDescription("");
    setUploading(false);
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4, mb: 2 }}>
        <MuiLink href="/" color="inherit" underline="hover">
          Hjem
        </MuiLink>
        <Typography color="primary" fontWeight={600}>
          Legg til karusell bilde
        </Typography>
      </Breadcrumbs>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Box maxWidth={400} mx="auto" mt={8}>
          <Typography variant="h4" mb={2}>
            Legg til bilde i karusell
          </Typography>
          <form onSubmit={handleSubmit}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <TextField
              label="Tittel"
              fullWidth
              margin="normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Beskrivelse"
              fullWidth
              margin="normal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={uploading}
              sx={{ mt: 2 }}
            >
              {uploading ? "Lagrer..." : "Lagre bilde"}
            </Button>
            {error && (
              <Typography color="error" mt={2}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="success.main" mt={2}>
                {success}
              </Typography>
            )}
          </form>
        </Box>
      </Container>
    </>
  );
}
