import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Admin role required to mutate carousel/products.
const ADMIN_ROLE = "King";

/**
 * Verify that the incoming request is from a logged-in admin.
 * Returns { user } on success, or a NextResponse (401/403) on failure.
 *
 * The client must send `Authorization: Bearer <access_token>` where the
 * token comes from `supabase.auth.getSession()`.
 */
export async function requireAdmin(
  req: Request,
): Promise<{ user: User } | NextResponse> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Validate the JWT using the anon client.
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userError } =
    await authClient.auth.getUser(token);

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userData.user.id },
    select: { role: true },
  });

  if (profile?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { user: userData.user };
}
