import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });

  return NextResponse.json({ role: profile?.role ?? "" });
}
