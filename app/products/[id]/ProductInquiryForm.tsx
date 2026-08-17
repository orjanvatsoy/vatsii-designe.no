"use client";

import UploadFileIcon from "@mui/icons-material/UploadFile";
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
  custom_order: {
    heading: "Spesialbestilling",
    label: "Hva ønsker du laget?",
    helper: "Beskriv idéen, bruksområdet og andre viktige detaljer",
    maxLength: 3000,
    minRows: 6,
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
  const [dimensions, setDimensions] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [attachments, setAttachments] = useState<File[]>([]);
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
      let response: Response;
      if (mode === "custom_order") {
        if (!dimensions.trim() || !quantity || Number(quantity) < 1) {
          setError("Oppgi mål eller størrelse og et gyldig antall.");
          return;
        }
        const formData = new FormData();
        formData.append("productId", productId);
        formData.append("description", input.trim());
        formData.append("dimensions", dimensions.trim());
        formData.append("quantity", quantity);
        formData.append("customerName", customerName.trim());
        formData.append("customerEmail", customerEmail.trim());
        formData.append("website", website);
        attachments.forEach((file) => formData.append("attachments", file));
        response = await fetch("/api/custom-orders", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
      } else {
        response = await fetch("/api/place-card-orders", {
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
      }
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
      setDimensions("");
      setQuantity("1");
      setAttachments([]);
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
      {mode === "custom_order" && (
        <>
          <TextField
            label="Mål eller ønsket størrelse"
            value={dimensions}
            onChange={(event) => setDimensions(event.target.value)}
            required
            helperText="For eksempel 120 × 40 × 3 cm"
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />
          <TextField
            label="Antall"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
            slotProps={{ htmlInput: { min: 1, max: 10000, step: 1 } }}
          />
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          >
            Legg ved bilder eller skisse
            <input
              hidden
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []).slice(0, 5);
                setAttachments(files);
                event.target.value = "";
              }}
            />
          </Button>
          <Typography variant="caption" color="text.secondary">
            {attachments.length > 0
              ? attachments.map((file) => file.name).join(", ")
              : "Valgfritt · inntil 5 bilder eller PDF-er, maks 5 MB per fil"}
          </Typography>
        </>
      )}
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
