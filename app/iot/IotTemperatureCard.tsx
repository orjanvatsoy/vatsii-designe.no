"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import PageShell from "../Components/PageShell";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getCurrentProfileRole } from "../lib/profileClient";

interface IotTemperatureChartProps {
  data: TemperatureData[];
  loading: boolean;
  authorized: boolean;
}

interface IotTemperatureCardProps {
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

export default function IotTemperatureCard({ data }: IotTemperatureCardProps) {
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      setLoading(true);
      setRole(await getCurrentProfileRole());
      setLoading(false);
    };
    getRole();
  }, []);

  const isKing = role === "King" || role === "User";
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

  return (
    <PageShell
      eyebrow="SANNTID"
      title="Temperatur"
      subtitle="Målinger fra IoT-sensoren sammenlignet med Yr-varselet."
      maxWidth="lg"
    >
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
        {!loading && isKing && latestReading && (
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
                    : `${Math.abs(forecastDifference).toLocaleString("nb-NO", {
                        maximumFractionDigits: 1,
                      })} °C ${forecastDifference > 0 ? "varmere" : "kaldere"} enn Yr varslet`}
                </Typography>
              )}
            </Stack>
          </Box>
        )}
        {!loading && isKing && latestReading && <Divider />}

        <CardContent sx={{ p: { xs: 2, sm: 3.5 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Historikk og værvarsel
          </Typography>
          <IotTemperatureChart
            data={data}
            loading={loading}
            authorized={isKing}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
