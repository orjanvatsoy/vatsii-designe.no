import { createClient } from "@supabase/supabase-js";
import IotTemperatureCard from "./IotTemperatureCard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function IotTemperaturePage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let authorized = false;
  let data: { created_at: string; temperature: number }[] = [];

  if (process.env.NODE_ENV === "development") {
    // Always authorize and fetch data in dev, regardless of user
    authorized = true;
    const { data: tempData, error } = await supabase
      .from("temperature_data")
      .select("created_at, temperature")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error && tempData) {
      data = tempData.reverse();
    }
  } else {
    // Production: require user and King role
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      authorized = profile?.role === "King";
      if (authorized) {
        const { data: tempData, error } = await supabase
          .from("temperature_data")
          .select("created_at, temperature")
          .order("created_at", { ascending: false })
          .limit(10);
        if (!error && tempData) {
          data = tempData.reverse();
        }
      }
    }
  }

  // Always pass authorized=true; client will check real role
  return <IotTemperatureCard data={data} authorized={true} />;
}
