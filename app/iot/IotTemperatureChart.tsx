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
  return (
    <Box style={{ width: "100%", minWidth: 0, overflowX: "auto" }}>
      <LineChart
        xAxis={[
          {
            data: data.map((d) => {
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
            data: data.map((d) => d.temperature),
            label: "Temperature (°C)",
          },
        ]}
      />
    </Box>
  );
}
