"use client";

import { Alert, Box, CircularProgress } from "@mui/material";
import { ReactNode } from "react";
import { AdminNav } from "@/features/admin/components/AdminNav";
import { AdminMarketSwitcher } from "@/features/admin/components/AdminMarketSwitcher";
import { AdminMarketProvider } from "@/features/admin/context/AdminMarketContext";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useCurrentUser();

  if (!loading && user?.role !== "admin") {
    return <Alert severity="error">Acceso denegado. Solo administradores.</Alert>;
  }

  return (
    <AdminMarketProvider>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Box sx={{ px: { xs: 0, sm: 0 }, pt: 0, flexShrink: 0 }}>
          <AdminMarketSwitcher />
          <AdminNav />
        </Box>
        <Box sx={{ flex: 1, pt: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            children
          )}
        </Box>
      </Box>
    </AdminMarketProvider>
  );
}
