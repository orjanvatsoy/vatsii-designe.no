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
import { alpha } from "@mui/material/styles";
import { MAX_ORDER_MESSAGE_LENGTH } from "../lib/order-message-limits";
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
  showHeader?: boolean;
}

export default function OrderMessages({
  orderId,
  currentRole,
  messages,
  endpoint,
  onMessageSent,
  showHeader = true,
}: OrderMessagesProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || body.length > MAX_ORDER_MESSAGE_LENGTH) return;

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
        typography: "body2",
      }}
    >
      {showHeader && (
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
      )}

      <Box
        role="log"
        aria-label={`Meldinger om forespørsel ${orderId}`}
        aria-live="polite"
        sx={{
          minHeight: messages.length === 0 ? 120 : 180,
          maxHeight: 480,
          overflowY: "auto",
          overflowX: "hidden",
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
          <Stack spacing={2.5}>
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
                  spacing={0.75}
                  alignItems={ownMessage ? "flex-end" : "flex-start"}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ px: 0.5 }}
                  >
                    {sender}
                  </Typography>
                  <Box
                    sx={(theme) => ({
                      minWidth: 0,
                      maxWidth: { xs: "92%", sm: "76%" },
                      boxSizing: "border-box",
                      px: 2,
                      py: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: ownMessage
                        ? "8px 8px 2px 8px"
                        : "8px 8px 8px 2px",
                      bgcolor: alpha(
                        message.senderRole === "customer"
                          ? theme.palette.primary.dark
                          : theme.palette.secondary.dark,
                        0.3,
                      ),
                    })}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        lineHeight: 1.7,
                      }}
                    >
                      {message.body}
                    </Typography>
                  </Box>
                  <Typography
                    component="time"
                    dateTime={message.createdAt}
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 0.5, fontSize: "0.75rem" }}
                  >
                    {new Intl.DateTimeFormat("nb-NO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(message.createdAt))}
                  </Typography>
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
          size="small"
          minRows={1}
          maxRows={5}
          fullWidth
          slotProps={{
            htmlInput: {
              "aria-label": "Skriv en melding",
              maxLength: MAX_ORDER_MESSAGE_LENGTH,
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
                height: 44,
                borderRadius: 1,
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
