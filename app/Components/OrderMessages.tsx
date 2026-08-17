"use client";

import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface OrderMessage {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

interface OrderMessagesProps {
  orderId: string;
  currentRole: "admin" | "customer";
  messages: OrderMessage[];
  endpoint: string;
  onMessageSent: (message: OrderMessage) => void;
}

export default function OrderMessages({
  orderId,
  currentRole,
  messages,
  endpoint,
  onMessageSent,
}: OrderMessagesProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || body.length > 2000) return;

    setSending(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Du må logge inn på nytt.");
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: OrderMessage;
      };
      if (!response.ok || !result.message) {
        setError(result.error ?? "Meldingen kunne ikke sendes.");
        return;
      }

      onMessageSent(result.message);
      setDraft("");
    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Meldinger
        </Typography>
        <Typography color="text.secondary">
          Samtale om forespørsel #{orderId}
        </Typography>
      </Box>

      {messages.length === 0 ? (
        <Typography color="text.secondary">
          Ingen meldinger ennå. Start samtalen under.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {messages.map((message) => {
            const ownMessage = message.senderRole === currentRole;
            return (
              <Box
                key={message.id}
                sx={{
                  width: { xs: "100%", sm: "78%" },
                  alignSelf: ownMessage ? "flex-end" : "flex-start",
                  p: 2,
                  border: "1px solid",
                  borderColor: ownMessage ? "secondary.main" : "divider",
                  borderRadius: 1,
                  bgcolor: ownMessage
                    ? "rgba(50,79,58,0.24)"
                    : "background.paper",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {message.senderRole === "admin" ? "Vatsii Designe" : "Kunde"}
                </Typography>
                <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                  {message.body}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mt={1}
                >
                  {new Intl.DateTimeFormat("nb-NO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(message.createdAt))}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}

      <TextField
        label="Skriv en melding"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        multiline
        minRows={3}
        fullWidth
        helperText={`${draft.length}/2000 tegn`}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        variant="contained"
        startIcon={<SendIcon />}
        onClick={handleSend}
        disabled={sending || !draft.trim()}
        sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
      >
        {sending ? "Sender..." : "Send melding"}
      </Button>
    </Stack>
  );
}
