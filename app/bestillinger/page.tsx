"use client";

import EmailIcon from "@mui/icons-material/Email";
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
  Divider,
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
  estimatedPrice: number | null;
  deliveryEstimate: string | null;
  confirmedAt: string | null;
  createdAt: string;
  productName: string;
}

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

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<PlaceCardOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = async (token: string) => {
    const response = await fetch("/api/place-card-orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error ?? "Kunne ikke hente forespørslene.");
    }

    const data = (await response.json()) as PlaceCardOrder[];
    setOrders(data);
    setDrafts(
      Object.fromEntries(
        data.map((order) => [order.id, order.names.join("\n")]),
      ),
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
              : "Kunne ikke hente forespørslene.",
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
    setError("");
    setSuccess("");
    if (!loginEmail.trim()) {
      setError("Oppgi e-postadressen du brukte i forespørselen.");
      return;
    }

    setSendingLink(true);
    const { error: loginError } = await supabase.auth.signInWithOtp({
      email: loginEmail.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/bestillinger`,
        shouldCreateUser: true,
      },
    });
    setSendingLink(false);

    if (loginError) {
      setError("Innloggingslenken kunne ikke sendes. Prøv igjen.");
      return;
    }
    setSuccess(
      `Vi har sendt en sikker innloggingslenke til ${loginEmail.trim()}.`,
    );
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
    const { data, error: passwordError } = await supabase.auth.updateUser({
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

    setUser(data.user);
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
      const result = (await response.json()) as { error?: string };
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

  return (
    <PageShell
      eyebrow="DIN KONTO"
      title="Mine forespørsler"
      subtitle="Se forespørslene dine, oppdater navnelisten før du får svar, og finn prisestimat og leveringstid."
      maxWidth="md"
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress aria-label="Henter forespørsler" />
        </Box>
      ) : !user ? (
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
                Oppgi e-postadressen du brukte. Du får en sikker engangslenke og
                trenger ikke passord.
              </Typography>
              <Button
                variant="outlined"
                href="/login"
                fullWidth
                sx={{ textTransform: "none" }}
              >
                Logg inn med passord
              </Button>
              <Typography variant="body2" color="text.secondary">
                Eller få en ny engangslenke på e-post:
              </Typography>
              <TextField
                label="E-postadresse"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                fullWidth
                required
              />
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
              <Button
                variant="contained"
                size="large"
                startIcon={<EmailIcon />}
                onClick={handleLogin}
                disabled={sendingLink || !loginEmail.trim()}
                sx={{ textTransform: "none", px: 4 }}
              >
                {sendingLink ? "Sender lenke..." : "Send innloggingslenke"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          {user.app_metadata.provider === "email" &&
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
                    forespørslene dine uten nye e-postlenker.
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
          {orders.length === 0 ? (
            <Alert
              severity="info"
              action={
                <Button color="inherit" href="/products/bordkort">
                  Send forespørsel
                </Button>
              }
            >
              Du har ingen forespørsler ennå.
            </Alert>
          ) : (
            orders.map((order) => {
              const editable = order.status === "new";
              const currentStep = getFlowStep(order.status);
              const draftNames = (drafts[order.id] ?? "")
                .split("\n")
                .map((name) => name.trim())
                .filter(Boolean);

              return (
                <Card
                  key={order.id}
                  sx={{ border: "1px solid", borderColor: "divider" }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                    <Stack spacing={4}>
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
                                mb: 1,
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
                            >
                              {step}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      <Stack spacing={2.5}>
                        <Box
                          sx={{
                            width: { xs: "100%", md: "76%" },
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
                            {order.quantity} bordkort · {order.productName}
                          </Typography>
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
                                ? `${draftNames.length} bordkort · kan endres frem til tilbudet sendes`
                                : `${order.quantity} bordkort · navnelisten er låst`
                            }
                          />
                          {editable && (
                            <Button
                              variant="outlined"
                              startIcon={<SaveIcon />}
                              disabled={
                                savingId === order.id || draftNames.length === 0
                              }
                              onClick={() => handleSave(order.id)}
                              sx={{ mt: 2, textTransform: "none" }}
                            >
                              {savingId === order.id
                                ? "Lagrer..."
                                : "Lagre navneliste"}
                            </Button>
                          )}
                        </Box>

                        <Box
                          sx={{
                            width: { xs: "100%", md: "70%" },
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
                          {order.estimatedPrice && order.deliveryEstimate ? (
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
                                    sx={{ textTransform: "none" }}
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
                      </Stack>
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
