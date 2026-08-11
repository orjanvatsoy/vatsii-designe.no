"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageShell from "../../../Components/PageShell";
import { supabase } from "../../../lib/supabaseClient";

interface OrderDetails {
  id: string;
  customerName: string | null;
  customerEmail: string;
  names: string[];
  quantity: number;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
  product: {
    name: string;
    category: string;
    description: string;
    imageUrl: string;
  };
}

const statusLabels: Record<string, string> = {
  new: "Ny",
  confirmed: "Mottatt og bekreftet",
  in_production: "I produksjon",
  completed: "Ferdig",
  cancelled: "Kansellert",
};

export default function AdminOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Du må være logget inn som administrator.");
        setLoading(false);
        return;
      }

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
              ? (result.error ?? "Bestillingen kunne ikke hentes.")
              : "Bestillingen kunne ikke hentes.",
          );
          return;
        }
        setOrder(result as OrderDetails);
      } catch {
        setError("Kunne ikke kontakte serveren.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleConfirm = async () => {
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
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = (await response.json()) as {
        error?: string;
        confirmedAt?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "Bestillingen kunne ikke bekreftes.");
        return;
      }

      setOrder((current) =>
        current
          ? {
              ...current,
              status: "confirmed",
              confirmedAt: result.confirmedAt ?? new Date().toISOString(),
            }
          : current,
      );
      setSuccess("Kunden kan nå se at bestillingen er mottatt.");
    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <PageShell
      eyebrow="ADMIN · ORDREDETALJER"
      title={order ? `Bestilling #${order.id}` : "Bestilling"}
      subtitle="Kontroller produkt, kunde og navneliste før du bekrefter mottak."
      maxWidth="lg"
    >
      <Stack spacing={3}>
        <Button
          href="/admin/bestillinger"
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
        >
          Tilbake til bestillinger
        </Button>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress aria-label="Henter bestilling" />
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
                  <Chip label={`${order.quantity} bordkort`} />
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
                    Bestilt
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
              <Typography variant="h5" fontWeight={700} mb={0.5}>
                Navneliste
              </Typography>
              <Typography color="text.secondary" mb={2.5}>
                {order.quantity} navn inngår i bestillingen.
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
            </Box>

            {order.status === "new" ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<CheckCircleIcon />}
                disabled={confirming}
                onClick={handleConfirm}
                sx={{ alignSelf: "flex-start", textTransform: "none", px: 4 }}
              >
                {confirming ? "Bekrefter..." : "Bekreft mottatt"}
              </Button>
            ) : order.confirmedAt ? (
              <Alert severity="success">
                Mottak bekreftet{" "}
                {new Intl.DateTimeFormat("nb-NO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.confirmedAt))}
                .
              </Alert>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </PageShell>
  );
}
