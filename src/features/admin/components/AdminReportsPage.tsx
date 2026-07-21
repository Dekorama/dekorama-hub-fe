"use client";

import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Paper, Stack, Typography,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ExportButton } from "@/features/admin/components/AdminNav";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";

interface Dashboard {
  monthlySales: number;
  openOrders: number;
  pendingSolicitudes: number;
  topProducts: { sku: string; totalSold: string }[];
}

interface Conversion {
  solicitudes: number;
  proformas: number;
  signed: number;
  orders: number;
  invoices: number;
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${amount.toFixed(2)}`;
}

export function AdminReportsPage() {
  const { user } = useCurrentUser();
  const { market, config } = useAdminMarket();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;
    setLoading(true);
    Promise.all([
      fetch(adminApiUrl("/admin/reports/dashboard", market), { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null)),
      fetch(adminApiUrl("/admin/reports/conversion", market), { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([dash, conv]) => {
        setDashboard(dash);
        setConversion(conv);
      })
      .finally(() => setLoading(false));
  }, [user, market]);

  const chartData = dashboard?.topProducts.map((p) => ({
    sku: p.sku,
    sold: Number(p.totalSold),
  })) ?? [];

  return (
    <>
      <AdminPageHeader
        title={`Estadísticas — ${config.label}`}
        actions={
          <ExportButton
            endpoint="/admin/exports/sales-ledger"
            label="Libro ventas Excel"
            market={market}
          />
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center", flex: 1 }}>
              <Typography variant="h4">
                {formatCurrency(dashboard?.monthlySales ?? 0, config.currency)}
              </Typography>
              <Typography color="text.secondary">Ventas del mes</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: "center", flex: 1 }}>
              <Typography variant="h4">{dashboard?.openOrders ?? 0}</Typography>
              <Typography color="text.secondary">Pedidos abiertos</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: "center", flex: 1 }}>
              <Typography variant="h4">{dashboard?.pendingSolicitudes ?? 0}</Typography>
              <Typography color="text.secondary">Solicitudes pendientes</Typography>
            </Paper>
          </Stack>
          {conversion && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Embudo de conversión</Typography>
              <Typography>
                Solicitudes: {conversion.solicitudes} → Proformas: {conversion.proformas} → Firmadas:{" "}
                {conversion.signed} → Pedidos: {conversion.orders} → Facturas pagadas:{" "}
                {conversion.invoices}
              </Typography>
            </Paper>
          )}
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Top productos</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sku" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sold" fill="#ff6f00" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}
    </>
  );
}
