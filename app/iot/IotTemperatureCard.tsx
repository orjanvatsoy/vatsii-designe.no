"use client";

import {
  Card,
  CardContent,
  Typography,
  Container,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";

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
  { ssr: false }
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
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4, mb: 2 }}>
        <MuiLink href="/" color="inherit" underline="hover">
          Hjem
        </MuiLink>

        <Typography color="primary" fontWeight={600}>
          Temperatur IOT
        </Typography>
      </Breadcrumbs>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Card sx={{ width: "100%" }}>
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
      </Container>
    </>
  );
}
