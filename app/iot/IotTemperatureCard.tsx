"use client";

import { Card, CardContent, Typography } from "@mui/material";
import PageShell from "../Components/PageShell";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getCurrentProfileRole } from "../lib/profileClient";

interface IotTemperatureChartProps {
  data: TemperatureData[];
  loading: boolean;
  authorized: boolean;
}

interface IotTemperatureCardProps {
  data: TemperatureData[];
}

interface TemperatureData {
  created_at: string;
  temperature: number;
  temperature_forcast?: number | null;
}

const IotTemperatureChart = dynamic<IotTemperatureChartProps>(
  () => import("./IotTemperatureChart"),
  { ssr: false },
);

export default function IotTemperatureCard({ data }: IotTemperatureCardProps) {
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      setLoading(true);
      setRole(await getCurrentProfileRole());
      setLoading(false);
    };
    getRole();
  }, []);

  const isKing = role === "King" || role === "User";

  return (
    <PageShell
      eyebrow="SANNTID"
      title="Temperatur"
      subtitle="Live temperaturdata fra IoT-sensoren."
    >
      <Card
        sx={{
          width: "100%",
          borderRadius: 4,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 24px 60px -28px rgba(0,0,0,0.8)",
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            Temperaturgraf
          </Typography>
          <IotTemperatureChart
            data={data}
            loading={loading}
            authorized={isKing}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
