"use client";

import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface ProductInquiryFormProps {
  productId: string;
  productName: string;
  inputMode: string;
}

const fieldConfig = {
  name_list: {
    heading: "Legg inn navn",
    label: "Ett navn per linje",
    helper: "navn",
    maxLength: 20200,
    minRows: 6,
  },
  single_name: {
    heading: "Legg inn navn",
    label: "Navn",
    helper: "Maks 100 tegn",
    maxLength: 100,
    minRows: 1,
  },
  comment: {
    heading: "Hva ønsker du?",
    label: "Kommentar",
    helper: "Beskriv ønskene dine, maks 2000 tegn",
    maxLength: 2000,
    minRows: 5,
  },
} as const;

export default function ProductInquiryForm({
  productId,
  productName,
  inputMode,
}: ProductInquiryFormProps) {
  const mode = inputMode in fieldConfig ? inputMode : "comment";
  const config = fieldConfig[mode as keyof typeof fieldConfig];
  const [user, setUser] = useState<User | null>(null);
  const [input, setInput] = useState("");
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

  const values =
    mode === "name_list"
      ? input
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
      : input.trim()
        ? [input.trim()]
        : [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (values.length === 0 || !customerName.trim() || !customerEmail.trim()) {
      setError("Fyll ut forespørselen, navn og e-postadresse.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
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
          names: values,
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
        setError(result.error ?? "Forespørselen kunne ikke sendes.");
        return;
      }

      if (result.requiresEmailVerification) {
        const { error: verificationError } = await supabase.auth.signInWithOtp({
          email: customerEmail.trim(),
          options: {
            data: { full_name: customerName.trim() },
            shouldCreateUser: true,
          },
        });
        if (verificationError) {
          setError(
            "Forespørselen er mottatt, men bekreftelseskoden kunne ikke sendes.",
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
        setSuccess(`Forespørsel #${result.orderId} er mottatt.`);
      }
      setInput("");
    } catch {
      setError("Kunne ikke kontakte serveren. Prøv igjen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack component="form" spacing={2.5} mt={4} onSubmit={handleSubmit}>
      <Typography variant="h5" fontWeight={700}>
        Send forespørsel på {productName}
      </Typography>
      <TextField
        label={config.label}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        multiline={config.minRows > 1}
        minRows={config.minRows}
        required
        helperText={
          mode === "name_list"
            ? `${values.length} ${config.helper}`
            : config.helper
        }
        slotProps={{ htmlInput: { maxLength: config.maxLength } }}
      />
      <TextField
        label="Ditt navn"
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
        disabled={submitting || values.length === 0}
        sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
      >
        {submitting ? "Sender..." : "Send uforpliktende forespørsel"}
      </Button>
    </Stack>
  );
}
