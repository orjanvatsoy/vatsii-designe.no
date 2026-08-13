"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { Great_Vibes } from "next/font/google";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const previewFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

interface PlaceCardVariant {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export default function PlaceCardOrderForm({
  variants,
}: {
  variants: PlaceCardVariant[];
}) {
  const [user, setUser] = useState<User | null>(null);
  const [productId, setProductId] = useState(variants[0]?.id ?? "");
  const [namesInput, setNamesInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setCustomerEmail(currentUser.email ?? "");
        setCustomerName(
          currentUser.user_metadata.full_name ??
            currentUser.user_metadata.name ??
            "",
        );
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const names = namesInput
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
  const selectedVariant = variants.find((variant) => variant.id === productId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!productId || names.length === 0) {
      setError("Velg et bordkort og legg inn minst ett navn.");
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Oppgi navn og e-postadresse.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/place-card-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          names,
          customerName,
          customerEmail,
          website,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        orderId?: string;
        requiresEmailVerification?: boolean;
      };
      if (!response.ok) {
        setError(
          result.error ?? "Forespørselen på bordkort kunne ikke sendes.",
        );
        return;
      }

      if (result.requiresEmailVerification) {
        const { error: verificationLinkError } =
          await supabase.auth.signInWithOtp({
            email: customerEmail.trim(),
            options: {
              data: { full_name: customerName.trim() },
              shouldCreateUser: true,
            },
          });
        if (verificationLinkError) {
          setError(
            "Forespørselen er mottatt, men bekreftelseskoden kunne ikke sendes. Prøv «Mine forespørsler» senere.",
          );
        } else {
          sessionStorage.setItem(
            "pendingVerificationEmail",
            customerEmail.trim(),
          );
          window.location.href = "/bekreft-epost";
          return;
        }
      } else {
        setSuccess(`Forespørsel på bordkort #${result.orderId} er mottatt.`);
      }
      setNamesInput("");
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={{ xs: 3.5, sm: 5 }}>
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            fontSize={{ xs: "1.25rem", sm: "1.5rem" }}
            mb={2}
          >
            1. Velg bordkort
          </Typography>
          <FormControl fullWidth>
            <RadioGroup
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <Grid container spacing={3}>
                {variants.map((variant) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={variant.id}>
                    <Card
                      sx={{
                        height: "100%",
                        overflow: "hidden",
                        border: "2px solid",
                        borderColor:
                          productId === variant.id ? "primary.main" : "divider",
                      }}
                    >
                      {variant.imageUrl && (
                        <Box
                          sx={{
                            position: "relative",
                            height: { xs: 170, sm: 210 },
                            bgcolor: "#16150F",
                          }}
                        >
                          <Image
                            src={variant.imageUrl}
                            alt={variant.name}
                            fill
                            sizes="(max-width: 600px) 100vw, 33vw"
                            style={{ objectFit: "cover" }}
                          />
                        </Box>
                      )}
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <FormControlLabel
                          value={variant.id}
                          control={<Radio />}
                          label={variant.name}
                          sx={{ m: 0, fontWeight: 700 }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mt={1}
                        >
                          {variant.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ maxWidth: 720 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            fontSize={{ xs: "1.25rem", sm: "1.5rem" }}
            mb={2}
          >
            2. Legg inn navn
          </Typography>
          <TextField
            label="Ett navn per linje"
            value={namesInput}
            onChange={(event) => setNamesInput(event.target.value)}
            multiline
            minRows={8}
            fullWidth
            required
            slotProps={{ htmlInput: { maxLength: 20200 } }}
            helperText={`${names.length} bordkort`}
          />

          {names.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Forhåndsvisning
              </Typography>
              <Grid container spacing={2}>
                {names.slice(0, 8).map((name, index) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={`${name}-${index}`}>
                    <Box
                      sx={{
                        position: "relative",
                        minHeight: 150,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        px: 3,
                        py: 2.5,
                        overflow: "hidden",
                        bgcolor: "background.paper",
                        color: "primary.light",
                        border: "1px solid",
                        borderColor: "primary.main",
                        borderRadius: 1,
                        boxShadow:
                          "inset 0 0 0 1px rgba(217,160,102,0.08), 0 14px 30px -20px rgba(0,0,0,0.9)",
                        backgroundImage:
                          "linear-gradient(135deg, rgba(139,94,60,0.32), rgba(42,42,38,0) 48%), linear-gradient(315deg, rgba(63,107,74,0.22), rgba(42,42,38,0) 52%)",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: "18%",
                          right: "18%",
                          height: 2,
                          bgcolor: "primary.light",
                          opacity: 0.75,
                        },
                      }}
                    >
                      <Typography
                        className={previewFont.className}
                        component="span"
                        sx={{
                          maxWidth: "100%",
                          fontSize: { xs: "2.35rem", sm: "3.15rem" },
                          fontWeight: 400,
                          lineHeight: 1.05,
                          textAlign: "center",
                          overflowWrap: "anywhere",
                          textShadow: "0 3px 18px rgba(217,160,102,0.2)",
                        }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          mt: 1.5,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "text.secondary",
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedVariant?.name ?? "Bordkort"}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {names.length > 8 && (
                <Typography variant="body2" color="text.secondary" mt={1.5}>
                  + {names.length - 8} flere navn
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ maxWidth: 720 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            fontSize={{ xs: "1.25rem", sm: "1.5rem" }}
            mb={2}
          >
            3. Kontaktinformasjon
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Navn"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              required
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
            <TextField
              label="E-postadresse"
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              required
              disabled={Boolean(user)}
              helperText={
                user
                  ? "Forespørselen knyttes til kontoen du er logget inn med."
                  : "Vi sender en sekssifret kode fra Vatsii Designe, slik at du kan bekrefte adressen og se forespørselen."
              }
              slotProps={{ htmlInput: { maxLength: 254 } }}
            />
            <TextField
              label="Nettside"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              autoComplete="off"
              tabIndex={-1}
              sx={{ display: "none" }}
              aria-hidden
            />
          </Stack>
        </Box>

        <Stack spacing={2} sx={{ maxWidth: 720 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert
              severity="success"
              action={
                user ? (
                  <Button color="inherit" href="/bestillinger">
                    Se forespørselen
                  </Button>
                ) : undefined
              }
            >
              {success}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || names.length === 0}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-start" },
              textTransform: "none",
              px: { xs: 2, sm: 4 },
              whiteSpace: "normal",
            }}
          >
            {submitting
              ? "Sender forespørsel..."
              : `Send uforpliktende forespørsel på ${names.length || ""} bordkort`}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
