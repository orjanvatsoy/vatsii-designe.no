import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createLocalAuthUser, isLocalAuthBypassRequest } from "./localAuth";

const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function requireUser(
  request: Request,
): Promise<{ user: User; localBypass?: boolean } | NextResponse> {
  if (isLocalAuthBypassRequest(request)) {
    return {
      user: createLocalAuthUser(process.env.LOCAL_AUTH_USER_ID),
      localBypass: true,
    };
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) {
    return NextResponse.json(
      { error: "Du må være logget inn." },
      { status: 401 },
    );
  }

  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ error: "Ugyldig innlogging." }, { status: 401 });
  }

  return { user: data.user };
}
