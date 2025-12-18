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
  data: {
    created_at: string;
    temperature: number;
    temperature_forcast?: number | null;
  }[];
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
  // Supabase forecasted temperature (past)
  const yDataPastForecast = supabasePast.map((d) =>
    d.temperature_forcast !== undefined && d.temperature_forcast !== null
      ? d.temperature_forcast
      : null
  );
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
  // Merge past and future forecast into one series
  const yDataForecastMerged = [...yDataPastForecast, ...yDataFuture];

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
          <MenuItem value={24}>Last 1 day</MenuItem>
          <MenuItem value={72}>Last 3 days</MenuItem>
          <MenuItem value={168}>Last 7 days</MenuItem>
          <MenuItem value={336}>Last 14 days</MenuItem>
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
              const ms = value * 60 * 60 * 1000;
              const date = new Date(now.getTime() + ms);
              return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            },
          },
        ]}
        series={[
          {
            id: "past",
            data: yDataPastPadded,
            label: "Temperature (IOT measured)",
            showMark: false,
          },
          {
            id: "forecast",
            data: yDataForecastMerged,
            label: "Forecast (Yr)",
            showMark: false,
            color: "#1976d2",
          },
        ]}
        height={400}
        slotProps={{
          line: ({ id }) => ({
            strokeDasharray: id === "forecast" ? "4 4" : "0",
          }),
        }}
      />
    </Box>
  );
}
