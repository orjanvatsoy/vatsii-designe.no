"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Card } from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import PageShell from "../Components/PageShell";
import { RequireRole, useAuth } from "../Components/AuthProvider";

export default function AddCarouselImagePage() {
  const { role } = useAuth();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (imageFiles.length === 0) {
      setError("Du må velge minst ett bilde!");
      return;
    }
    setUploading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      setError("Du må være logget inn.");
      setUploading(false);
      return;
    }
    const formData = new FormData();
    imageFiles.forEach((file) => formData.append("files", file));
    formData.append("title", title);
    formData.append("description", description);
    const res = await fetch("/api/upload-carousel-image", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Ukjent feil ved opplasting");
      setUploading(false);
      return;
    }
    const failed = Array.isArray(result.errors) ? result.errors.length : 0;
    setSuccess(
      `${result.uploadedCount} bilde(r) lastet opp!` +
        (failed ? ` ${failed} feilet.` : ""),
    );
    setImageFiles([]);
    setTitle("");
    setDescription("");
    setUploading(false);
  };

  if (role !== "King") {
    return (
      <RequireRole roles={["King"]}>
        <></>
      </RequireRole>
    );
  }

  return (
    <PageShell
      eyebrow="ADMIN"
      title="Karusellbilde"
      subtitle="Last opp ett eller flere bilder til forsidekarusellen."
      maxWidth="sm"
    >
      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "100%",
            maxWidth: 460,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 24px 60px -28px rgba(0,0,0,0.8)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            {imageFiles.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {imageFiles.length} bilde(r) valgt:
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                  {imageFiles.map((f) => (
                    <Typography
                      component="li"
                      variant="caption"
                      color="text.secondary"
                      key={f.name + f.size}
                    >
                      {f.name}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
            <TextField
              label="Tittel (valgfri – brukes på alle)"
              fullWidth
              margin="normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              helperText="La stå tom for å bruke filnavnet som tittel."
            />
            <TextField
              label="Beskrivelse (valgfri)"
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
              sx={{
                mt: 2,
              }}
            >
              {uploading
                ? "Lagrer..."
                : imageFiles.length > 1
                  ? `Last opp ${imageFiles.length} bilder`
                  : "Lagre bilde"}
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
        </Card>
      </Box>
    </PageShell>
  );
}
