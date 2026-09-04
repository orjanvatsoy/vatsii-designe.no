"use client";

import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

const HOUR = 60 * 60 * 1000;

interface IotHumidityChartProps {
  data: {
    created_at: string;
    humidity?: number | null;
  }[];
  hourRange: number;
  windowOffset: number;
  loading: boolean;
}

export default function IotHumidityChart({
  data,
  hourRange,
  windowOffset,
  loading,
}: IotHumidityChartProps) {
  const theme = useTheme();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowOffset * hourRange * HOUR);
  const windowStart = new Date(windowEnd.getTime() - hourRange * HOUR);
  const humidityByTime = new Map<number, number>();

  data.forEach((entry) => {
    const timestamp = new Date(entry.created_at).getTime();
    if (
      timestamp >= windowStart.getTime() &&
      timestamp <= windowEnd.getTime() &&
      entry.humidity !== undefined &&
      entry.humidity !== null
    ) {
      humidityByTime.set(timestamp, entry.humidity);
    }
  });

  const timestamps = [...humidityByTime.keys()].sort(
    (left, right) => left - right,
  );
  const xData = timestamps.map((timestamp) => new Date(timestamp));
  const humidityData = timestamps.map(
    (timestamp) => humidityByTime.get(timestamp) ?? null,
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
    <LineChart
      xAxis={[
        {
          data: xData,
          scaleType: "time",
          min: windowStart,
          max: windowEnd,
          tickNumber: 7,
          valueFormatter: (value: Date) => dateFormatter.format(value),
        },
      ]}
      yAxis={[{ label: "Luftfuktighet (%)", min: 0, max: 100 }]}
      series={[
        {
          id: "humidity",
          data: humidityData,
          label: "Luftfuktighet",
          showMark: false,
          connectNulls: false,
          color: theme.palette.secondary.main,
        },
      ]}
      height={390}
      margin={{ left: 16, right: 16, bottom: 12 }}
    />
  );
}
