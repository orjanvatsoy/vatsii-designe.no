"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Card } from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import PageShell from "../Components/PageShell";

export default function AddCarouselImagePage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profile) setRole(profile.role || "");
      }
      setAuthChecked(true);
    };
    check();
  }, []);

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
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      setError("Du må være logget inn.");
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append("file", imageFile);
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
    setSuccess("Bilde og tekst lagret!");
    setImageFile(null);
    setTitle("");
    setDescription("");
    setUploading(false);
  };

  if (!authChecked) {
    return (
      <Typography sx={{ mt: 8, textAlign: "center" }}>Loading…</Typography>
    );
  }

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
      title="Karusellbilde"
      subtitle="Last opp et nytt bilde til forsidekarusellen."
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
              sx={{
                mt: 2,
                borderRadius: 999,
                fontWeight: 700,
                textTransform: "none",
              }}
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
        </Card>
      </Box>
    </PageShell>
  );
}
