"use client";

import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
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
import { RequireRole, useAuth } from "../../Components/AuthProvider";
import PageShell from "../../Components/PageShell";
import { supabase } from "../../lib/supabaseClient";

interface AdminOrder {
  id: string;
  customerName: string | null;
  customerEmail: string;
  inputMode: string;
  names: string[];
  quantity: number;
  status: string;
  estimatedPrice: number | null;
  deliveryEstimate: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerUpdatedAt: string | null;
  archivedAt: string | null;
  latestMessageAt: string | null;
  unreadCustomerMessageCount: number;
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
    order.latestMessageAt ? new Date(order.latestMessageAt).getTime() : 0,
  );
}

function needsAttention(order: AdminOrder) {
  return (
    order.status === "new" ||
    order.unreadCustomerMessageCount > 0 ||
    (order.customerUpdatedAt !== null &&
      new Date(order.customerUpdatedAt).getTime() >
        (order.confirmedAt ? new Date(order.confirmedAt).getTime() : 0))
  );
}

export default function AdminOrdersPage() {
  const { role, session } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      if (role !== "King") return;
      const token = session?.access_token;
      if (!token) return;

      try {
        const response = await fetch(
          `/api/admin/place-card-orders?archived=${showArchived}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
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

    void loadOrders();
  }, [role, session?.access_token, showArchived]);

  const handleArchiveChange = async (order: AdminOrder) => {
    setError("");
    setSuccess("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Du må være logget inn som administrator.");
      return;
    }

    setUpdatingId(order.id);
    try {
      const response = await fetch("/api/admin/place-card-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          action: showArchived ? "restore" : "archive",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Bestillingen kunne ikke oppdateres.");
        return;
      }

      setOrders((current) =>
        current.filter((currentOrder) => currentOrder.id !== order.id),
      );
      setSuccess(
        showArchived
          ? `Bestilling #${order.id} er flyttet tilbake til aktive.`
          : `Bestilling #${order.id} er arkivert.`,
      );
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setUpdatingId(null);
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
          {success && <Alert severity="success">{success}</Alert>}
          <Stack direction="row" spacing={1}>
            <Button
              variant={showArchived ? "outlined" : "contained"}
              onClick={() => {
                setSuccess("");
                setLoading(true);
                setShowArchived(false);
              }}
              disabled={loading || !showArchived}
            >
              Aktive
            </Button>
            <Button
              variant={showArchived ? "contained" : "outlined"}
              startIcon={<ArchiveOutlinedIcon />}
              onClick={() => {
                setSuccess("");
                setLoading(true);
                setShowArchived(true);
              }}
              disabled={loading || showArchived}
            >
              Arkiv
            </Button>
          </Stack>
          {!error && orders.length === 0 && (
            <Alert severity="info">
              {showArchived
                ? "Ingen bestillinger er arkivert."
                : "Ingen forespørsler har kommet inn ennå."}
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
                            #{order.id}
                            {["name_list", "custom_order"].includes(
                              order.inputMode,
                            )
                              ? ` · ${order.quantity} stk.`
                              : ""}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              attention
                                ? order.unreadCustomerMessageCount > 0
                                  ? `${order.unreadCustomerMessageCount} ny melding`
                                  : "Trenger svar"
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
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Button
                              variant={attention ? "contained" : "outlined"}
                              startIcon={<VisibilityIcon />}
                              href={`/admin/bestillinger/${order.id}`}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {attention ? "Åpne og svar" : "Åpne"}
                            </Button>
                            {(showArchived ||
                              ["completed", "cancelled"].includes(
                                order.status,
                              )) && (
                              <Button
                                variant="outlined"
                                startIcon={
                                  showArchived ? (
                                    <UnarchiveOutlinedIcon />
                                  ) : (
                                    <ArchiveOutlinedIcon />
                                  )
                                }
                                onClick={() => handleArchiveChange(order)}
                                disabled={updatingId === order.id}
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                {updatingId === order.id
                                  ? "Oppdaterer..."
                                  : showArchived
                                    ? "Gjenopprett"
                                    : "Arkiver"}
                              </Button>
                            )}
                          </Stack>
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
