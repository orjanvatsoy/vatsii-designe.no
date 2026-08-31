"use client";

import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Tooltip,
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

interface AdminOrdersResponse {
  orders: AdminOrder[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    anchor: HTMLElement;
    order: AdminOrder;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadOrders = async () => {
      if (role !== "King") return;
      const token = session?.access_token;
      if (!token) return;

      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/admin/place-card-orders?archived=${showArchived}&page=${page}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const result = (await response.json()) as
          | AdminOrdersResponse
          | { error?: string };
        if (!response.ok) {
          const apiError = "error" in result ? result.error : undefined;
          if (active) {
            setError(
              response.status === 401 || response.status === 403
                ? "Økten er utløpt. Oppdater siden og logg inn på nytt."
                : (apiError ?? "Kunne ikke hente forespørslene."),
            );
          }
          return;
        }
        const responseData = result as AdminOrdersResponse;
        if (active) {
          setOrders(
            responseData.orders.sort((left, right) => {
              const attentionDifference =
                Number(needsAttention(right)) - Number(needsAttention(left));
              return (
                attentionDifference ||
                getLatestActivity(right) - getLatestActivity(left)
              );
            }),
          );
          setPageSize(responseData.pagination.pageSize);
          setTotalCount(responseData.pagination.totalCount);
          setTotalPages(responseData.pagination.totalPages);
          if (page > responseData.pagination.totalPages) {
            setPage(responseData.pagination.totalPages);
          }
        }
      } catch {
        if (active) setError("Kunne ikke hente forespørslene.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadOrders();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, role, session?.access_token, showArchived]);

  const removeOrderFromCurrentView = (orderId: string) => {
    const nextTotalCount = Math.max(0, totalCount - 1);
    const nextTotalPages = Math.max(1, Math.ceil(nextTotalCount / pageSize));
    setOrders((current) =>
      current.filter((currentOrder) => currentOrder.id !== orderId),
    );
    setTotalCount(nextTotalCount);
    setTotalPages(nextTotalPages);
    if (page > nextTotalPages) setPage(nextTotalPages);
  };

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

      removeOrderFromCurrentView(order.id);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setError("");
    setSuccess("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Du må være logget inn som administrator.");
      return;
    }

    setDeletingId(deleteTarget.id);
    try {
      const response = await fetch(
        `/api/admin/place-card-orders/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Forespørselen kunne ikke slettes.");
        return;
      }

      removeOrderFromCurrentView(deleteTarget.id);
      setSuccess(`Forespørsel #${deleteTarget.id} er slettet permanent.`);
      setDeleteTarget(null);
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setDeletingId(null);
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
                setPage(1);
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
                setPage(1);
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
            <Stack spacing={1.25} aria-label="Innkomne forespørsler">
              {orders.map((order) => {
                const attention = needsAttention(order);
                const terminal = ["completed", "cancelled"].includes(
                  order.status,
                );
                const currentStep = getFlowStep(order.status);
                return (
                  <Paper
                    key={order.id}
                    component="article"
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "minmax(0, 1fr)",
                        md: "minmax(0, 1.4fr) minmax(220px, 0.8fr) auto",
                      },
                      alignItems: "center",
                      gap: { xs: 1.5, md: 3 },
                      p: { xs: 2, sm: 2.5 },
                      border: "1px solid",
                      borderColor: attention ? "warning.main" : "divider",
                      borderLeftWidth: attention ? 3 : 1,
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Typography fontWeight={700}>
                          {order.productName}
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
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        #{order.id}
                        {["name_list", "custom_order"].includes(order.inputMode)
                          ? ` · ${order.quantity} stk.`
                          : ""}
                        {` · ${order.customerName || order.customerEmail}`}
                      </Typography>
                      {!terminal && !showArchived && (
                        <Box sx={{ mt: 1.5, maxWidth: 420 }}>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4, 1fr)",
                              gap: 0.75,
                            }}
                          >
                            {flowSteps.map((step, index) => (
                              <Box
                                key={step}
                                title={step}
                                sx={{
                                  height: 3,
                                  bgcolor:
                                    index <= currentStep
                                      ? "primary.light"
                                      : "divider",
                                }}
                              />
                            ))}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {flowSteps[currentStep]}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2">
                        {new Intl.DateTimeFormat("nb-NO", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(getLatestActivity(order)))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.status === "new"
                          ? "Ny forespørsel"
                          : attention
                            ? "Kunden oppdaterte"
                            : "Sist aktivitet"}
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      justifyContent={{ xs: "flex-start", md: "flex-end" }}
                    >
                      <Button
                        variant={attention ? "contained" : "outlined"}
                        startIcon={<VisibilityIcon />}
                        href={`/admin/bestillinger/${order.id}`}
                      >
                        {attention ? "Åpne og svar" : "Åpne"}
                      </Button>
                      {(showArchived || terminal) && (
                        <Tooltip
                          title={showArchived ? "Gjenopprett" : "Arkiver"}
                        >
                          <span>
                            <IconButton
                              color="primary"
                              aria-label={
                                showArchived ? "Gjenopprett" : "Arkiver"
                              }
                              onClick={() => handleArchiveChange(order)}
                              disabled={updatingId === order.id}
                              sx={{ width: 44, height: 44 }}
                            >
                              {showArchived ? (
                                <UnarchiveOutlinedIcon />
                              ) : (
                                <ArchiveOutlinedIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      <Tooltip title="Flere handlinger">
                        <IconButton
                          aria-label={`Flere handlinger for forespørsel ${order.id}`}
                          onClick={(event) =>
                            setActionMenu({
                              anchor: event.currentTarget,
                              order,
                            })
                          }
                          sx={{ width: 44, height: 44 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
          {!error && totalPages > 1 && (
            <Stack alignItems="center" spacing={1} pt={1}>
              <Pagination
                count={totalPages}
                page={page}
                color="primary"
                onChange={(_, nextPage) => setPage(nextPage)}
                siblingCount={0}
              />
              <Typography variant="caption" color="text.secondary">
                {totalCount} forespørsler
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
      <Menu
        anchorEl={actionMenu?.anchor}
        open={Boolean(actionMenu)}
        onClose={() => setActionMenu(null)}
      >
        <MenuItem
          onClick={() => {
            if (actionMenu) setDeleteTarget(actionMenu.order);
            setActionMenu(null);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          Slett permanent
        </MenuItem>
      </Menu>
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Slett forespørselen permanent?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Forespørsel #{deleteTarget?.id}, alle meldinger og alle vedlegg
            slettes. Dette kan ikke angres.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            color="inherit"
            onClick={() => setDeleteTarget(null)}
            disabled={Boolean(deletingId)}
          >
            Behold
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={Boolean(deletingId)}
          >
            {deletingId ? "Sletter..." : "Slett permanent"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
