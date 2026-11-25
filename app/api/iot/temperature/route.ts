import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/requireUser";

export const dynamic = "force-dynamic";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOURLY_AGGREGATION_THRESHOLD_MS = 14 * DAY_MS;
const DAILY_AGGREGATION_THRESHOLD_MS = 90 * DAY_MS;

type TemperatureDataRow = {
  createdAt: Date | null;
  temperature: number | { toNumber(): number } | null;
  temperatureForecast: number | { toNumber(): number } | null;
  humidity: number | { toNumber(): number } | null;
  humidityForecast: number | { toNumber(): number } | null;
  outdoorTemperature: number | { toNumber(): number } | null;
};

function toNullableNumber(value: TemperatureDataRow["temperature"]) {
  if (value === null) return null;
  return typeof value === "number" ? value : value.toNumber();
}

export async function GET(request: Request) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!authResult.localBypass) {
    const profile = await prisma.profile.findUnique({
      where: { id: authResult.user.id },
      select: { role: true },
    });
    if (profile?.role !== "King" && profile?.role !== "User") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const searchParams = new URL(request.url).searchParams;
  const end = new Date(searchParams.get("end") ?? Date.now());
  const start = new Date(
    searchParams.get("start") ?? end.getTime() - 24 * 60 * 60 * 1000,
  );
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end
  ) {
    return NextResponse.json(
      { error: "Ugyldig tidsperiode." },
      { status: 400 },
    );
  }

  const rangeMs = end.getTime() - start.getTime();
  let temperatureData: TemperatureDataRow[];
  if (rangeMs <= HOURLY_AGGREGATION_THRESHOLD_MS) {
    temperatureData = await prisma.temperatureData.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        temperature: true,
        temperatureForecast: true,
        humidity: true,
        humidityForecast: true,
        outdoorTemperature: true,
      },
    });
  } else {
    const bucket = rangeMs > DAILY_AGGREGATION_THRESHOLD_MS ? "day" : "hour";
    temperatureData = await prisma.$queryRaw<TemperatureDataRow[]>`
      SELECT
        date_trunc(${bucket}::text, created_at) AS "createdAt",
        AVG(temperature)::float8 AS temperature,
        AVG(temperature_forcast)::float8 AS "temperatureForecast",
        AVG(humidity)::float8 AS humidity,
        AVG(humidity_forcast)::float8 AS "humidityForecast",
        AVG(outdoor_temperature)::float8 AS "outdoorTemperature"
      FROM temperature_data
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  return NextResponse.json(
    temperatureData.flatMap((entry) =>
      entry.createdAt === null
        ? []
        : [
            {
              created_at: entry.createdAt.toISOString(),
              temperature: toNullableNumber(entry.temperature),
              temperature_forcast: toNullableNumber(entry.temperatureForecast),
              humidity: toNullableNumber(entry.humidity),
              humidity_forcast: toNullableNumber(entry.humidityForecast),
              outdoor_temperature: toNullableNumber(entry.outdoorTemperature),
            },
          ],
    ),
  );
}
