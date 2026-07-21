"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { getMarketLabel } from "@/shared/utils/market";

interface SettingsForm {
  label: string;
  storeName: string;
  taxRate: number;
  taxLabel: string;
  currency: string;
  locale: string;
  docLabel: string;
  paymentMethodsText: string;
}

export function AdminConfigPage() {
  const { market, config, refreshConfig } = useAdminMarket();
  const [form, setForm] = useState<SettingsForm>({
    label: config.label,
    storeName: config.storeName,
    taxRate: config.taxRate,
    taxLabel: config.taxLabel,
    currency: config.currency,
    locale: config.locale,
    docLabel: config.docLabel,
    paymentMethodsText: config.paymentMethods.join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setForm({
      label: config.label,
      storeName: config.storeName,
      taxRate: config.taxRate,
      taxLabel: config.taxLabel,
      currency: config.currency,
      locale: config.locale,
      docLabel: config.docLabel,
      paymentMethodsText: config.paymentMethods.join("\n"),
    });
  }, [config, market]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const paymentMethods = form.paymentMethodsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch(`${API}/admin/markets/${market}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          label: form.label,
          storeName: form.storeName,
          taxRate: form.taxRate,
          taxLabel: form.taxLabel,
          currency: form.currency,
          locale: form.locale,
          docLabel: form.docLabel,
          paymentMethods,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar la configuración");
      }

      await refreshConfig();
      setMessage({ type: "success", text: "Configuración guardada" });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title={`Configuración de ${getMarketLabel(market)}`}
        subtitle={`Cambia tienda con el selector superior. Los cambios aplican solo a ${config.storeName}.`}
      />

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <Stack spacing={2}>
          <TextField
            label="Nombre tienda"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            fullWidth
          />
          <TextField
            label="Etiqueta mercado"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label={`${form.taxLabel} (%)`}
              type="number"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Etiqueta impuesto"
              value={form.taxLabel}
              onChange={(e) => setForm({ ...form, taxLabel: e.target.value })}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Moneda"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              fullWidth
            />
            <TextField
              label="Locale"
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value })}
              fullWidth
            />
          </Stack>
          <TextField
            label="Documento fiscal (RIF / NIF)"
            value={form.docLabel}
            onChange={(e) => setForm({ ...form, docLabel: e.target.value })}
            fullWidth
          />
          <TextField
            label="Métodos de pago (uno por línea)"
            value={form.paymentMethodsText}
            onChange={(e) => setForm({ ...form, paymentMethodsText: e.target.value })}
            multiline
            minRows={3}
            fullWidth
          />
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar configuración"}
          </Button>
        </Stack>
      </Paper>
    </>
  );
}
