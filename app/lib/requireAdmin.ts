import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin role required to mutate carousel/products.
const ADMIN_ROLE = "King";

/**
 * Verify that the incoming request is from a logged-in admin.
 * Returns a NextResponse (401/403) on failure, or null on success.
 *
 * The client must send `Authorization: Bearer <access_token>` where the
 * token comes from `supabase.auth.getSession()`.
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
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

  // Check the role via the service-role client so RLS can't be bypassed
  // by a user who edits their own profile row.
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile || profile.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
