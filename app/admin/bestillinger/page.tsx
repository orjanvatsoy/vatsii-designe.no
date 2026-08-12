"use client";

import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  updatedAt: string;
  customerUpdatedAt: string | null;
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

const flowSteps = ["Forespørsel", "Tilbud", "Godkjent", "Levert"];

function getFlowStep(status: string) {
  if (status === "completed") return 3;
  if (status === "approved" || status === "in_production") return 2;
  if (status === "estimated" || status === "confirmed") return 1;
  return 0;
}

function getLatestActivity(order: AdminOrder) {
  return Math.max(
    new Date(order.createdAt).getTime(),
    new Date(order.updatedAt).getTime(),
    order.confirmedAt ? new Date(order.confirmedAt).getTime() : 0,
    order.customerUpdatedAt ? new Date(order.customerUpdatedAt).getTime() : 0,
  );
}

function needsAttention(order: AdminOrder) {
  return (
    order.status === "new" ||
    (order.customerUpdatedAt !== null &&
      new Date(order.customerUpdatedAt).getTime() >
        (order.confirmedAt ? new Date(order.confirmedAt).getTime() : 0))
  );
}

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
        setOrders(
          (result as AdminOrder[]).sort((left, right) => {
            const attentionDifference =
              Number(needsAttention(right)) - Number(needsAttention(left));
            return (
              attentionDifference ||
              getLatestActivity(right) - getLatestActivity(left)
            );
          }),
        );
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

          {!error && orders.length > 0 && (
            <TableContainer
              component={Paper}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <Table sx={{ minWidth: 900 }} aria-label="Innkomne forespørsler">
                <TableHead>
                  <TableRow>
                    <TableCell>Ordre</TableCell>
                    <TableCell>Kunde</TableCell>
                    <TableCell>Fremdrift</TableCell>
                    <TableCell>Sist aktivitet</TableCell>
                    <TableCell align="right">Handling</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const attention = needsAttention(order);
                    return (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{ verticalAlign: "top" }}
                      >
                        <TableCell>
                          <Typography fontWeight={700}>
                            {order.productName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            #{order.id} · {order.quantity} stk.
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              attention
                                ? "Need attention"
                                : (statusLabels[order.status] ?? order.status)
                            }
                            color={attention ? "warning" : "default"}
                            sx={{ mt: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700}>
                            {order.customerName || "Navn ikke oppgitt"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.customerEmail}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 280 }}>
                          <Stepper
                            activeStep={getFlowStep(order.status)}
                            alternativeLabel
                          >
                            {flowSteps.map((step) => (
                              <Step key={step}>
                                <StepLabel>{step}</StepLabel>
                              </Step>
                            ))}
                          </Stepper>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="body2">
                            {new Intl.DateTimeFormat("nb-NO", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(getLatestActivity(order)))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.status === "new"
                              ? "Ny forespørsel"
                              : needsAttention(order)
                                ? "Kunden oppdaterte"
                                : "Sist behandlet"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant={attention ? "contained" : "outlined"}
                            startIcon={<VisibilityIcon />}
                            href={`/admin/bestillinger/${order.id}`}
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {attention ? "Åpne og svar" : "Åpne"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      )}
    </PageShell>
  );
}
