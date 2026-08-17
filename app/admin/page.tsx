"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { getCurrentProfileRole } from "../lib/profileClient";

import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import PageShell from "../Components/PageShell";

export default function AdminProductPage() {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAdminData = async () => {
      const currentRole = await getCurrentProfileRole();
      setRole(currentRole);
      if (currentRole !== "King") return;

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const response = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;

      const result = (await response.json()) as { categories: string[] };
      setCategories(result.categories);
    };
    loadAdminData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name || !description || !category || !imageFile) {
      setError("All fields are required!");
      return;
    }
    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      setError("Du må være logget inn.");
      setSaving(false);
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("image", imageFile);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Unknown error");
        setSaving(false);
        return;
      }
      setSuccess("Product saved!");
      setCategories((current) =>
        [...new Set([...current, category.trim()])].sort((left, right) =>
          left.localeCompare(right, "nb-NO"),
        ),
      );
      setName("");
      setDescription("");
      setCategory("");
      setImageFile(null);
      setImagePreview("");
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  if (role !== "King") {
    return (
      <Box mt={8} textAlign="center">
        <Typography variant="h5" color="error">
          Access denied. Only King can use this page.
        </Typography>
      </Box>
    );
  }

  return (
    <PageShell
      eyebrow="ADMIN"
      title="Nytt produkt"
      subtitle="Fyll inn detaljer og se en live forhåndsvisning av produktkortet."
    >
      <Box maxWidth={900} mx="auto">
        <Box>
          <Grid container spacing={2}>
            <Grid size={6}>
              <form onSubmit={handleSave}>
                <TextField
                  label="Name"
                  fullWidth
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Description"
                  fullWidth
                  margin="normal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Autocomplete
                  freeSolo
                  options={categories}
                  value={category}
                  onChange={(_, value) => setCategory(value ?? "")}
                  onInputChange={(_, value) => setCategory(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Kategori"
                      fullWidth
                      margin="normal"
                      helperText="Velg en eksisterende kategori eller skriv inn en ny."
                    />
                  )}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                  sx={{ mt: 2 }}
                >
                  {saving ? "Saving..." : "Save Product"}
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
            </Grid>
            <Grid size={6}>
              <Typography variant="subtitle1" mb={1}>
                Preview:
              </Typography>
              <Card sx={{ m: 1 }}>
                <Card
                  sx={{
                    bgcolor: "background.paper",
                    boxShadow: 6,
                  }}
                >
                  <CardHeader
                    title={<Typography variant="h6">{name}</Typography>}
                  />
                  {imagePreview && (
                    <CardMedia
                      component="img"
                      image={imagePreview}
                      alt="Preview"
                      sx={{
                        height: 300,
                        objectFit: "contain",
                        bgcolor: "background.paper",
                      }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="body2">{description}</Typography>
                    <Typography variant="caption">
                      Kategori: {category}
                    </Typography>
                  </CardContent>
                </Card>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </PageShell>
  );
}
