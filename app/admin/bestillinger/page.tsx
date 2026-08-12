"use client";

import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import PageShell from "../../Components/PageShell";
import { supabase } from "../../lib/supabaseClient";

interface AdminOrder {
  id: string;
  customerName: string | null;
  customerEmail: string;
  names: string[];
  quantity: number;
  status: string;
  estimatedPrice: number | null;
  deliveryEstimate: string | null;
  confirmedAt: string | null;
  createdAt: string;
  productName: string;
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Du må være logget inn som administrator.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/place-card-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = (await response.json()) as
          | AdminOrder[]
          | { error?: string };
        if (!response.ok) {
          setError(
            "error" in result
              ? (result.error ?? "Ingen tilgang.")
              : "Ingen tilgang.",
          );
          return;
        }
        setOrders(result as AdminOrder[]);
      } catch {
        setError("Kunne ikke hente forespørslene.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <PageShell
      eyebrow="ADMIN"
      title="Innkomne forespørsler"
      subtitle="Åpne en forespørsel og svar kunden med prisestimat og forventet leveringstid."
      maxWidth="lg"
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress aria-label="Henter forespørsler" />
        </Box>
      ) : (
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {!error && orders.length === 0 && (
            <Alert severity="info">
              Ingen forespørsler har kommet inn ennå.
            </Alert>
          )}

          {orders.map((order) => (
            <Card
              key={order.id}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <Stack spacing={3}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    gap={2}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {order.productName} · {order.quantity} stk.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Forespørsel #{order.id} ·{" "}
                        {new Intl.DateTimeFormat("nb-NO", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(order.createdAt))}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabels[order.status] ?? order.status}
                      color={order.status === "new" ? "warning" : "success"}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} gap={3}>
                    <Box sx={{ minWidth: 240 }}>
                      <Typography variant="overline" color="text.secondary">
                        Kunde
                      </Typography>
                      <Typography fontWeight={700}>
                        {order.customerName || "Navn ikke oppgitt"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.customerEmail}
                      </Typography>
                    </Box>
                    {order.confirmedAt && (
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Besvart
                        </Typography>
                        <Typography>
                          {new Intl.DateTimeFormat("nb-NO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(order.confirmedAt))}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Navneliste
                    </Typography>
                    <Box
                      component="ol"
                      sx={{
                        mt: 1,
                        mb: 0,
                        pl: 3,
                        columns: { xs: 1, sm: 2, md: 3 },
                        columnGap: 4,
                      }}
                    >
                      {order.names.map((name, index) => (
                        <Typography
                          component="li"
                          key={`${name}-${index}`}
                          sx={{ mb: 0.75, breakInside: "avoid" }}
                        >
                          {name}
                        </Typography>
                      ))}
                    </Box>
                  </Box>

                  <Button
                    variant={order.status === "new" ? "contained" : "outlined"}
                    startIcon={<VisibilityIcon />}
                    href={`/admin/bestillinger/${order.id}`}
                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  >
                    {order.status === "new"
                      ? "Åpne og svar"
                      : "Åpne forespørsel"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </PageShell>
  );
}
