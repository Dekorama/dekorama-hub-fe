"use client";

import { useEffect, useState } from "react";

/**
 * Same-origin `/api` (Next rewrite → Nest) so session cookies are first-party.
 * Required for mobile Safari (blocks third-party cookies across netlify ↔ onrender).
 * Override with NEXT_PUBLIC_API_BASE_URL for direct BE access if needed.
 */
const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

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
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data && redirectOnFail) {
          window.location.href = "/login";
          return;
        }
        setUser(data);
      })
      .catch(() => {
        if (redirectOnFail) window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, [redirectOnFail]);

  return { user, loading };
}

export { API };
