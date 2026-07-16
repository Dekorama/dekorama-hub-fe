"use client";

import { useEffect, useState } from "react";
import {
  Paper, Stack, Typography,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ExportButton } from "../components/AdminNav";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import { useAdminMarket } from "../context/AdminMarketContext";
import { adminApiUrl } from "../utils/adminApi";

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

export default function ReportesAdminPage() {
  const { user } = useCurrentUser();
  const { market, config } = useAdminMarket();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [conversion, setConversion] = useState<Conversion | null>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      fetch(adminApiUrl("/admin/reports/dashboard", market), { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then(setDashboard);
      fetch(adminApiUrl("/admin/reports/conversion", market), { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then(setConversion);
    }
  }, [user, market]);

  const chartData = dashboard?.topProducts.map((p) => ({
    sku: p.sku,
    sold: Number(p.totalSold),
  })) ?? [];

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Estadísticas — {config.label}</Typography>
        <ExportButton endpoint="/admin/exports/sales-ledger" label="Libro ventas Excel" market={market} />
      </Stack>
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
          <Typography>Solicitudes: {conversion.solicitudes} → Proformas: {conversion.proformas} → Firmadas: {conversion.signed} → Pedidos: {conversion.orders} → Facturas pagadas: {conversion.invoices}</Typography>
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
  );
}
