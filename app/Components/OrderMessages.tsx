"use client";

import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  IconButton,
  Stack,
  TextField,
  Tooltip,
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
    <Stack
      spacing={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Samtale
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Forespørsel #{orderId}
        </Typography>
      </Box>

      <Box
        role="log"
        aria-label={`Meldinger om forespørsel ${orderId}`}
        aria-live="polite"
        sx={{
          minHeight: messages.length === 0 ? 120 : 180,
          maxHeight: 480,
          overflowY: "auto",
          p: { xs: 2, sm: 2.5 },
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              minHeight: 70,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Ingen meldinger ennå.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {messages.map((message) => {
              const ownMessage = message.senderRole === currentRole;
              const sender = ownMessage
                ? "Du"
                : message.senderRole === "admin"
                  ? "Vatsii Designe"
                  : "Kunde";
              return (
                <Stack
                  key={message.id}
                  spacing={0.5}
                  alignItems={ownMessage ? "flex-end" : "flex-start"}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ px: 0.75 }}
                  >
                    {sender}
                  </Typography>
                  <Box
                    sx={{
                      maxWidth: { xs: "88%", sm: "72%" },
                      px: 1.75,
                      py: 1.25,
                      border: "1px solid",
                      borderColor: ownMessage ? "secondary.main" : "divider",
                      borderRadius: ownMessage
                        ? "8px 8px 2px 8px"
                        : "8px 8px 8px 2px",
                      bgcolor: ownMessage
                        ? "rgba(63,107,74,0.34)"
                        : "background.paper",
                    }}
                  >
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      {message.body}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      textAlign="right"
                      mt={0.75}
                    >
                      {new Intl.DateTimeFormat("nb-NO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(message.createdAt))}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
          {error}
        </Alert>
      )}
      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-end"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <TextField
          placeholder="Skriv en melding ..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void handleSend();
            }
          }}
          multiline
          minRows={1}
          maxRows={5}
          fullWidth
          slotProps={{
            htmlInput: {
              "aria-label": "Skriv en melding",
              maxLength: 2000,
            },
          }}
        />
        <Tooltip title="Send melding">
          <span>
            <IconButton
              color="primary"
              aria-label="Send melding"
              onClick={() => void handleSend()}
              disabled={sending || !draft.trim()}
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
                color: "text.primary",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": { bgcolor: "divider" },
              }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
