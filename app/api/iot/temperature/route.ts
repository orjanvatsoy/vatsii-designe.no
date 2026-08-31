import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/requireUser";

export const dynamic = "force-dynamic";
const MAX_RANGE_MS = 14 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  const profile = await prisma.profile.findUnique({
    where: { id: authResult.user.id },
    select: { role: true },
  });
  if (profile?.role !== "King" && profile?.role !== "User") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const end = new Date(searchParams.get("end") ?? Date.now());
  const start = new Date(
    searchParams.get("start") ?? end.getTime() - 24 * 60 * 60 * 1000,
  );
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end ||
    end.getTime() - start.getTime() > MAX_RANGE_MS
  ) {
    return NextResponse.json(
      { error: "Ugyldig tidsperiode. Velg maksimalt 14 døgn." },
      { status: 400 },
    );
  }

  const temperatureData = await prisma.temperatureData.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      temperature: true,
      temperatureForecast: true,
    },
  });

  return NextResponse.json(
    temperatureData.map((entry) => ({
      created_at: entry.createdAt.toISOString(),
      temperature: entry.temperature,
      temperature_forcast: entry.temperatureForecast,
    })),
  );
}
