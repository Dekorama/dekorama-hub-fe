"use client";

import { useEffect, useState } from "react";

/**
 * Always same-origin `/api` → Next route proxy → Nest.
 * Absolute URLs (onrender) break session cookies on iOS Chrome/Safari.
 */
export const API = "/api";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "professional" | "client";
  isVerified: boolean;
  country: "VE" | "ES";
  accountType?: "individual" | "community" | "member" | null;
  parentAccountId?: string | null;
  profileData?: Record<string, unknown> | null;
  createdAt?: string;
}

export function useCurrentUser(redirectOnFail = true) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/auth/me`, { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return null;
        const text = await r.text();
        if (!text) return null;
        try {
          return JSON.parse(text) as CurrentUser | null;
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (cancelled) return;
        if (!data && redirectOnFail) {
          window.location.replace("/login");
          return;
        }
        setUser(data);
      })
      .catch(() => {
        if (cancelled) return;
        if (redirectOnFail) window.location.replace("/login");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [redirectOnFail]);

  return { user, loading };
}
