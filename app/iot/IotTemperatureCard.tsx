"use client";

import { Card, CardContent, Typography } from "@mui/material";
import PageShell from "../Components/PageShell";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface IotTemperatureChartProps {
  data: { created_at: string; temperature: number }[];
  loading: boolean;
  authorized: boolean;
}

interface IotTemperatureCardProps {
  data: { created_at: string; temperature: number }[];
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
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setRole(profile.role || "");
      }
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
