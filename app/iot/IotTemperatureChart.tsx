"use client";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useState, useEffect } from "react";
// Helper to fetch forecast from new API route
async function fetchYrForecast() {
  const res = await fetch("/api/YRforecast");
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();
  return data.forecast as { time: string; temperature: number }[];
}
import { LineChart } from "@mui/x-charts/LineChart";

interface IotTemperatureChartProps {
  data: { created_at: string; temperature: number }[];
  loading: boolean;
  authorized: boolean;
}

export default function IotTemperatureChart({
  data,
  loading,
  authorized,
}: IotTemperatureChartProps) {
  const [hourRange, setHourRange] = useState(24);
  const [forecast, setForecast] = useState<
    { time: string; temperature: number }[]
  >([]);

  useEffect(() => {
    let ignore = false;
    fetchYrForecast().then((data) => {
      if (!ignore) setForecast(data);
    });
    return () => {
      ignore = true;
    };
  }, []);
  if (!authorized) {
    return <Typography color="error">Not authorized</Typography>;
  }
  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  // Split the range: half past, half future
  const now = new Date();
  const halfRange = hourRange / 2;
  // Supabase data: only up to now, last halfRange hours
  const supabasePast = data.filter((d) => {
    const t = new Date(d.created_at);
    return (
      t.getTime() >= now.getTime() - halfRange * 60 * 60 * 1000 &&
      t.getTime() <= now.getTime()
    );
  });
  // YR forecast: only from now, next halfRange hours
  const forecastFuture = forecast.filter((f) => {
    const t = new Date(f.time);
    return (
      t.getTime() >= now.getTime() &&
      t.getTime() <= now.getTime() + halfRange * 60 * 60 * 1000
    );
  });

  // Build x-axis: -halfRange to 0 for past, 0 to +halfRange for future
  const xDataPast = supabasePast.map((d) => {
    const t = new Date(d.created_at);
    return (
      (t.getTime() - (now.getTime() - halfRange * 60 * 60 * 1000)) /
        (60 * 60 * 1000) -
      halfRange
    );
  });
  const yDataPast = supabasePast.map((d) => d.temperature);
  const xDataFuture = forecastFuture.map((f) => {
    const t = new Date(f.time);
    return (t.getTime() - now.getTime()) / (60 * 60 * 1000);
  });
  const yDataFuture = forecastFuture.map((f) => f.temperature);

  // Merge x-axis for chart: -halfRange ... 0 ... +halfRange
  const xData = [...xDataPast, ...xDataFuture];

  // For series, pad with nulls so both arrays are same length as xData
  const yDataPastPadded = [
    ...yDataPast,
    ...Array(xDataFuture.length).fill(null),
  ];
  const yDataFuturePadded = [
    ...Array(xDataPast.length).fill(null),
    ...yDataFuture,
  ];

  return (
    <Box style={{ width: "100%" }}>
      <FormControl size="small" sx={{ mb: 2, minWidth: 120 }}>
        <InputLabel id="hour-range-label">Range</InputLabel>
        <Select
          labelId="hour-range-label"
          value={hourRange}
          label="Range"
          onChange={(e) => setHourRange(Number(e.target.value))}
        >
          <MenuItem value={1}>Last 1 hour</MenuItem>
          <MenuItem value={6}>Last 6 hours</MenuItem>
          <MenuItem value={12}>Last 12 hours</MenuItem>
          <MenuItem value={24}>Last 24 hours</MenuItem>
          <MenuItem value={48}>Last 48 hours</MenuItem>
        </Select>
      </FormControl>
      <LineChart
        xAxis={[
          {
            data: xData,
            scaleType: "linear",
            min: -halfRange,
            max: halfRange,
            label: `Time (past/future, h)`,
            tickNumber: 9,
            valueFormatter: (value) => {
              // value is hours from now (negative = past, positive = future)
              const h = Math.round(value);
              const date = new Date(now.getTime() + h * 60 * 60 * 1000);
              return (
                date.toLocaleTimeString([], {
                  hour: "2-digit",
                  hour12: false,
                }) + ":00"
              );
            },
          },
        ]}
        series={[
          {
            id: "past",
            data: yDataPastPadded,
            label: "Temperature (past, Supabase)",
            showMark: false,
          },
          {
            id: "future",
            data: yDataFuturePadded,
            label: "Forecast (future, Yr)",
            showMark: false,
            color: "#1976d2",
          },
        ]}
        height={400}
        slotProps={{
          line: ({ id }) => ({
            strokeDasharray: id === "future" ? "4 4" : "0",
          }),
        }}
      />
    </Box>
  );
}
