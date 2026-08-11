"use client";

import GoogleIcon from "@mui/icons-material/Google";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import PageShell from "../Components/PageShell";
import { supabase } from "../lib/supabaseClient";

interface PlaceCardOrder {
  id: string;
  names: string[];
  quantity: number;
  status: string;
  createdAt: string;
  productName: string;
}

const statusLabels: Record<string, string> = {
  new: "Ny",
  confirmed: "Bekreftet",
  in_production: "I produksjon",
  completed: "Ferdig",
  cancelled: "Kansellert",
};

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<PlaceCardOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = async (token: string) => {
    const response = await fetch("/api/place-card-orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error ?? "Kunne ikke hente bestillingene.");
    }

    const data = (await response.json()) as PlaceCardOrder[];
    setOrders(data);
    setDrafts(
      Object.fromEntries(data.map((order) => [order.id, order.names.join("\n")])),
    );
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.access_token) {
        try {
          await loadOrders(data.session.access_token);
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kunne ikke hente bestillingene.",
          );
        }
      }
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setOrders([]);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  };

  const handleSave = async (orderId: string) => {
    setError("");
    setSuccess("");
    const names = (drafts[orderId] ?? "")
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setError("Navnelisten kan ikke være tom.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Du må logge inn på nytt.");
      return;
    }

    setSavingId(orderId);
    try {
      const response = await fetch("/api/place-card-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, names }),
      });
      const result = (await response.json()) as {
        error?: string;
        quantity?: number;
      };
      if (!response.ok) {
        setError(result.error ?? "Endringen kunne ikke lagres.");
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, names, quantity: result.quantity ?? names.length }
            : order,
        ),
      );
      setSuccess(`Bestilling #${orderId} er oppdatert.`);
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <PageShell
      eyebrow="DIN KONTO"
      title="Mine bestillinger"
      subtitle="Se bordkortbestillingene dine og oppdater navnelisten før produksjonen starter."
      maxWidth="md"
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress aria-label="Henter bestillinger" />
        </Box>
      ) : !user ? (
        <Card sx={{ maxWidth: 560, mx: "auto", border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
            <Stack spacing={3} alignItems="center">
              <Typography variant="h5" fontWeight={700}>
                Logg inn for å se bestillingene
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleLogin}
                sx={{ textTransform: "none", px: 4 }}
              >
                Logg inn med Google
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          {orders.length === 0 ? (
            <Alert
              severity="info"
              action={
                <Button color="inherit" href="/products/bordkort">
                  Bestill bordkort
                </Button>
              }
            >
              Du har ingen bestillinger ennå.
            </Alert>
          ) : (
            orders.map((order) => {
              const editable = order.status === "new";
              const draftNames = (drafts[order.id] ?? "")
                .split("\n")
                .map((name) => name.trim())
                .filter(Boolean);

              return (
                <Card key={order.id} sx={{ border: "1px solid", borderColor: "divider" }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                    <Stack spacing={3}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        gap={1}
                      >
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {order.productName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bestilling #{order.id} · {new Intl.DateTimeFormat("nb-NO", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(order.createdAt))}
                          </Typography>
                        </Box>
                        <Chip label={statusLabels[order.status] ?? order.status} color={editable ? "primary" : "default"} />
                      </Stack>

                      <TextField
                        label="Ett navn per linje"
                        value={drafts[order.id] ?? ""}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                        multiline
                        minRows={5}
                        fullWidth
                        disabled={!editable}
                        helperText={
                          editable
                            ? `${draftNames.length} bordkort · kan endres til produksjonen starter`
                            : `${order.quantity} bordkort · navnelisten er låst`
                        }
                      />

                      {editable && (
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          disabled={savingId === order.id || draftNames.length === 0}
                          onClick={() => handleSave(order.id)}
                          sx={{ alignSelf: "flex-start", textTransform: "none" }}
                        >
                          {savingId === order.id ? "Lagrer..." : "Lagre navneliste"}
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      )}
    </PageShell>
  );
}