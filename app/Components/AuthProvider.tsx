"use client";

import { Alert, Box, CircularProgress } from "@mui/material";
import type { Session, User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createLocalAuthUser,
  isLocalAuthBypassEnabled,
  LOCAL_AUTH_BYPASS_TOKEN,
} from "../lib/localAuth";
import { supabase } from "../lib/supabaseClient";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  error: string;
  customerAttentionCount: number;
  adminAttentionCount: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const localAuthBypassEnabled = isLocalAuthBypassEnabled();
const localAuthUser = createLocalAuthUser();
const localAuthSession: Session = {
  access_token: LOCAL_AUTH_BYPASS_TOKEN,
  token_type: "bearer",
  expires_in: 31_536_000,
  expires_at: 4_102_444_800,
  refresh_token: "",
  user: localAuthUser,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(
    localAuthBypassEnabled ? localAuthSession : null,
  );
  const [role, setRole] = useState<string | null>(
    localAuthBypassEnabled ? "King" : null,
  );
  const [loading, setLoading] = useState(!localAuthBypassEnabled);
  const [error, setError] = useState("");
  const [customerAttentionCount, setCustomerAttentionCount] = useState(0);
  const [adminAttentionCount, setAdminAttentionCount] = useState(0);
  const requestId = useRef(0);
  const inFlightToken = useRef<string | null>(null);
  const loadedToken = useRef<string | null>(null);

  useEffect(() => {
    if (localAuthBypassEnabled) return;

    let active = true;

    const applySession = async (
      nextSession: Session | null,
      forceRefresh = false,
    ) => {
      setSession(nextSession);

      if (!nextSession) {
        requestId.current += 1;
        inFlightToken.current = null;
        loadedToken.current = null;
        setRole("");
        setError("");
        setCustomerAttentionCount(0);
        setAdminAttentionCount(0);
        setLoading(false);
        return;
      }

      const token = nextSession.access_token;
      if (
        !forceRefresh &&
        (inFlightToken.current === token || loadedToken.current === token)
      ) {
        return;
      }

      const currentRequest = ++requestId.current;
      inFlightToken.current = token;

      try {
        const response = await fetch("/api/attention", {
          headers: {
            Authorization: `Bearer ${nextSession.access_token}`,
          },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Profile request failed");

        const accessState = (await response.json()) as {
          role?: string;
          customerAttentionCount?: number;
          adminAttentionCount?: number;
        };
        if (active && currentRequest === requestId.current) {
          loadedToken.current = token;
          setRole(accessState.role ?? "");
          setCustomerAttentionCount(accessState.customerAttentionCount ?? 0);
          setAdminAttentionCount(accessState.adminAttentionCount ?? 0);
          setError("");
        }
      } catch {
        if (active && currentRequest === requestId.current) {
          setRole(null);
          setError("Kunne ikke kontrollere tilgangen din.");
        }
      } finally {
        if (inFlightToken.current === token) inFlightToken.current = null;
        if (active && currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (active) void applySession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (active) void applySession(nextSession);
      },
    );

    const refreshAccessState = () => {
      if (document.hidden) return;
      void supabase.auth.getSession().then(({ data }) => {
        if (active && data.session) void applySession(data.session, true);
      });
    };
    const intervalId = window.setInterval(refreshAccessState, 5 * 60_000);
    window.addEventListener("focus", refreshAccessState);
    window.addEventListener("attention-updated", refreshAccessState);
    document.addEventListener("visibilitychange", refreshAccessState);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshAccessState);
      window.removeEventListener("attention-updated", refreshAccessState);
      document.removeEventListener("visibilitychange", refreshAccessState);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        error,
        customerAttentionCount,
        adminAttentionCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { user, role, loading, error } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const authorized = role !== null && roles.includes(role);

  useEffect(() => {
    if (loading || error) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (!authorized) {
      router.replace("/");
    }
  }, [authorized, error, loading, pathname, router, user]);

  if (error) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", mt: 8, px: 2 }}>
        <Alert severity="error">{error} Last siden på nytt.</Alert>
      </Box>
    );
  }

  if (loading || !authorized) {
    return (
      <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}>
        <CircularProgress aria-label="Kontrollerer tilgang" />
      </Box>
    );
  }

  return children;
}
