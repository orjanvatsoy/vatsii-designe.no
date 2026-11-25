"use client";

import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useState } from "react";
import IotSeriesToggle from "./IotSeriesToggle";
import {
  CABIN_DEVICE_ID,
  GARAGE_DEVICE_ID,
  type TemperatureData,
} from "./iotData";

interface HumidityForecast {
  time: string;
  humidity: number;
}

async function fetchHumidityForecast() {
  const response = await fetch("/api/YRforecast");
  if (!response.ok) throw new Error("Failed to fetch forecast");
  const data = (await response.json()) as { forecast: HumidityForecast[] };
  return data.forecast;
}

const HOUR = 60 * 60 * 1000;

interface IotHumidityChartProps {
  data: TemperatureData[];
  hourRange: number;
  windowOffset: number;
  customRange: { start: Date; end: Date } | null;
  loading: boolean;
}

export default function IotHumidityChart({
  data,
  hourRange,
  windowOffset,
  customRange,
  loading,
}: IotHumidityChartProps) {
  const theme = useTheme();
  const [forecast, setForecast] = useState<HumidityForecast[]>([]);
  const [visibleSeries, setVisibleSeries] = useState([
    "humidity",
    "cabin",
    "forecast",
  ]);

  useEffect(() => {
    let ignore = false;
    fetchHumidityForecast()
      .then((forecastData) => {
        if (!ignore) setForecast(forecastData);
      })
      .catch(() => {
        if (!ignore) setForecast([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const now = new Date();
  const windowEnd = customRange
    ? customRange.end
    : new Date(now.getTime() + windowOffset * hourRange * HOUR);
  const windowStart = customRange
    ? customRange.start
    : new Date(windowEnd.getTime() - hourRange * HOUR);
  const forecastEnd = new Date(now.getTime() + 24 * HOUR);
  const displayEnd =
    !customRange && windowOffset === 0 ? forecastEnd : windowEnd;
  const humidityByTime = new Map<number, number>();
  const cabinByTime = new Map<number, number>();
  const forecastByTime = new Map<number, number>();

  data.forEach((entry) => {
    const timestamp = new Date(entry.created_at).getTime();
    if (
      timestamp >= windowStart.getTime() &&
      timestamp <= windowEnd.getTime() &&
      entry.humidity !== undefined &&
      entry.humidity !== null &&
      entry.device_id === GARAGE_DEVICE_ID
    ) {
      humidityByTime.set(timestamp, entry.humidity);
    }
    if (
      timestamp >= windowStart.getTime() &&
      timestamp <= windowEnd.getTime() &&
      entry.humidity !== null &&
      entry.device_id === CABIN_DEVICE_ID
    ) {
      cabinByTime.set(timestamp, entry.humidity);
    }
    if (
      timestamp >= windowStart.getTime() &&
      timestamp <= windowEnd.getTime() &&
      entry.humidity_forcast !== undefined &&
      entry.humidity_forcast !== null &&
      entry.device_id === GARAGE_DEVICE_ID
    ) {
      forecastByTime.set(timestamp, entry.humidity_forcast);
    }
  });

  const futureForecast =
    !customRange && windowOffset === 0
      ? forecast.filter((entry) => {
          const timestamp = new Date(entry.time).getTime();
          return (
            timestamp >= now.getTime() && timestamp <= forecastEnd.getTime()
          );
        })
      : [];
  futureForecast.forEach((entry) => {
    forecastByTime.set(new Date(entry.time).getTime(), entry.humidity);
  });

  const timestamps = [
    ...new Set([
      ...humidityByTime.keys(),
      ...cabinByTime.keys(),
      ...forecastByTime.keys(),
    ]),
  ].sort((left, right) => left - right);
  const xData = timestamps.map((timestamp) => new Date(timestamp));
  const humidityData = timestamps.map(
    (timestamp) => humidityByTime.get(timestamp) ?? null,
  );
  const cabinData = timestamps.map(
    (timestamp) => cabinByTime.get(timestamp) ?? null,
  );
  const forecastData = timestamps.map(
    (timestamp) => forecastByTime.get(timestamp) ?? null,
  );
  const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) {
    return (
      <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
        <CircularProgress aria-label="Henter luftfuktighetsdata" />
      </Box>
    );
  }

  if (xData.length === 0) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "grid",
          placeItems: "center",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography color="text.secondary">
          Ingen luftfuktighetsmålinger i denne perioden.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {!customRange &&
        windowOffset === 0 &&
        visibleSeries.includes("forecast") &&
        futureForecast.length > 0 && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            met.no-varsel neste 24 timer
          </Typography>
        )}
      <IotSeriesToggle
        label="Luftfuktighetskurver"
        options={[
          {
            id: "humidity",
            label: "Garasje",
            color: theme.palette.secondary.main,
          },
          { id: "cabin", label: "Hytte", color: "#80B8D1" },
          {
            id: "forecast",
            label: "met.no-varsel",
            color: theme.palette.primary.light,
            dashed: true,
          },
        ]}
        visible={visibleSeries}
        onChange={setVisibleSeries}
      />
      {visibleSeries.length === 0 ? (
        <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
          <Typography color="text.secondary">
            Vel minst ei kurve for å vise grafen.
          </Typography>
        </Box>
      ) : (
        <LineChart
          hideLegend
          xAxis={[
            {
              data: xData,
              scaleType: "time",
              min: windowStart,
              max: displayEnd,
              tickNumber: 7,
              valueFormatter: (value: Date) => dateFormatter.format(value),
            },
          ]}
          yAxis={[{ label: "Luftfuktighet (%)", min: 0, max: 100 }]}
          series={[
            {
              id: "humidity",
              data: humidityData,
              label: "Garasje",
              showMark: false,
              connectNulls: true,
              color: theme.palette.secondary.main,
            },
            {
              id: "cabin",
              data: cabinData,
              label: "Hytte",
              showMark: cabinByTime.size === 1,
              connectNulls: true,
              color: "#80B8D1",
            },
            {
              id: "forecast",
              data: forecastData,
              label: "met.no-varsel",
              showMark: false,
              connectNulls: true,
              color: theme.palette.primary.light,
            },
          ].filter((item) => visibleSeries.includes(item.id))}
          height={390}
          margin={{ left: 16, right: 16, bottom: 12 }}
          slotProps={{
            line: ({ id }) => ({
              strokeDasharray: id === "forecast" ? "5 5" : "0",
            }),
          }}
        />
      )}
    </Box>
  );
}
