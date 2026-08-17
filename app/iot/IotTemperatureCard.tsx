"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import PageShell from "../Components/PageShell";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { RequireRole, useAuth } from "../Components/AuthProvider";

interface IotTemperatureChartProps {
  data: TemperatureData[];
}

interface TemperatureData {
  created_at: string;
  temperature: number;
  temperature_forcast?: number | null;
}

const IotTemperatureChart = dynamic<IotTemperatureChartProps>(
  () => import("./IotTemperatureChart"),
  { ssr: false },
);

export default function IotTemperatureCard() {
  const { role, session } = useAuth();
  const [data, setData] = useState<TemperatureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isKing = role === "King" || role === "User";

  useEffect(() => {
    const token = session?.access_token;
    if (!isKing || !token) return;

    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/iot/temperature", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Temperature request failed");
        return (await response.json()) as TemperatureData[];
      })
      .then((temperatureData) => {
        if (active) setData(temperatureData);
      })
      .catch(() => {
        if (active) setError("Kunne ikke hente temperaturdata.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isKing, session?.access_token]);
  const latestReading = data.reduce<TemperatureData | null>((latest, entry) => {
    if (!latest) return entry;
    return new Date(entry.created_at) > new Date(latest.created_at)
      ? entry
      : latest;
  }, null);
  const forecastDifference =
    latestReading?.temperature_forcast === undefined ||
    latestReading.temperature_forcast === null
      ? null
      : latestReading.temperature - latestReading.temperature_forcast;
  const latestTimestamp = latestReading
    ? new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(latestReading.created_at))
    : null;

  if (!isKing) {
    return (
      <RequireRole roles={["King", "User"]}>
        <></>
      </RequireRole>
    );
  }

  return (
    <PageShell
      eyebrow="SANNTID"
      title="Temperatur"
      subtitle="Målinger fra IoT-sensoren sammenlignet med Yr-varselet."
      maxWidth="lg"
    >
      {loading ? (
        <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
          <CircularProgress aria-label="Henter temperaturdata" />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Card
          sx={{
            width: "100%",
            borderRadius: 1,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {latestReading && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "minmax(220px, 0.8fr) 1fr",
                },
                gap: { xs: 2, sm: 4 },
                px: { xs: 2.5, sm: 4 },
                py: { xs: 2.5, sm: 3 },
                bgcolor: "rgba(63,107,74,0.12)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ThermostatIcon color="primary" sx={{ fontSize: 34 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Siste måling
                  </Typography>
                  <Typography
                    component="p"
                    sx={{
                      fontSize: { xs: "2.15rem", sm: "2.5rem" },
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    {latestReading.temperature.toLocaleString("nb-NO", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    °C
                  </Typography>
                </Box>
              </Stack>

              <Stack justifyContent="center" spacing={0.75}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Målt {latestTimestamp}
                  </Typography>
                </Stack>
                {forecastDifference !== null && (
                  <Typography variant="body2" color="text.secondary">
                    {Math.abs(forecastDifference) < 0.05
                      ? "Samme temperatur som Yr varslet"
                      : `${Math.abs(forecastDifference).toLocaleString(
                          "nb-NO",
                          {
                            maximumFractionDigits: 1,
                          },
                        )} °C ${forecastDifference > 0 ? "varmere" : "kaldere"} enn Yr varslet`}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
          {latestReading && <Divider />}

          <CardContent sx={{ p: { xs: 2, sm: 3.5 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Historikk og værvarsel
            </Typography>
            <IotTemperatureChart data={data} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
