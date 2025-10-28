"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface IotTemperatureChartProps {
  data: { created_at: string; temperature: number }[];
  loading: boolean;
  authorized: boolean;
}

const IotTemperatureChart = dynamic<IotTemperatureChartProps>(
  () => import("./IotTemperatureChart"),
  { ssr: false }
);

interface IotTemperatureCardProps {
  data: { created_at: string; temperature: number }[];
  authorized: boolean;
}

export default function IotTemperatureCard({
  data,
  authorized,
}: IotTemperatureCardProps) {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [router]);

  return (
    <Box maxWidth={800} mx="auto" mt={8}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Temperature Graph
          </Typography>
          <IotTemperatureChart
            data={data}
            loading={false}
            authorized={authorized}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
