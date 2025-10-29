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

  return (
    <Box style={{ width: "100%", height: "30vh" }}>
      <LineChart
        xAxis={[
          {
            data: last24h.map((d) => {
              const date = new Date(d.created_at);
              return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              });
            }),
            scaleType: "point",
            label: "Time",
          },
        ]}
        series={[
          {
            data: last24h.map((d) => d.temperature),
            label: "Temperature (°C)",
            showMark: false,
          },
        ]}
      />
    </Box>
  );
}
