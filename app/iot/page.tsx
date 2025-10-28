import { createClient } from "@supabase/supabase-js";
import IotTemperatureCard from "./IotTemperatureCard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function Page() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let data: { created_at: string; temperature: number }[] = [];
  const { data: tempData, error } = await supabase
    .from("temperature_data")
    .select("created_at, temperature")
    .order("created_at", { ascending: false })
    .limit(10);
  if (!error && tempData) {
    data = tempData.reverse();
  }

  return <IotTemperatureCard data={data} />;
}
