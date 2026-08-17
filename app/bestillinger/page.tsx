"use client";

import EmailIcon from "@mui/icons-material/Email";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SaveIcon from "@mui/icons-material/Save";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../Components/AuthProvider";
import OrderMessages, { type OrderMessage } from "../Components/OrderMessages";
import PageShell from "../Components/PageShell";
import { supabase } from "../lib/supabaseClient";

interface PlaceCardOrder {
  id: string;
  inputMode: string;
  names: string[];
  quantity: number;
  messages: OrderMessage[];
  customDimensions?: string | null;
  customBudget?: number | null;
  desiredDeliveryDate?: string | null;
  attachments?: Array<{
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
  productName: string;
}

const useMockData =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const mockOrders: PlaceCardOrder[] = [
  {
    id: "1042",
    inputMode: "name_list",
    names: ["Ingrid", "Marius", "Sofie", "Henrik"],
    quantity: 4,
    messages: [],
    status: "estimated",
    estimatedPrice: 480,
    deliveryEstimate: "7-10 virkedager",
    confirmedAt: null,
    cancellationReason: null,
    createdAt: "2026-08-12T10:30:00.000Z",
    productName: "Bordkort i valnøtt",
  },
  {
    id: "1038",
    inputMode: "name_list",
    names: ["Amalie", "Oskar", "Thea"],
    quantity: 3,
    messages: [],
    status: "new",
    estimatedPrice: null,
    deliveryEstimate: null,
    confirmedAt: null,
    cancellationReason: null,
    createdAt: "2026-08-11T14:15:00.000Z",
    productName: "Bordkort i lys eik",
  },
  {
    id: "1021",
    inputMode: "name_list",
    names: ["Ida", "Jonas", "Emilie", "Noah", "Selma"],
    quantity: 5,
    messages: [],
    status: "completed",
    estimatedPrice: 600,
    deliveryEstimate: "Levert 2. august",
    confirmedAt: "2026-07-25T09:00:00.000Z",
    cancellationReason: null,
    createdAt: "2026-07-20T08:45:00.000Z",
    productName: "Bordkort i valnøtt",
  },
];

const statusLabels: Record<string, string> = {
  new: "Forespørsel",
  confirmed: "Tilbud",
  estimated: "Tilbud",
  approved: "Godkjent tilbud",
  in_production: "Godkjent tilbud",
  completed: "Levert",
  cancelled: "Kansellert",
};

const flowSteps = ["Forespørsel", "Tilbud", "Godkjent tilbud", "Levert"];

function getFlowStep(status: string) {
  if (status === "completed") return 3;
  if (status === "approved" || status === "in_production") return 2;
  if (status === "estimated" || status === "confirmed") return 1;
  return 0;
}

async function readJsonResponse<T>(response: Response, fallback: string) {
  const responseText = await response.text();
  if (!responseText) throw new Error(fallback);

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(fallback);
  }
}

export default function OrdersPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<PlaceCardOrder[]>(
    useMockData ? mockOrders : [],
  );
  const [drafts, setDrafts] = useState<Record<string, string>>(
    useMockData
      ? Object.fromEntries(
          mockOrders.map((order) => [order.id, order.names.join("\n")]),
        )
      : {},
  );
  const [loading, setLoading] = useState(!useMockData);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = async (token: string) => {
    const response = await fetch("/api/place-card-orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await readJsonResponse<
      PlaceCardOrder[] | { error?: string }
    >(response, "Kunne ikke hente forespørslene.");
    if (!response.ok) {
      throw new Error(
        !Array.isArray(result) && result.error
          ? result.error
          : "Kunne ikke hente forespørslene.",
      );
    }
    if (!Array.isArray(result)) {
      throw new Error("Serveren returnerte et ugyldig svar.");
    }

    setOrders(result);
    window.dispatchEvent(new Event("attention-updated"));
    setDrafts(
      Object.fromEntries(
        result.map((order) => [order.id, order.names.join("\n")]),
      ),
    );
  };

  useEffect(() => {
    if (useMockData) return;
    if (authLoading) return;

    const token = session?.access_token;
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadOrders(token)
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Kunne ikke hente forespørslene.",
        );
      })
      .finally(() => setLoading(false));
  }, [authLoading, session?.access_token]);

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    if (!loginEmail.trim()) {
      setError("Oppgi e-postadressen du brukte i forespørselen.");
      return;
    }

    setSendingCode(true);
    const { error: loginError } = await supabase.auth.signInWithOtp({
      email: loginEmail.trim(),
      options: {
        shouldCreateUser: true,
      },
    });
    setSendingCode(false);

    if (loginError) {
      setError("Innloggingskoden kunne ikke sendes. Prøv igjen.");
      return;
    }
    setCodeSent(true);
    setSuccess(
      `En sekssifret kode er sendt til ${loginEmail.trim()} fra Vatsii Designe.`,
    );
  };

  const handleVerifyCode = async () => {
    setError("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Skriv inn den sekssifrede koden fra e-posten.");
      return;
    }

    setVerifyingCode(true);
    const { error: verificationError } = await supabase.auth.verifyOtp({
      email: loginEmail.trim(),
      token: verificationCode,
      type: "email",
    });
    setVerifyingCode(false);
    if (verificationError) {
      setError("Koden er feil eller har utløpt. Be om en ny kode.");
      return;
    }

    window.location.reload();
  };

  const handleSave = async (orderId: string) => {
    setError("");
    setSuccess("");
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    const draft = drafts[orderId] ?? "";
    const names =
      order.inputMode === "name_list"
        ? draft
            .split("\n")
            .map((name) => name.trim())
            .filter(Boolean)
        : draft.trim()
          ? [draft.trim()]
          : [];
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
      const result = await readJsonResponse<{
        error?: string;
        quantity?: number;
      }>(response, "Kunne ikke lagre endringen.");
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
      setSuccess(`Forespørsel #${orderId} er oppdatert.`);
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSetPassword = async () => {
    setError("");
    setSuccess("");
    if (password.length < 8) {
      setError("Passordet må ha minst 8 tegn.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passordene er ikke like.");
      return;
    }

    setSettingPassword(true);
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
      data: {
        ...user?.user_metadata,
        password_configured: true,
      },
    });
    setSettingPassword(false);
    if (passwordError) {
      setError("Passordet kunne ikke lagres. Prøv igjen.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccess(
      "Passordet er lagret. Du kan bruke det neste gang du logger inn.",
    );
  };

  const handleApproveOffer = async (orderId: string) => {
    setError("");
    setSuccess("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Du må logge inn på nytt.");
      return;
    }

    setApprovingId(orderId);
    try {
      const response = await fetch("/api/place-card-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, action: "approve-offer" }),
      });
      const result = await readJsonResponse<{ error?: string }>(
        response,
        "Tilbudet kunne ikke godkjennes.",
      );
      if (!response.ok) {
        setError(result.error ?? "Tilbudet kunne ikke godkjennes.");
        return;
      }
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: "approved" } : order,
        ),
      );
      setSuccess(`Tilbudet for forespørsel #${orderId} er godkjent.`);
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    setError("");
    setSuccess("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setCancelOrderId(null);
      setError("Du må logge inn på nytt.");
      return;
    }

    setCancellingId(cancelOrderId);
    try {
      const response = await fetch("/api/place-card-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: cancelOrderId, action: "cancel" }),
      });
      const result = await readJsonResponse<{ error?: string }>(
        response,
        "Ordren kunne ikke kanselleres.",
      );
      if (!response.ok) {
        setError(result.error ?? "Ordren kunne ikke kanselleres.");
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === cancelOrderId
            ? { ...order, status: "cancelled" }
            : order,
        ),
      );
      setSuccess(`Forespørsel #${cancelOrderId} er kansellert.`);
      setCancelOrderId(null);
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <PageShell
      eyebrow="DIN KONTO"
      title="Mine forespørsler"
      subtitle="Se forespørslene dine, oppdater innholdet før du får svar, og finn prisestimat og leveringstid."
      maxWidth="md"
    >
      {authLoading || loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress aria-label="Henter forespørsler" />
        </Box>
      ) : !user && !useMockData ? (
        <Card
          sx={{
            maxWidth: 560,
            mx: "auto",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
            <Stack spacing={3} alignItems="center">
              <Typography variant="h5" fontWeight={700}>
                Se forespørslene dine
              </Typography>
              <Typography color="text.secondary">
                Oppgi e-postadressen du brukte. Vi sender en sekssifret
                innloggingskode fra Vatsii Designe.
              </Typography>
              <TextField
                label="E-postadresse"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                fullWidth
                required
                disabled={codeSent}
              />
              {codeSent && (
                <TextField
                  label="Sekssifret kode"
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  autoComplete="one-time-code"
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      maxLength: 6,
                    },
                  }}
                />
              )}
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
              <Button
                variant="contained"
                size="large"
                startIcon={<EmailIcon />}
                onClick={codeSent ? handleVerifyCode : handleLogin}
                disabled={
                  sendingCode ||
                  verifyingCode ||
                  !loginEmail.trim() ||
                  (codeSent && verificationCode.length !== 6)
                }
                fullWidth
              >
                {sendingCode
                  ? "Sender kode..."
                  : verifyingCode
                    ? "Kontrollerer..."
                    : codeSent
                      ? "Logg inn med kode"
                      : "Send innloggingskode"}
              </Button>
              {codeSent && (
                <Button
                  variant="text"
                  onClick={handleLogin}
                  disabled={sendingCode || verifyingCode}
                >
                  Send ny kode
                </Button>
              )}
              <Divider flexItem>eller</Divider>
              <Button variant="outlined" href="/login" fullWidth>
                Logg inn med e-post og passord
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          {user &&
            user.app_metadata.provider === "email" &&
            !user.user_metadata.password_configured && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
                  gap: 3,
                  p: { xs: 2.5, md: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <LockOutlinedIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Enklere innlogging
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" mt={1}>
                    Opprett et passord for å få enklere tilgang til
                    forespørslene dine uten nye e-postkoder.
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <TextField
                    label="Nytt passord"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    helperText="Minst 8 tegn"
                  />
                  <TextField
                    label="Gjenta passord"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <Button
                    variant="contained"
                    startIcon={<LockOutlinedIcon />}
                    onClick={handleSetPassword}
                    disabled={settingPassword || !password || !confirmPassword}
                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  >
                    {settingPassword ? "Lagrer..." : "Opprett passord"}
                  </Button>
                </Stack>
              </Box>
            )}
          {error ? null : orders.length === 0 ? (
            <Alert
              severity="info"
              action={
                <Button color="inherit" href="/products">
                  Se produkter
                </Button>
              }
            >
              Du har ingen forespørsler ennå.
            </Alert>
          ) : (
            orders.map((order) => {
              const editable =
                order.status === "new" && order.inputMode !== "custom_order";
              const delivered = order.status === "completed";
              const cancelled = order.status === "cancelled";
              const cancellable = ["new", "estimated", "confirmed"].includes(
                order.status,
              );
              const currentStep = getFlowStep(order.status);
              const draft = drafts[order.id] ?? "";
              const draftValues =
                order.inputMode === "name_list"
                  ? draft
                      .split("\n")
                      .map((name) => name.trim())
                      .filter(Boolean)
                  : draft.trim()
                    ? [draft.trim()]
                    : [];

              return (
                <Card
                  key={order.id}
                  component={delivered ? "details" : "div"}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    "&[open] .delivered-expand-icon": {
                      transform: "rotate(180deg)",
                    },
                  }}
                >
                  {delivered && (
                    <Box
                      component="summary"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        p: { xs: 2, sm: 2.5 },
                        cursor: "pointer",
                        listStyle: "none",
                        "&::-webkit-details-marker": { display: "none" },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>
                          {order.productName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Forespørsel #{order.id} · Levert
                        </Typography>
                      </Box>
                      <ExpandMoreIcon
                        className="delivered-expand-icon"
                        color="primary"
                        sx={{
                          flexShrink: 0,
                          transition: "transform 160ms ease",
                        }}
                      />
                    </Box>
                  )}
                  <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 4 } }}>
                    <Stack spacing={{ xs: 3, sm: 4 }}>
                      {!delivered && (
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
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              Forespørsel #{order.id} ·{" "}
                              {new Intl.DateTimeFormat("nb-NO", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(order.createdAt))}
                            </Typography>
                          </Box>
                          <Typography color="primary.light" fontWeight={700}>
                            {statusLabels[order.status] ?? order.status}
                          </Typography>
                        </Stack>
                      )}

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          gap: 1,
                        }}
                      >
                        {flowSteps.map((step, index) => (
                          <Box key={step}>
                            <Box
                              sx={{
                                height: 3,
                                mb: { xs: 0, sm: 1 },
                                bgcolor:
                                  index <= currentStep
                                    ? "primary.light"
                                    : "divider",
                              }}
                            />
                            <Typography
                              variant="caption"
                              color={
                                index <= currentStep
                                  ? "text.primary"
                                  : "text.secondary"
                              }
                              fontWeight={index === currentStep ? 700 : 400}
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              {step}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: { xs: "block", sm: "none" }, mt: -2 }}
                      >
                        Steg {currentStep + 1} av {flowSteps.length} ·{" "}
                        <Box
                          component="span"
                          color="text.primary"
                          fontWeight={700}
                        >
                          {flowSteps[currentStep]}
                        </Box>
                      </Typography>

                      <Stack spacing={2.5}>
                        <Box
                          sx={{
                            width: { xs: "100%", md: "76%" },
                            boxSizing: "border-box",
                            p: { xs: 2, md: 2.5 },
                            border: "1px solid",
                            borderColor: "primary.dark",
                            borderRadius: 1,
                            bgcolor: "rgba(90,57,36,0.22)",
                          }}
                        >
                          <Typography variant="overline" color="primary.light">
                            Du · forespørsel
                          </Typography>
                          <Typography fontWeight={700} mb={2}>
                            {["name_list", "custom_order"].includes(
                              order.inputMode,
                            )
                              ? `${order.quantity} stk. · `
                              : ""}
                            {order.productName}
                          </Typography>
                          {order.inputMode === "custom_order" ? (
                            <Stack spacing={2}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Hva ønsker du laget?
                                </Typography>
                                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                                  {order.names.join("\n")}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Mål eller ønsket størrelse
                                </Typography>
                                <Typography fontWeight={700}>
                                  {order.customDimensions}
                                </Typography>
                              </Box>
                              <Typography variant="body2">
                                Antall: <strong>{order.quantity}</strong>
                              </Typography>
                              <Typography variant="body2">
                                Budsjett:{" "}
                                <strong>
                                  {order.customBudget === null ||
                                  order.customBudget === undefined
                                    ? "Ikke oppgitt"
                                    : `${new Intl.NumberFormat("nb-NO").format(order.customBudget)} kr`}
                                </strong>
                              </Typography>
                              <Typography variant="body2">
                                Ønsket leveringsdato:{" "}
                                <strong>
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
                                </strong>
                              </Typography>
                              {(order.attachments ?? []).length > 0 && (
                                <Stack
                                  direction="row"
                                  gap={1.5}
                                  flexWrap="wrap"
                                >
                                  {(order.attachments ?? []).map(
                                    (attachment) =>
                                      attachment.contentType.startsWith(
                                        "image/",
                                      ) ? (
                                        <Box
                                          key={attachment.id}
                                          component="a"
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Box
                                            component="img"
                                            src={attachment.url}
                                            alt={attachment.fileName}
                                            sx={{
                                              width: 120,
                                              height: 90,
                                              objectFit: "cover",
                                              borderRadius: 1,
                                            }}
                                          />
                                        </Box>
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
                              )}
                            </Stack>
                          ) : editable ? (
                            <>
                              <TextField
                                label={
                                  order.inputMode === "name_list"
                                    ? "Ett navn per linje"
                                    : order.inputMode === "single_name"
                                      ? "Navn"
                                      : "Kommentar"
                                }
                                value={drafts[order.id] ?? ""}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                multiline={order.inputMode !== "single_name"}
                                minRows={
                                  order.inputMode === "single_name" ? 1 : 5
                                }
                                fullWidth
                                helperText={
                                  order.inputMode === "name_list"
                                    ? `${draftValues.length} navn · kan endres frem til tilbudet sendes`
                                    : "Kan endres frem til tilbudet sendes"
                                }
                                slotProps={{
                                  htmlInput: {
                                    maxLength:
                                      order.inputMode === "name_list"
                                        ? 20200
                                        : order.inputMode === "single_name"
                                          ? 100
                                          : 2000,
                                  },
                                }}
                              />
                              <Button
                                variant="outlined"
                                startIcon={<SaveIcon />}
                                disabled={
                                  savingId === order.id ||
                                  draftValues.length === 0
                                }
                                onClick={() => handleSave(order.id)}
                                sx={{
                                  mt: 2,
                                  width: { xs: "100%", sm: "auto" },
                                  textTransform: "none",
                                }}
                              >
                                {savingId === order.id
                                  ? "Lagrer..."
                                  : "Lagre navneliste"}
                              </Button>
                            </>
                          ) : order.inputMode === "name_list" ? (
                            <Box
                              component="details"
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                px: 2,
                                py: 1.5,
                                "& summary": {
                                  cursor: "pointer",
                                  fontWeight: 700,
                                },
                              }}
                            >
                              <Box component="summary">
                                Vis navneliste ({order.quantity})
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1.5, whiteSpace: "pre-line" }}
                              >
                                {order.names.join("\n")}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              color="text.secondary"
                              sx={{ whiteSpace: "pre-wrap" }}
                            >
                              {order.names.join("\n")}
                            </Typography>
                          )}
                        </Box>

                        <Box
                          sx={{
                            width: { xs: "100%", md: "70%" },
                            boxSizing: "border-box",
                            alignSelf: "flex-end",
                            p: { xs: 2, md: 2.5 },
                            border: "1px solid",
                            borderColor: "secondary.main",
                            borderRadius: 1,
                            bgcolor: "rgba(50,79,58,0.24)",
                          }}
                        >
                          <Typography variant="overline" color="text.secondary">
                            Vatsii Designe
                          </Typography>
                          {cancelled ? (
                            <Stack spacing={1} mt={0.5}>
                              <Typography color="text.secondary">
                                Forespørselen er kansellert og blir ikke
                                behandlet videre.
                              </Typography>
                              {order.cancellationReason && (
                                <Alert severity="warning">
                                  <Typography fontWeight={700}>
                                    Begrunnelse fra Vatsii Designe
                                  </Typography>
                                  {order.cancellationReason}
                                </Alert>
                              )}
                            </Stack>
                          ) : order.estimatedPrice && order.deliveryEstimate ? (
                            <>
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "1fr 1fr",
                                  },
                                  gap: 2,
                                  my: 1.5,
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Pris
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    fontWeight={800}
                                    color="primary.light"
                                  >
                                    {new Intl.NumberFormat("nb-NO").format(
                                      order.estimatedPrice,
                                    )}{" "}
                                    kr
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Leveringstid
                                  </Typography>
                                  <Typography variant="h6" fontWeight={700}>
                                    {order.deliveryEstimate}
                                  </Typography>
                                </Box>
                              </Box>
                              <Divider sx={{ my: 2 }} />
                              {order.status === "estimated" ? (
                                <Stack spacing={1.5} alignItems="flex-start">
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Når du godkjenner tilbudet, blir
                                    forespørselen til en ordre.
                                  </Typography>
                                  <Button
                                    variant="contained"
                                    startIcon={<TaskAltIcon />}
                                    onClick={() => handleApproveOffer(order.id)}
                                    disabled={approvingId === order.id}
                                    sx={{
                                      width: { xs: "100%", sm: "auto" },
                                      textTransform: "none",
                                    }}
                                  >
                                    {approvingId === order.id
                                      ? "Godkjenner..."
                                      : "Godkjenn tilbud"}
                                  </Button>
                                </Stack>
                              ) : (
                                <Typography color="text.secondary">
                                  {order.status === "completed"
                                    ? "Ordren er levert. Takk for oppdraget."
                                    : "Tilbudet er godkjent og ordren er under behandling."}
                                </Typography>
                              )}
                            </>
                          ) : (
                            <Typography color="text.secondary" mt={0.5}>
                              Vi går gjennom forespørselen og kommer tilbake med
                              pris og leveringstid.
                            </Typography>
                          )}
                        </Box>

                        <Divider />

                        <OrderMessages
                          orderId={order.id}
                          currentRole="customer"
                          messages={order.messages}
                          endpoint={`/api/place-card-orders/${order.id}/messages`}
                          onMessageSent={(message) =>
                            setOrders((current) =>
                              current.map((currentOrder) =>
                                currentOrder.id === order.id
                                  ? {
                                      ...currentOrder,
                                      messages: [
                                        ...currentOrder.messages,
                                        message,
                                      ],
                                    }
                                  : currentOrder,
                              ),
                            )
                          }
                        />

                        {cancellable && (
                          <>
                            <Divider />
                            <Button
                              color="error"
                              variant="outlined"
                              startIcon={<CancelOutlinedIcon />}
                              onClick={() => setCancelOrderId(order.id)}
                              disabled={cancellingId === order.id}
                              sx={{
                                alignSelf: { xs: "stretch", sm: "flex-start" },
                                textTransform: "none",
                              }}
                            >
                              Kanseller forespørsel
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      )}
      <Dialog
        open={Boolean(cancelOrderId)}
        onClose={() => {
          if (!cancellingId) setCancelOrderId(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Kanseller forespørselen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Forespørselen avsluttes og blir ikke behandlet videre. Dette kan
            ikke angres.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            color="inherit"
            onClick={() => setCancelOrderId(null)}
            disabled={Boolean(cancellingId)}
          >
            Behold
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelOrder}
            disabled={Boolean(cancellingId)}
          >
            {cancellingId ? "Kansellerer..." : "Ja, kanseller"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
