"use client";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
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

  return (
    <Box style={{ width: "100%", height: "30vh" }}>
      <FormControl size="small" sx={{ mb: 2, minWidth: 120 }}>
        <InputLabel id="hour-range-label">Range</InputLabel>
        <Select
          labelId="hour-range-label"
          value={hourRange}
          label="Range"
          onChange={(e) => setHourRange(Number(e.target.value))}
        >
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
        series={[
          {
            data: yData,
            label: "Temperature (°C)",
            showMark: false,
          },
        ]}
      />
    </Box>
  );
}
