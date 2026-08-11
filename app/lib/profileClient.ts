import { supabase } from "./supabaseClient";

export async function getCurrentProfileRole(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return "";

  const response = await fetch("/api/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return "";

  const profile = (await response.json()) as { role?: string };
  return profile.role ?? "";
}
