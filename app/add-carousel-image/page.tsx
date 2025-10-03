"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

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
    // Upload image to Supabase Storage
    const fileName = `${Date.now()}_${imageFile.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from("carousel") // Make sure you have a 'carousel' bucket
      .upload(fileName, imageFile);
    if (storageError) {
      setError("Feil ved opplasting: " + storageError.message);
      setUploading(false);
      return;
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("carousel")
      .getPublicUrl(fileName);
    const imageUrl = publicUrlData?.publicUrl;
    // Save metadata to DB
    const { error: dbError } = await supabase.from("carousel_images").insert([
      {
        image_url: imageUrl,
        title,
        description,
      },
    ]);
    if (dbError) {
      setError("Feil ved lagring i database: " + dbError.message);
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
  );
}
