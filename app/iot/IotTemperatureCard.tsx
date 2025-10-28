"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";

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
  authorized: boolean;
}

const IotTemperatureChart = dynamic<IotTemperatureChartProps>(
  () => import("./IotTemperatureChart"),
  { ssr: false }
);

export default function IotTemperatureCard({
  data,
  authorized,
}: IotTemperatureCardProps) {
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

  const isKing = role === "King";

  return (
    <Box maxWidth={800} mx="auto" mt={8}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Temperature Graph
          </Typography>
          <IotTemperatureChart
            data={data}
            loading={loading}
            authorized={isKing}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
