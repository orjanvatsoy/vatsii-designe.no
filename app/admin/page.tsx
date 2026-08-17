"use client";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PageShell from "../Components/PageShell";

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  inquiryInputMode: string;
  active: boolean;
  imageUrl: string;
}

const inputModeLabels: Record<string, string> = {
  name_list: "Navneliste",
  single_name: "Ett navn",
  comment: "Kommentar",
};

export default function AdminProductPage() {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [inquiryInputMode, setInquiryInputMode] = useState("comment");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editInputMode, setEditInputMode] = useState("comment");
  const [editActive, setEditActive] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");
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

      const result = (await response.json()) as {
        categories: string[];
        products: AdminProduct[];
      };
      setCategories(result.categories);
      setProducts(result.products);
    };
    loadAdminData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const openEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description);
    setEditCategory(product.category);
    setEditInputMode(product.inquiryInputMode);
    setEditActive(product.active);
    setEditImageFile(null);
    setEditImagePreview(product.imageUrl);
    setEditError("");
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    if (
      !editingProduct ||
      !editName.trim() ||
      !editDescription.trim() ||
      !editCategory.trim()
    ) {
      setEditError("Fyll ut navn, beskrivelse og kategori.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setEditError("Du må være logget inn.");
      return;
    }

    const formData = new FormData();
    formData.append("id", editingProduct.id);
    formData.append("name", editName.trim());
    formData.append("description", editDescription.trim());
    formData.append("category", editCategory.trim());
    formData.append("inquiryInputMode", editInputMode);
    formData.append("active", String(editActive));
    if (editImageFile) formData.append("image", editImageFile);

    setUpdating(true);
    setEditError("");
    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = (await response.json()) as {
        error?: string;
        product?: AdminProduct;
      };
      if (!response.ok || !result.product) {
        setEditError(result.error ?? "Produktet kunne ikke oppdateres.");
        return;
      }
      const updatedProduct = result.product;

      setProducts((current) =>
        current
          .map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product,
          )
          .sort((left, right) => left.name.localeCompare(right.name, "nb-NO")),
      );
      setCategories((current) =>
        [...new Set([...current, updatedProduct.category])].sort(
          (left, right) => left.localeCompare(right, "nb-NO"),
        ),
      );
      setSuccess(`${updatedProduct.name} er oppdatert.`);
      setEditingProduct(null);
    } catch {
      setEditError("Kunne ikke kontakte serveren.");
    } finally {
      setUpdating(false);
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
    formData.append("inquiryInputMode", inquiryInputMode);
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
      setInquiryInputMode("comment");
      setImageFile(null);
      setImagePreview("");
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        const response = await fetch("/api/products", {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });
        if (response.ok) {
          const refreshed = (await response.json()) as {
            products: AdminProduct[];
          };
          setProducts(refreshed.products);
        }
      }
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
      title="Produkter"
      subtitle="Opprett nye produkter og rediger det som allerede ligger ute."
    >
      <Box maxWidth={900} mx="auto">
        <Stack spacing={5}>
          <Box>
            <Typography variant="h4" fontWeight={800} mb={1}>
              Nytt produkt
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
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
                  <Typography fontWeight={700} mt={2} mb={1}>
                    Felt i forespørselen
                  </Typography>
                  <ToggleButtonGroup
                    value={inquiryInputMode}
                    exclusive
                    fullWidth
                    onChange={(_, value: string | null) => {
                      if (value) setInquiryInputMode(value);
                    }}
                    aria-label="Felt i forespørselen"
                  >
                    <ToggleButton value="name_list">Navneliste</ToggleButton>
                    <ToggleButton value="single_name">Ett navn</ToggleButton>
                    <ToggleButton value="comment">Kommentar</ToggleButton>
                  </ToggleButtonGroup>
                  <Typography variant="caption" color="text.secondary">
                    Bestemmer hva kunden må fylle inn når forespørselen sendes.
                  </Typography>
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
              <Grid size={{ xs: 12, md: 6 }}>
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

          <Box>
            <Typography variant="h4" fontWeight={800} mb={2}>
              Eksisterende produkter
            </Typography>
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
                  <Card
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {product.imageUrl && (
                      <CardMedia
                        component="img"
                        image={product.imageUrl}
                        alt={product.name}
                        sx={{ height: 160, objectFit: "cover" }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6" fontWeight={700}>
                        {product.name}
                      </Typography>
                      <Stack direction="row" gap={1} flexWrap="wrap" my={1.5}>
                        <Chip size="small" label={product.category} />
                        <Chip
                          size="small"
                          label={
                            inputModeLabels[product.inquiryInputMode] ??
                            "Kommentar"
                          }
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={product.active ? "Aktiv" : "Skjult"}
                          color={product.active ? "success" : "default"}
                        />
                      </Stack>
                      <Button
                        variant="outlined"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => openEditProduct(product)}
                        fullWidth
                      >
                        Rediger
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      </Box>

      <Dialog
        open={Boolean(editingProduct)}
        onClose={() => {
          if (!updating) setEditingProduct(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Rediger produkt</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            {editImagePreview && (
              <Box
                component="img"
                src={editImagePreview}
                alt="Forhåndsvisning"
                sx={{ width: "100%", height: 220, objectFit: "cover" }}
              />
            )}
            <Button component="label" variant="outlined">
              Bytt bilde
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleEditFileChange}
              />
            </Button>
            <TextField
              label="Navn"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              required
            />
            <TextField
              label="Beskrivelse"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              multiline
              minRows={3}
              required
            />
            <Autocomplete
              freeSolo
              options={categories}
              value={editCategory}
              onChange={(_, value) => setEditCategory(value ?? "")}
              onInputChange={(_, value) => setEditCategory(value)}
              renderInput={(params) => (
                <TextField {...params} label="Kategori" required />
              )}
            />
            <Typography fontWeight={700}>Felt i forespørselen</Typography>
            <ToggleButtonGroup
              value={editInputMode}
              exclusive
              fullWidth
              onChange={(_, value: string | null) => {
                if (value) setEditInputMode(value);
              }}
            >
              <ToggleButton value="name_list">Navneliste</ToggleButton>
              <ToggleButton value="single_name">Ett navn</ToggleButton>
              <ToggleButton value="comment">Kommentar</ToggleButton>
            </ToggleButtonGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={editActive}
                  onChange={(event) => setEditActive(event.target.checked)}
                />
              }
              label={editActive ? "Produktet er synlig" : "Produktet er skjult"}
            />
            {editError && <Typography color="error">{editError}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditingProduct(null)} disabled={updating}>
            Avbryt
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
