import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/requireUser";

export const dynamic = "force-dynamic";

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

  const temperatureData = await prisma.temperatureData.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    temperatureData.map((entry) => ({
      created_at: entry.createdAt.toISOString(),
      temperature: entry.temperature,
      temperature_forcast: entry.temperatureForecast,
    })),
  );
}
