"use client";
import { Box, Typography } from "@mui/material";
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
  if (!authorized) {
    return <Typography color="error">Not authorized</Typography>;
  }
  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  // Filter data to last 24 hours
  const now = new Date();
  const last24h = data.filter((d) => {
    const t = new Date(d.created_at);
    return now.getTime() - t.getTime() <= 24 * 60 * 60 * 1000;
  });

  // Build x-axis for 24h, 6 main labels (every 4 hours)
  const hourLabels: string[] = [];
  const nowHour = now.getHours();
  for (let i = 0; i <= 6; i++) {
    const h = new Date(now.getTime() - (24 - i * 4) * 60 * 60 * 1000);
    hourLabels.push(
      h.toLocaleTimeString([], { hour: "2-digit", hour12: false }) + ":00"
    );
  }

  // Map data to hours since -24h
  const xData = last24h.map((d) => {
    const t = new Date(d.created_at);
    // hours since 24h ago
    return (
      (t.getTime() - (now.getTime() - 24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );
  });
  const yData = last24h.map((d) => d.temperature);

  return (
    <Box style={{ width: "100%", height: "30vh" }}>
      <LineChart
        xAxis={[
          {
            data: xData,
            scaleType: "linear",
            min: 0,
            max: 24,
            label: "Time (last 24h)",
            tickNumber: 6,
            valueFormatter: (value) => {
              // value is hours since -24h
              const h = Math.round(value);
              const date = new Date(now.getTime() - (24 - h) * 60 * 60 * 1000);
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
