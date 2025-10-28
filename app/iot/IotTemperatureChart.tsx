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
  return (
    <LineChart
      xAxis={[
        {
          data: data.map((d) => new Date(d.created_at).toLocaleString()),
          scaleType: "point",
          label: "Time",
        },
      ]}
      series={[
        {
          data: data.map((d) => d.temperature),
          label: "Temperature (°C)",
        },
      ]}
      width={Math.max(350, window.innerWidth - 48)}
      height={250}
    />
  );
}
