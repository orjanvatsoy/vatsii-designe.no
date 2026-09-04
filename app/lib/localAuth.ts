import type { User } from "@supabase/supabase-js";

export const LOCAL_AUTH_BYPASS_TOKEN = "local-development-auth-bypass";
export const LOCAL_AUTH_BYPASS_USER_ID = "00000000-0000-0000-0000-000000000000";

export function isLocalAuthBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_LOCAL_AUTH_BYPASS === "true"
  );
}

export function isLocalAuthBypassRequest(request: Request) {
  if (!isLocalAuthBypassEnabled()) return false;

  const hostname = new URL(request.url).hostname;
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]";
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  return isLoopback && token === LOCAL_AUTH_BYPASS_TOKEN;
}

export function createLocalAuthUser(userId = LOCAL_AUTH_BYPASS_USER_ID): User {
  return {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: "local@localhost",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date(0).toISOString(),
  };
}
