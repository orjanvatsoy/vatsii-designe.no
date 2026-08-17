"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireRole, useAuth } from "../../../Components/AuthProvider";
import OrderMessages, {
  type OrderMessage,
} from "../../../Components/OrderMessages";
import PageShell from "../../../Components/PageShell";
import { supabase } from "../../../lib/supabaseClient";

interface OrderDetails {
  id: string;
  customerName: string | null;
  customerEmail: string;
  inputMode: string;
  names: string[];
  quantity: number;
  customDimensions: string | null;
  customBudget: number | null;
  desiredDeliveryDate: string | null;
  messages: OrderMessage[];
  attachments: Array<{
    id: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    url: string;
  }>;
  status: string;
  estimatedPrice: number | null;
  deliveryEstimate: string | null;
  confirmedAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  product: {
    name: string;
    category: string;
    description: string;
    imageUrl: string;
  };
}

const statusLabels: Record<string, string> = {
  new: "Forespørsel",
  confirmed: "Tilbud",
  estimated: "Tilbud sendt",
  approved: "Godkjent tilbud",
  in_production: "Godkjent tilbud",
  completed: "Levert",
  cancelled: "Kansellert",
};

function formatNames(names: string[], maxLength = 28) {
  const lines: string[] = [];
  let currentLine = "";

  for (const name of names.map((value) => value.trim().replaceAll(" ", ""))) {
    const nextLine = currentLine ? `${currentLine} ${name}` : name;
    if (nextLine.length <= maxLength) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = name;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeCsvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { role, session } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      if (role !== "King") return;
      const token = session?.access_token;
      if (!token) return;

      try {
        const response = await fetch(`/api/admin/place-card-orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = (await response.json()) as
          | OrderDetails
          | { error?: string };
        if (!response.ok) {
          setError(
            "error" in result
              ? (result.error ?? "Forespørselen kunne ikke hentes.")
              : "Forespørselen kunne ikke hentes.",
          );
          return;
        }
        setOrder(result as OrderDetails);
        window.dispatchEvent(new Event("attention-updated"));
      } catch {
        setError("Kunne ikke kontakte serveren.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [id, role, session?.access_token]);

  const handleConfirm = async () => {
    if (!order) return;
    setError("");
    setSuccess("");
    const price = Number(estimatedPrice);
    if (!Number.isInteger(price) || price <= 0 || !deliveryEstimate.trim()) {
      setError("Oppgi prisestimat i hele kroner og forventet leveringstid.");
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Du må logge inn på nytt.");
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch("/api/admin/place-card-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          estimatedPrice: price,
          deliveryEstimate: deliveryEstimate.trim(),
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        estimatedPrice?: number;
        deliveryEstimate?: string;
        confirmedAt?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "Svaret kunne ikke sendes.");
        return;
      }

      setOrder((current) =>
        current
          ? {
              ...current,
              status: "estimated",
              estimatedPrice: result.estimatedPrice ?? price,
              deliveryEstimate:
                result.deliveryEstimate ?? deliveryEstimate.trim(),
              confirmedAt: result.confirmedAt ?? new Date().toISOString(),
            }
          : current,
      );
      setSuccess("Prisestimat og leveringstid er sendt til kunden.");
    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setConfirming(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!order) return;
    setError("");
    setSuccess("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Du må logge inn på nytt.");
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch("/api/admin/place-card-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          action: "mark-delivered",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Ordren kunne ikke markeres som levert.");
        return;
      }
      setOrder((current) =>
        current ? { ...current, status: "completed" } : current,
      );
      setSuccess("Ordren er markert som levert.");
    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!order) return;

    const shouldFormatNames =
      order.product.name.trim().toLocaleLowerCase("nb-NO") === "navn";
    const rows = shouldFormatNames ? formatNames(order.names) : order.names;
    const csv = `\uFEFF${rows.map(escapeCsvValue).join("\r\n")}\r\n`;
    const blobUrl = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    const productName = order.product.name
      .trim()
      .toLocaleLowerCase("nb-NO")
      .replaceAll(/[^a-z0-9æøå]+/g, "-")
      .replaceAll(/^-|-$/g, "");
    link.href = blobUrl;
    link.download = `bordkort-${order.id}-${productName || "navn"}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleCancelOrder = async () => {
    if (!order || cancellationReason.trim().length < 5) return;
    setError("");
    setSuccess("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Du må logge inn på nytt.");
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch("/api/admin/place-card-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          action: "cancel",
          reason: cancellationReason.trim(),
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        cancellationReason?: string;
        notificationSent?: boolean;
      };
      if (!response.ok) {
        setError(result.error ?? "Ordren kunne ikke kanselleres.");
        return;
      }

      setOrder((current) =>
        current
          ? {
              ...current,
              status: "cancelled",
              cancellationReason:
                result.cancellationReason ?? cancellationReason.trim(),
            }
          : current,
      );
      if (result.notificationSent) {
        setSuccess("Ordren er kansellert, og kunden har fått beskjed.");
      } else {
        setError(
          "Ordren er kansellert, men e-posten kunne ikke sendes. Begrunnelsen vises fortsatt på kundens kontoside.",
        );
      }
      setCancellationReason("");
    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setConfirming(false);
    }
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
      eyebrow="ADMIN · FORESPØRSEL"
      title={order ? `Forespørsel #${order.id}` : "Forespørsel"}
      subtitle="Kontroller produkt, kunde og innhold, og svar med prisestimat og leveringstid."
      maxWidth="lg"
    >
      <Stack spacing={3}>
        <Button
          href="/admin/bestillinger"
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
        >
          Tilbake til forespørsler
        </Button>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress aria-label="Henter forespørsel" />
          </Box>
        ) : error && !order ? (
          <Alert severity="error">{error}</Alert>
        ) : order ? (
          <Stack spacing={4}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 5 }}
              alignItems="stretch"
            >
              {order.product.imageUrl && (
                <Box
                  sx={{
                    position: "relative",
                    width: { xs: "100%", md: 360 },
                    minHeight: { xs: 260, md: 320 },
                    flexShrink: 0,
                    overflow: "hidden",
                    bgcolor: "#16150F",
                    borderRadius: 1,
                  }}
                >
                  <Image
                    src={order.product.imageUrl}
                    alt={order.product.name}
                    fill
                    sizes="(max-width: 900px) 100vw, 360px"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </Box>
              )}

              <Stack spacing={2.5} flex={1} justifyContent="center">
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Produkt
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {order.product.name}
                  </Typography>
                  <Typography color="text.secondary" mt={1}>
                    {order.product.description}
                  </Typography>
                </Box>

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip label={order.product.category} variant="outlined" />
                  {["name_list", "custom_order"].includes(order.inputMode) && (
                    <Chip label={`${order.quantity} stk.`} />
                  )}
                  <Chip
                    label={statusLabels[order.status] ?? order.status}
                    color={order.status === "new" ? "warning" : "success"}
                  />
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Kunde
                  </Typography>
                  <Typography fontWeight={700}>
                    {order.customerName || "Navn ikke oppgitt"}
                  </Typography>
                  <Typography color="text.secondary">
                    {order.customerEmail}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Sendt inn
                  </Typography>
                  <Typography>
                    {new Intl.DateTimeFormat("nb-NO", {
                      dateStyle: "long",
                      timeStyle: "short",
                    }).format(new Date(order.createdAt))}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Divider />

            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                gap={1.5}
                mb={0.5}
              >
                <Typography variant="h5" fontWeight={700}>
                  {order.inputMode === "name_list"
                    ? "Navneliste"
                    : order.inputMode === "single_name"
                      ? "Navn"
                      : order.inputMode === "custom_order"
                        ? "Spesialbestilling"
                        : "Kommentar"}
                </Typography>
                {["name_list", "single_name"].includes(order.inputMode) && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadCsv}
                    sx={{ textTransform: "none" }}
                  >
                    Last ned CSV
                  </Button>
                )}
              </Stack>
              {order.inputMode === "custom_order" ? (
                <Stack spacing={3} mt={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Hva ønsker kunden laget?
                    </Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      {order.names.join("\n")}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Mål eller størrelse
                      </Typography>
                      <Typography fontWeight={700}>
                        {order.customDimensions}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Antall
                      </Typography>
                      <Typography fontWeight={700}>{order.quantity}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Omtrentlig budsjett
                      </Typography>
                      <Typography fontWeight={700}>
                        {order.customBudget === null
                          ? "Ikke oppgitt"
                          : `${new Intl.NumberFormat("nb-NO").format(order.customBudget)} kr`}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Ønsket leveringsdato
                      </Typography>
                      <Typography fontWeight={700}>
                        {order.desiredDeliveryDate
                          ? new Intl.DateTimeFormat("nb-NO", {
                              dateStyle: "long",
                              timeZone: "UTC",
                            }).format(
                              new Date(
                                `${order.desiredDeliveryDate}T00:00:00Z`,
                              ),
                            )
                          : "Ikke oppgitt"}
                      </Typography>
                    </Box>
                  </Box>
                  {order.attachments.length > 0 && (
                    <Box>
                      <Typography variant="h6" fontWeight={700} mb={1.5}>
                        Bilder og skisser
                      </Typography>
                      <Stack direction="row" gap={2} flexWrap="wrap">
                        {order.attachments.map((attachment) =>
                          attachment.contentType.startsWith("image/") ? (
                            <Button
                              key={attachment.id}
                              component="a"
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ p: 0, display: "block" }}
                            >
                              <Box
                                component="img"
                                src={attachment.url}
                                alt={attachment.fileName}
                                sx={{
                                  width: 160,
                                  height: 120,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                }}
                              />
                            </Button>
                          ) : (
                            <Button
                              key={attachment.id}
                              variant="outlined"
                              component="a"
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Åpne {attachment.fileName}
                            </Button>
                          ),
                        )}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              ) : order.inputMode === "name_list" ? (
                <>
                  <Typography color="text.secondary" mb={2.5}>
                    {order.quantity} navn inngår i forespørselen.
                  </Typography>
                  <Box
                    component="ol"
                    sx={{
                      m: 0,
                      pl: 3,
                      columns: { xs: 1, sm: 2, md: 3 },
                      columnGap: 5,
                    }}
                  >
                    {order.names.map((name, index) => (
                      <Typography
                        component="li"
                        key={`${name}-${index}`}
                        sx={{ py: 0.75, breakInside: "avoid" }}
                      >
                        {name}
                      </Typography>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {order.names.join("\n")}
                </Typography>
              )}
            </Box>

            <Divider />

            <OrderMessages
              orderId={order.id}
              currentRole="admin"
              messages={order.messages}
              endpoint={`/api/admin/place-card-orders/${order.id}/messages`}
              onMessageSent={(message) =>
                setOrder((current) =>
                  current
                    ? { ...current, messages: [...current.messages, message] }
                    : current,
                )
              }
            />

            {order.status === "new" ? (
              <Stack spacing={2} sx={{ maxWidth: 620 }}>
                <Typography variant="h5" fontWeight={700}>
                  Svar på forespørselen
                </Typography>
                <TextField
                  label="Prisestimat (kr)"
                  type="number"
                  value={estimatedPrice}
                  onChange={(event) => setEstimatedPrice(event.target.value)}
                  required
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                />
                <TextField
                  label="Forventet leveringstid"
                  value={deliveryEstimate}
                  onChange={(event) => setDeliveryEstimate(event.target.value)}
                  placeholder="For eksempel 2–3 uker"
                  helperText="Oppgi en dato eller et tidsrom som kunden kan forstå."
                  required
                  slotProps={{ htmlInput: { maxLength: 200 } }}
                />
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  disabled={
                    confirming || !estimatedPrice || !deliveryEstimate.trim()
                  }
                  onClick={handleConfirm}
                  sx={{ alignSelf: "flex-start", textTransform: "none", px: 4 }}
                >
                  {confirming ? "Sender svar..." : "Send estimat til kunden"}
                </Button>
              </Stack>
            ) : order.estimatedPrice && order.deliveryEstimate ? (
              <Box
                sx={{
                  width: { xs: "100%", md: "70%" },
                  ml: { md: "auto" },
                  p: { xs: 2.5, md: 3 },
                  border: "1px solid",
                  borderColor: "secondary.main",
                  borderRadius: 1,
                  bgcolor: "rgba(50,79,58,0.24)",
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Sendt fra Vatsii Designe
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    mt: 1,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pris
                    </Typography>
                    <Typography
                      variant="h5"
                      color="primary.light"
                      fontWeight={800}
                    >
                      {new Intl.NumberFormat("nb-NO").format(
                        order.estimatedPrice,
                      )}{" "}
                      kr
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Leveringstid
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {order.deliveryEstimate}
                    </Typography>
                  </Box>
                </Box>
                {order.status === "approved" && (
                  <Button
                    variant="contained"
                    startIcon={<LocalShippingOutlinedIcon />}
                    onClick={handleMarkDelivered}
                    disabled={confirming}
                    sx={{ mt: 2.5, textTransform: "none" }}
                  >
                    {confirming ? "Oppdaterer..." : "Marker som levert"}
                  </Button>
                )}
                {order.status === "completed" && (
                  <Typography color="primary.light" fontWeight={700} mt={2}>
                    Ordren er levert.
                  </Typography>
                )}
              </Box>
            ) : null}

            {order.status === "cancelled" && order.cancellationReason && (
              <Alert severity="warning">
                <Typography fontWeight={700}>Kanselleringsgrunn</Typography>
                {order.cancellationReason}
              </Alert>
            )}

            {!["completed", "cancelled"].includes(order.status) && (
              <Stack spacing={2} sx={{ maxWidth: 620 }}>
                <Divider />
                <Typography variant="h5" fontWeight={700}>
                  Kanseller ordre
                </Typography>
                <TextField
                  label="Begrunnelse til kunden"
                  value={cancellationReason}
                  onChange={(event) =>
                    setCancellationReason(event.target.value)
                  }
                  multiline
                  minRows={3}
                  required
                  helperText={`${cancellationReason.trim().length}/500 tegn · sendes til kunden på e-post`}
                  slotProps={{ htmlInput: { minLength: 5, maxLength: 500 } }}
                />
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<CancelOutlinedIcon />}
                  disabled={confirming || cancellationReason.trim().length < 5}
                  onClick={handleCancelOrder}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  {confirming ? "Kansellerer..." : "Kanseller og send beskjed"}
                </Button>
              </Stack>
            )}
          </Stack>
        ) : null}
      </Stack>
    </PageShell>
  );
}
