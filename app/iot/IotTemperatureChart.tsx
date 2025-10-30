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
  // Filter data to last N hours
  const now = new Date();
  const lastN = data.filter((d) => {
    const t = new Date(d.created_at);
    return now.getTime() - t.getTime() <= hourRange * 60 * 60 * 1000;
  });

  // Build x-axis for N hours, 6 main labels
  const tickNumber = 6;
  // Map data to hours since -N
  const xData = lastN.map((d) => {
    const t = new Date(d.created_at);
    return (
      (t.getTime() - (now.getTime() - hourRange * 60 * 60 * 1000)) /
      (60 * 60 * 1000)
    );
  });
  const yData = lastN.map((d) => d.temperature);

  // Prepare forecast data for the selected range (future only)
  const forecastFiltered = forecast
    .filter((f) => {
      const t = new Date(f.time);
      return (
        t.getTime() >= now.getTime() &&
        t.getTime() <= now.getTime() + hourRange * 60 * 60 * 1000
      );
    })
    .map((f) => {
      // x: hours from now (0 = now)
      const t = new Date(f.time);
      return {
        x: (t.getTime() - now.getTime()) / (60 * 60 * 1000),
        y: f.temperature,
      };
    });

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
            min: 0,
            max: hourRange,
            label: `Time (last ${hourRange}h)`,
            tickNumber,
            valueFormatter: (value) => {
              // value is hours since -N
              const h = Math.round(value);
              const date = new Date(
                now.getTime() - (hourRange - h) * 60 * 60 * 1000
              );
              return (
                date.toLocaleTimeString([], {
                  hour: "2-digit",
                  hour12: false,
                }) + ":00"
              );
            },
          },
        ]}
        series={
          forecastFiltered.length > 0
            ? [
                {
                  data: yData,
                  label: "Temperature (°C)",
                  showMark: false,
                },
                {
                  data: forecastFiltered.map((f) => f.y),
                  label: "Forecast (Yr)",
                  color: "#1976d2",
                  showMark: false,
                  area: false,
                },
              ]
            : [
                {
                  data: yData,
                  label: "Temperature (°C)",
                  showMark: false,
                },
              ]
        }
        height={400}
      />
    </Box>
  );
}
