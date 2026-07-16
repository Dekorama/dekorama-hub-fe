"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API, type CurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getMarketConfig,
  getMarketLabel,
  isMarketCode,
  MARKET_OPTIONS,
  type MarketCode,
  type MarketConfig,
} from "@/shared/utils/market";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { normalizeDashboardData, type AdminDashboardData } from "@/features/admin/types/dashboard";

const STORAGE_KEY = "dekorama_admin_market";

function formatMoney(amount: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${amount.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  href?: string;
  accent?: string;
}

function KpiCard({ label, value, hint, icon, href, accent = "#ff6f00" }: KpiCardProps) {
  const content = (
    <Paper
      sx={{
        p: 2.5,
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "box-shadow 0.2s",
        ...(href && {
          cursor: "pointer",
          "&:hover": { boxShadow: 4 },
        }),
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${accent}18`,
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box flex={1} minWidth={0}>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {label}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );

  if (!href) return content;
  return (
    <Box component={Link} href={href} sx={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </Box>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
      {children}
    </Typography>
  );
}

function FunnelStep({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Box flex={1} minWidth={120}>
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {value}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: "grey.200",
          "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: "#ff6f00" },
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {pct}% del inicio
      </Typography>
    </Box>
  );
}

export function AdminDashboard({ user }: { user: CurrentUser }) {
  const [market, setMarket] = useState<MarketCode>("VE");
  const [config, setConfig] = useState<MarketConfig>(getMarketConfig("VE"));
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const loadConfig = useCallback(async (code: MarketCode) => {
    try {
      const res = await fetch(`${API}/admin/markets/${code}/settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const settings = await res.json();
        setConfig({
          code: settings.code,
          label: settings.label,
          storeName: settings.storeName,
          taxRate: Number(settings.taxRate),
          taxLabel: settings.taxLabel,
          currency: settings.currency,
          locale: settings.locale,
          docLabel: settings.docLabel,
          paymentMethods: settings.paymentMethods ?? [],
        });
      } else {
        setConfig(getMarketConfig(code));
      }
    } catch {
      setConfig(getMarketConfig(code));
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isMarketCode(stored)) {
      setMarket(stored);
      void loadConfig(stored);
    }
    setMounted(true);
  }, [loadConfig]);

  const handleMarketChange = (next: MarketCode) => {
    setMarket(next);
    localStorage.setItem(STORAGE_KEY, next);
    void loadConfig(next);
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(adminApiUrl("/admin/reports/dashboard", market), {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          typeof body.message === "string"
            ? body.message
            : `Error ${res.status} al cargar KPIs`;
        throw new Error(msg);
      }
      const json: unknown = await res.json();
      const normalized = normalizeDashboardData(json);
      if (!normalized) throw new Error("Respuesta inválida del servidor");
      setData(normalized);
    } catch (err: unknown) {
      setData(null);
      setError(err instanceof Error ? err.message : "No se pudieron cargar los KPIs");
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    if (user.role !== "admin") return;
    void fetchDashboard();
  }, [user, market, fetchDashboard]);

  if (user.role !== "admin") return null;

  if (!mounted || loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "No se pudieron cargar los KPIs"}
        </Alert>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Verifica que la API esté en marcha ({API}) y que tu sesión de admin siga activa.
        </Typography>
        <Button variant="contained" onClick={() => void fetchDashboard()}>
          Reintentar
        </Button>
      </Paper>
    );
  }

  const chartData = data.topProducts.map((p) => ({
    sku: p.sku,
    sold: Number(p.totalSold),
  }));

  const funnelMax = Math.max(data.conversion.solicitudes, 1);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Dashboard de {config.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {config.storeName}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={market}
            onChange={(_, value: string | null) => {
              if (value === "VE" || value === "ES") handleMarketChange(value);
            }}
          >
            {MARKET_OPTIONS.map((code) => (
              <ToggleButton key={code} value={code} sx={{ px: 2 }}>
                {getMarketLabel(code)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Chip label={config.currency} size="small" variant="outlined" />
        </Stack>
      </Stack>

      <Box>
        <SectionTitle>Ventas y cobros</SectionTitle>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
            mt: 1,
          }}
        >
          <KpiCard
            label="Ventas del mes"
            value={formatMoney(data.sales.monthly, config.currency)}
            hint="Facturas pagadas"
            icon={<AttachMoneyIcon />}
            href="/admin/reportes"
            accent="#2e7d32"
          />
          <KpiCard
            label="Ventas acumuladas (año)"
            value={formatMoney(data.sales.ytd, config.currency)}
            icon={<TrendingUpIcon />}
            href="/admin/reportes"
            accent="#1565c0"
          />
          <KpiCard
            label="Por cobrar"
            value={formatMoney(data.sales.pendingCollection, config.currency)}
            hint={`${data.sales.pendingInvoices} facturas emitidas`}
            icon={<PendingActionsIcon />}
            href="/admin"
            accent="#ed6c02"
          />
          <KpiCard
            label="Pedidos abiertos"
            value={data.orders.open}
            hint={`${data.orders.total} pedidos totales`}
            icon={<ShoppingCartIcon />}
            href="/admin/pedidos"
          />
        </Box>
      </Box>

      <Box>
        <SectionTitle>Operaciones</SectionTitle>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
            mt: 1,
          }}
        >
          <KpiCard
            label="Solicitudes pendientes"
            value={data.proposals.pendingSolicitudes}
            icon={<RequestQuoteIcon />}
            href="/admin/presupuestos"
            accent="#9c27b0"
          />
          <KpiCard
            label="Propuestas abiertas"
            value={data.proposals.open}
            hint="En revisión del cliente"
            icon={<RequestQuoteIcon />}
            href="/admin/presupuestos"
          />
          <KpiCard
            label="PO proveedor pendientes"
            value={data.supplierOrders.pending}
            icon={<LocalShippingIcon />}
            href="/admin/pedidos-proveedor"
            accent="#0288d1"
          />
          <KpiCard
            label="Profesionales por verificar"
            value={data.users.pendingVerification}
            icon={<VerifiedUserIcon />}
            href="/admin"
            accent="#d32f2f"
          />
        </Box>
      </Box>

      <Box>
        <SectionTitle>Proyectos, usuarios y catálogo</SectionTitle>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
            mt: 1,
          }}
        >
          <KpiCard
            label="Proyectos activos"
            value={data.projects.open + data.projects.inProgress}
            hint={`${data.projects.public} públicos · ${data.projects.total} total`}
            icon={<FolderOpenIcon />}
            href="/admin/proyectos"
          />
          <KpiCard
            label="Clientes registrados"
            value={data.users.clients}
            icon={<PeopleIcon />}
            href="/admin"
            accent="#5e35b1"
          />
          <KpiCard
            label="Profesionales verificados"
            value={data.users.professionals}
            icon={<VerifiedUserIcon />}
            href="/admin"
            accent="#00897b"
          />
          <KpiCard
            label="Productos activos"
            value={data.catalog.activeProducts}
            hint={`${data.catalog.suppliers} proveedores`}
            icon={<InventoryIcon />}
            href="/admin/productos"
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Embudo comercial
          </Typography>
          <Stack spacing={2}>
            <FunnelStep
              label="Solicitudes"
              value={data.conversion.solicitudes}
              max={funnelMax}
            />
            <FunnelStep
              label="Proformas"
              value={data.conversion.proformas}
              max={funnelMax}
            />
            <FunnelStep label="Firmadas" value={data.conversion.signed} max={funnelMax} />
            <FunnelStep label="Pedidos" value={data.conversion.orders} max={funnelMax} />
            <FunnelStep
              label="Facturas pagadas"
              value={data.conversion.invoices}
              max={funnelMax}
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3, minHeight: 280 }}>
          <Typography variant="h6" fontWeight={700} mb={1}>
            Top productos vendidos
          </Typography>
          {chartData.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: "center" }}>
              Sin ventas registradas en este mercado
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sku" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="sold" fill="#ff6f00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>
    </Stack>
  );
}
