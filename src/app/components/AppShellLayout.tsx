"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { PageTitleProvider, usePageTitleState } from "./PageTitleContext";
import { useCurrentUser } from "../hooks/useCurrentUser";

const PUBLIC_ROUTES = new Set(["/", "/login", "/registro", "/venezuela"]);
const NO_AUTH_REDIRECT_PREFIXES = ["/profesionales/"];

function usesAppShell(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return false;
  return true;
}

function shouldRedirectOnAuthFail(pathname: string): boolean {
  if (!usesAppShell(pathname)) return false;
  return !NO_AUTH_REDIRECT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AppShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showShell = usesAppShell(pathname);
  const redirectOnFail = shouldRedirectOnAuthFail(pathname);
  const { user, loading } = useCurrentUser(redirectOnFail);
  const { title, setTitle } = usePageTitleState(pathname);

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <PageTitleProvider setTitle={setTitle}>
      <AppShell title={title} user={loading ? undefined : user}>
        {children}
      </AppShell>
    </PageTitleProvider>
  );
}
