"use client";
import { Typography } from "@mui/material";
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
  // Only show the last 10 points
  const last10 = data.slice(-10);
  // Format time as HH:mm:ss (24H)
  const timeLabels = last10.map((d) => {
    const date = new Date(d.created_at);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  });
  return (
    <LineChart
      xAxis={[
        {
          data: timeLabels,
          scaleType: "point",
          label: "Time",
        },
      ]}
      series={[
        {
          data: last10.map((d) => d.temperature),
          label: "Temperature (°C)",
        },
      ]}
      width={700}
      height={400}
    />
  );
}
