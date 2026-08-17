"use client";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

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
  IconButton,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import PageShell from "../Components/PageShell";
import { RequireRole, useAuth } from "../Components/AuthProvider";

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  inquiryInputMode: string;
  imagePositionX: number;
  imagePositionY: number;
  imageRotation: number;
  imageZoom: number;
  lightburnFileName: string | null;
  lightburnSizeBytes: number | null;
  lightburnUpdatedAt: string | null;
  active: boolean;
  imageUrl: string;
}

const inputModeLabels: Record<string, string> = {
  name_list: "Navneliste",
  single_name: "Ett navn",
  comment: "Kommentar",
  custom_order: "Spesialbestilling",
};

function imageScale(zoom: number) {
  return zoom / 100;
}

function isQuarterTurn(rotation: number) {
  return Math.abs(rotation) % 180 === 90;
}

function imageTransform(rotation: number, zoom: number) {
  return `translate(-50%, -50%) rotate(${rotation}deg) scale(${imageScale(zoom)})`;
}

function formatFileSize(sizeBytes: number) {
  return sizeBytes < 1024 * 1024
    ? `${Math.ceil(sizeBytes / 1024)} kB`
    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminProductPage() {
  const { role, session } = useAuth();
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
  const [editImagePositionX, setEditImagePositionX] = useState(50);
  const [editImagePositionY, setEditImagePositionY] = useState(50);
  const [editImageRotation, setEditImageRotation] = useState(0);
  const [editImageZoom, setEditImageZoom] = useState(100);
  const [editActive, setEditActive] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [updating, setUpdating] = useState(false);
  const [lightburnBusy, setLightburnBusy] = useState(false);
  const [confirmLightburnDelete, setConfirmLightburnDelete] = useState(false);
  const [editError, setEditError] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAdminData = async () => {
      if (role !== "King") return;
      const token = session?.access_token;
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
    void loadAdminData();
  }, [role, session?.access_token]);

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
    setEditImagePositionX(product.imagePositionX);
    setEditImagePositionY(product.imagePositionY);
    setEditImageRotation(product.imageRotation);
    setEditImageZoom(product.imageZoom);
    setEditActive(product.active);
    setEditImageFile(null);
    setEditImagePreview(product.imageUrl);
    setConfirmLightburnDelete(false);
    setEditError("");
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const updateLightburnMetadata = (
    product: AdminProduct,
    metadata: {
      name: string | null;
      sizeBytes: number | null;
      updatedAt: string | null;
    },
  ) => {
    const updatedProduct = {
      ...product,
      lightburnFileName: metadata.name,
      lightburnSizeBytes: metadata.sizeBytes,
      lightburnUpdatedAt: metadata.updatedAt,
    };
    setEditingProduct(updatedProduct);
    setProducts((current) =>
      current.map((item) =>
        item.id === updatedProduct.id ? updatedProduct : item,
      ),
    );
  };

  const handleLightburnUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editingProduct || !session?.access_token) return;

    const formData = new FormData();
    formData.append("productId", editingProduct.id);
    formData.append("file", file);
    setLightburnBusy(true);
    setEditError("");
    try {
      const response = await fetch("/api/products/lightburn", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const result = (await response.json()) as {
        error?: string;
        file?: { name: string; sizeBytes: number; updatedAt: string };
      };
      if (!response.ok || !result.file) {
        setEditError(result.error ?? "LightBurn-filen kunne ikke lastes opp.");
        return;
      }
      updateLightburnMetadata(editingProduct, result.file);
    } catch {
      setEditError("Kunne ikke kontakte serveren.");
    } finally {
      setLightburnBusy(false);
    }
  };

  const handleLightburnDownload = async () => {
    if (!editingProduct?.lightburnFileName || !session?.access_token) return;
    setLightburnBusy(true);
    setEditError("");
    try {
      const response = await fetch(
        `/api/products/lightburn?productId=${editingProduct.id}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setEditError(result.error ?? "LightBurn-filen kunne ikke lastes ned.");
        return;
      }
      const downloadUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = editingProduct.lightburnFileName;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setEditError("Kunne ikke kontakte serveren.");
    } finally {
      setLightburnBusy(false);
    }
  };

  const handleLightburnDelete = async () => {
    if (!editingProduct || !session?.access_token) return;
    setLightburnBusy(true);
    setEditError("");
    try {
      const response = await fetch(
        `/api/products/lightburn?productId=${editingProduct.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setEditError(result.error ?? "LightBurn-filen kunne ikke slettes.");
        return;
      }
      updateLightburnMetadata(editingProduct, {
        name: null,
        sizeBytes: null,
        updatedAt: null,
      });
      setConfirmLightburnDelete(false);
    } catch {
      setEditError("Kunne ikke kontakte serveren.");
    } finally {
      setLightburnBusy(false);
    }
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
    formData.append("imagePositionX", String(editImagePositionX));
    formData.append("imagePositionY", String(editImagePositionY));
    formData.append("imageRotation", String(editImageRotation));
    formData.append("imageZoom", String(editImageZoom));
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
      <RequireRole roles={["King"]}>
        <></>
      </RequireRole>
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
                    <ToggleButton value="custom_order">
                      Spesialbestilling
                    </ToggleButton>
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
                      <Box
                        sx={{
                          position: "relative",
                          height: 160,
                          overflow: "hidden",
                          bgcolor: "#16150F",
                          containerType: "size",
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={product.imageUrl}
                          alt={product.name}
                          sx={{
                            position: "absolute",
                            left: `${product.imagePositionX}%`,
                            top: `${product.imagePositionY}%`,
                            width: isQuarterTurn(product.imageRotation)
                              ? "100cqh"
                              : "100cqw",
                            height: isQuarterTurn(product.imageRotation)
                              ? "100cqw"
                              : "100cqh",
                            maxWidth: "none",
                            objectFit: "contain",
                            objectPosition: "center",
                            transform: imageTransform(
                              product.imageRotation,
                              product.imageZoom,
                            ),
                          }}
                        />
                      </Box>
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
                sx={{
                  position: "relative",
                  width: "100%",
                  height: 220,
                  overflow: "hidden",
                  bgcolor: "#16150F",
                  containerType: "size",
                }}
              >
                <Box
                  component="img"
                  src={editImagePreview}
                  alt="Forhåndsvisning"
                  sx={{
                    position: "absolute",
                    left: `${editImagePositionX}%`,
                    top: `${editImagePositionY}%`,
                    width: isQuarterTurn(editImageRotation)
                      ? "100cqh"
                      : "100cqw",
                    height: isQuarterTurn(editImageRotation)
                      ? "100cqw"
                      : "100cqh",
                    maxWidth: "none",
                    objectFit: "contain",
                    objectPosition: "center",
                    transform: imageTransform(editImageRotation, editImageZoom),
                    transition: "transform 160ms ease",
                  }}
                />
              </Box>
            )}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography fontWeight={700} flex={1}>
                Tilpass bilde
              </Typography>
              <Tooltip title="Roter mot venstre">
                <IconButton
                  aria-label="Roter bildet mot venstre"
                  onClick={() =>
                    setEditImageRotation((current) => (current + 270) % 360)
                  }
                >
                  <RotateLeftIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Roter mot høyre">
                <IconButton
                  aria-label="Roter bildet mot høyre"
                  onClick={() =>
                    setEditImageRotation((current) => (current + 90) % 360)
                  }
                >
                  <RotateRightIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tilbakestill bilde">
                <IconButton
                  aria-label="Tilbakestill bildeplassering"
                  onClick={() => {
                    setEditImagePositionX(50);
                    setEditImagePositionY(50);
                    setEditImageRotation(0);
                    setEditImageZoom(100);
                  }}
                >
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Zoom ut">
                <span>
                  <IconButton
                    aria-label="Zoom ut av produktbildet"
                    disabled={editImageZoom <= 10}
                    onClick={() =>
                      setEditImageZoom((current) => Math.max(10, current - 10))
                    }
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Slider
                value={editImageZoom}
                onChange={(_, value) => setEditImageZoom(value as number)}
                min={10}
                max={250}
                step={5}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                aria-label="Zoom produktbildet"
                sx={{ flex: 1 }}
              />
              <Tooltip title="Zoom inn">
                <span>
                  <IconButton
                    aria-label="Zoom inn på produktbildet"
                    disabled={editImageZoom >= 250}
                    onClick={() =>
                      setEditImageZoom((current) => Math.min(250, current + 10))
                    }
                  >
                    <ZoomInIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 42, textAlign: "right" }}
              >
                {editImageZoom}%
              </Typography>
            </Stack>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Flytt vannrett
              </Typography>
              <Slider
                value={editImagePositionX}
                onChange={(_, value) => setEditImagePositionX(value as number)}
                min={0}
                max={100}
                aria-label="Flytt bildet vannrett"
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Flytt loddrett
              </Typography>
              <Slider
                value={editImagePositionY}
                onChange={(_, value) => setEditImagePositionY(value as number)}
                min={0}
                max={100}
                aria-label="Flytt bildet loddrett"
              />
            </Box>
            <Button component="label" variant="outlined">
              Bytt bilde
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleEditFileChange}
              />
            </Button>
            <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                pt: 2,
              }}
            >
              <Typography fontWeight={700}>LightBurn-fil</Typography>
              {editingProduct?.lightburnFileName ? (
                <>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {editingProduct.lightburnFileName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {editingProduct.lightburnSizeBytes !== null &&
                      formatFileSize(editingProduct.lightburnSizeBytes)}
                    {editingProduct.lightburnUpdatedAt &&
                      ` · Oppdatert ${new Date(
                        editingProduct.lightburnUpdatedAt,
                      ).toLocaleDateString("nb-NO")}`}
                  </Typography>
                  <Stack
                    direction="row"
                    gap={1}
                    flexWrap="wrap"
                    sx={{ mt: 1.5 }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleLightburnDownload}
                      disabled={lightburnBusy}
                    >
                      Last ned
                    </Button>
                    <Button
                      component="label"
                      size="small"
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      disabled={lightburnBusy}
                    >
                      Erstatt
                      <input
                        hidden
                        type="file"
                        accept=".lbrn,.lbrn2"
                        onChange={handleLightburnUpload}
                      />
                    </Button>
                    {confirmLightburnDelete ? (
                      <>
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={handleLightburnDelete}
                          disabled={lightburnBusy}
                        >
                          Bekreft sletting
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setConfirmLightburnDelete(false)}
                          disabled={lightburnBusy}
                        >
                          Behold fil
                        </Button>
                      </>
                    ) : (
                      <Tooltip title="Slett LightBurn-filen">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Slett LightBurn-filen"
                          onClick={() => setConfirmLightburnDelete(true)}
                          disabled={lightburnBusy}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </>
              ) : (
                <Button
                  component="label"
                  size="small"
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  disabled={lightburnBusy}
                  sx={{ mt: 1 }}
                >
                  {lightburnBusy ? "Laster opp..." : "Last opp fil"}
                  <input
                    hidden
                    type="file"
                    accept=".lbrn,.lbrn2"
                    onChange={handleLightburnUpload}
                  />
                </Button>
              )}
            </Box>
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
              <ToggleButton value="custom_order">
                Spesialbestilling
              </ToggleButton>
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
