"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "professional" | "client";
  isVerified: boolean;
  accountType?: "individual" | "community" | "member" | null;
  parentAccountId?: string | null;
}

export function useCurrentUser(redirectOnFail = true) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data && redirectOnFail) { window.location.href = "/login"; return; }
        setUser(data);
      })
      .catch(() => { if (redirectOnFail) window.location.href = "/login"; })
      .finally(() => setLoading(false));
  }, [redirectOnFail]);

  return { user, loading };
}

export { API };
