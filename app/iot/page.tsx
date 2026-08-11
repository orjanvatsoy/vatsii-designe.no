export const dynamic = "force-dynamic";
import IotTemperatureCard from "./IotTemperatureCard";
import { prisma } from "../lib/prisma";

export default async function Page() {
  const temperatureData = await prisma.temperatureData.findMany({
    orderBy: { createdAt: "asc" },
  });
  const data = temperatureData.map((entry) => ({
    created_at: entry.createdAt.toISOString(),
    temperature: entry.temperature,
    temperature_forcast: entry.temperatureForecast,
  }));

  return <IotTemperatureCard data={data} />;
}
