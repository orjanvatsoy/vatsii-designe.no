"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
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
import {
  GARAGE_DEVICE_ID,
  type CabinTemperature,
  type TemperatureData,
} from "./iotData";

interface IotTemperatureChartProps {
  data: TemperatureData[];
  hourRange: number;
  windowOffset: number;
  customRange: { start: Date; end: Date } | null;
  earliestReading: string | null | undefined;
  loading: boolean;
  onHourRangeChange: (hours: number) => void;
  onWindowOffsetChange: (offset: number) => void;
  onCustomRangeChange: (range: { start: Date; end: Date } | null) => void;
}

const HOUR = 60 * 60 * 1000;

const IotTemperatureChart = dynamic<IotTemperatureChartProps>(
  () => import("./IotTemperatureChart"),
  { ssr: false },
);

const IotHumidityChart = dynamic(() => import("./IotHumidityChart"), {
  ssr: false,
});

function formatReading(value: number | null | undefined, unit: string) {
  if (value === undefined || value === null) return "–";
  return `${value.toLocaleString("nb-NO", {
    maximumFractionDigits: 1,
  })} ${unit}`;
}

export default function IotTemperatureCard() {
  const { role, session } = useAuth();
  const [data, setData] = useState<TemperatureData[]>([]);
  const [latestReading, setLatestReading] = useState<TemperatureData | null>(
    null,
  );
  const [latestCabinTemperature, setLatestCabinTemperature] =
    useState<CabinTemperature | null>(null);
  const [hourRange, setHourRange] = useState(24);
  const [windowOffset, setWindowOffset] = useState(0);
  const [customRange, setCustomRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");
  const [earliestReading, setEarliestReading] = useState<
    string | null | undefined
  >(undefined);
  const [metadataError, setMetadataError] = useState("");
  const isKing = role === "King" || role === "User";

  useEffect(() => {
    const token = session?.access_token;
    if (!isKing || !token) return;

    let active = true;
    const controller = new AbortController();
    setEarliestReading(undefined);
    setLatestCabinTemperature(null);
    setMetadataError("");
    fetch("/api/iot/temperature?metadata=1", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Temperature metadata request failed");
        return (await response.json()) as {
          earliestReading: string | null;
          latestCabinTemperature: CabinTemperature | null;
        };
      })
      .then(({ earliestReading: firstReading, latestCabinTemperature: cabin }) => {
        if (
          (firstReading !== null &&
            (typeof firstReading !== "string" ||
              Number.isNaN(new Date(firstReading).getTime()))) ||
          (cabin !== null &&
            (typeof cabin !== "object" ||
              typeof cabin.created_at !== "string" ||
              Number.isNaN(new Date(cabin.created_at).getTime()) ||
              typeof cabin.temperature !== "number" ||
              !Number.isFinite(cabin.temperature)))
        ) {
          throw new Error("Invalid temperature metadata");
        }
        if (active) {
          setEarliestReading(firstReading);
          setLatestCabinTemperature(cabin);
        }
      })
      .catch(() => {
        if (active) setMetadataError("Kunne ikke hente måledato og hyttetemperatur.");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isKing, session?.access_token]);

  useEffect(() => {
    const token = session?.access_token;
    if (!isKing || !token) return;

    let active = true;
    const controller = new AbortController();
    const windowEnd = customRange
      ? customRange.end
      : new Date(Date.now() + windowOffset * hourRange * HOUR);
    const windowStart = customRange
      ? customRange.start
      : new Date(windowEnd.getTime() - hourRange * HOUR);
    const searchParams = new URLSearchParams({
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
    });
    setLoading(true);
    setError("");
    fetch(`/api/iot/temperature?${searchParams}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Temperature request failed");
        return (await response.json()) as TemperatureData[];
      })
      .then((temperatureData) => {
        if (active) {
          setData(temperatureData);
          setHasLoaded(true);
          if (!customRange && windowOffset === 0) {
            setLatestReading(
              temperatureData.findLast(
                (entry) => entry.device_id === GARAGE_DEVICE_ID,
              ) ?? null,
            );
          }
        }
      })
      .catch(() => {
        if (active) setError("Kunne ikke hente temperaturdata.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    customRange,
    hourRange,
    isKing,
    session?.access_token,
    windowOffset,
  ]);
  const forecastDifference =
    latestReading?.outdoor_temperature === undefined ||
    latestReading.outdoor_temperature === null ||
    latestReading?.temperature_forcast === undefined ||
    latestReading.temperature_forcast === null
      ? null
      : latestReading.outdoor_temperature - latestReading.temperature_forcast;
  const indoorOutdoorDifference =
    latestReading?.temperature === undefined ||
    latestReading.temperature === null ||
    latestReading.outdoor_temperature === undefined ||
    latestReading.outdoor_temperature === null
      ? null
      : latestReading.temperature - latestReading.outdoor_temperature;
  const humidityForecastDifference =
    latestReading?.humidity === undefined ||
    latestReading.humidity === null ||
    latestReading.humidity_forcast === undefined ||
    latestReading.humidity_forcast === null
      ? null
      : latestReading.humidity - latestReading.humidity_forcast;
  const latestTimestamp = latestReading
    ? new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(latestReading.created_at))
    : null;
  const cabinTimestamp = latestCabinTemperature
    ? new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(latestCabinTemperature.created_at))
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
      title="Klima i garasjen og hytta"
      subtitle="Temperatur og luftfuktighet fra IoT-sensorene, sammenlignet med met.no."
      maxWidth="lg"
    >
      {loading && !hasLoaded ? (
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
          {(latestReading || latestCabinTemperature) && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
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
                    Garasje
                  </Typography>
                  <Typography
                    component="p"
                    sx={{
                      fontSize: { xs: "2.15rem", sm: "2.5rem" },
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    {formatReading(latestReading?.temperature, "°C")}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ThermostatIcon color="primary" sx={{ fontSize: 30 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hytte
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatReading(latestCabinTemperature?.temperature, "°C")}
                  </Typography>
                  {cabinTimestamp && (
                    <Typography variant="caption" color="text.secondary">
                      Målt {cabinTimestamp}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <WbSunnyOutlinedIcon color="primary" sx={{ fontSize: 30 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Utendørs
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatReading(latestReading?.outdoor_temperature, "°C")}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <WaterDropIcon color="primary" sx={{ fontSize: 30 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Luftfuktighet
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatReading(latestReading?.humidity, "%")}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                justifyContent="center"
                spacing={0.75}
                sx={{ gridColumn: { sm: "1 / -1" } }}
              >
                {latestTimestamp && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Målt {latestTimestamp}
                    </Typography>
                  </Stack>
                )}
                {indoorOutdoorDifference !== null && (
                  <Typography variant="body2" color="text.secondary">
                    {Math.abs(indoorOutdoorDifference) < 0.05
                      ? "Samme temperatur i garasjen som ute"
                      : `${Math.abs(indoorOutdoorDifference).toLocaleString(
                          "nb-NO",
                          { maximumFractionDigits: 1 },
                        )} °C ${indoorOutdoorDifference > 0 ? "varmere" : "kaldere"} i garasjen enn ute`}
                  </Typography>
                )}
                {forecastDifference !== null && (
                  <Typography variant="body2" color="text.secondary">
                    {Math.abs(forecastDifference) < 0.05
                      ? "Samme utetemperatur som met.no varslet"
                      : `${Math.abs(forecastDifference).toLocaleString(
                          "nb-NO",
                          {
                            maximumFractionDigits: 1,
                          },
                        )} °C ${forecastDifference > 0 ? "varmere" : "kaldere"} ute enn met.no varslet`}
                  </Typography>
                )}
                {humidityForecastDifference !== null && (
                  <Typography variant="body2" color="text.secondary">
                    {Math.abs(humidityForecastDifference) < 0.05
                      ? "Samme luftfuktighet i garasjen som met.no varslet ute"
                      : `${Math.abs(humidityForecastDifference).toLocaleString(
                          "nb-NO",
                          { maximumFractionDigits: 1 },
                        )} prosentpoeng ${humidityForecastDifference > 0 ? "høyere" : "lavere"} luftfuktighet i garasjen enn met.no varslet ute`}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
          {(latestReading || latestCabinTemperature) && <Divider />}

          <CardContent sx={{ p: { xs: 2, sm: 3.5 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Temperaturhistorikk og værvarsel
            </Typography>
            {metadataError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {metadataError} Datovalg er utilgjengelig.
              </Alert>
            )}
            <IotTemperatureChart
              data={data}
              hourRange={hourRange}
              windowOffset={windowOffset}
              customRange={customRange}
              earliestReading={earliestReading}
              loading={loading}
              onHourRangeChange={(hours) => {
                setHourRange(hours);
                setWindowOffset(0);
                setCustomRange(null);
              }}
              onWindowOffsetChange={setWindowOffset}
              onCustomRangeChange={setCustomRange}
            />
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Luftfuktighet og værvarsel
            </Typography>
            <IotHumidityChart
              data={data}
              hourRange={hourRange}
              windowOffset={windowOffset}
              customRange={customRange}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
