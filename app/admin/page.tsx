"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Container,
  Grid,
  Link as MuiLink,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

export default function AdminProductPage() {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const getRole = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setRole(profile.role || "");
      }
    };
    getRole();
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
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("image", imageFile);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Unknown error");
        setSaving(false);
        return;
      }
      setSuccess("Product saved!");
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
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4, mb: 2 }}>
        <MuiLink href="/" color="inherit" underline="hover">
          Hjem
        </MuiLink>

        <Typography color="primary" fontWeight={600}>
          Legg til produkt
        </Typography>
      </Breadcrumbs>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Box maxWidth={900} mx="auto" mt={8}>
          <Typography variant="h4" mb={4}>
            Create Product Card
          </Typography>
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
                  <TextField
                    label="Kategori"
                    fullWidth
                    margin="normal"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
      </Container>
    </>
  );
}
