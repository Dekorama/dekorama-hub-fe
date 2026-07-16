"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import { useAppSnackbar } from "../../hooks/useAppSnackbar";
import { useAdminMarket } from "../context/AdminMarketContext";
import { adminApiUrl } from "../utils/adminApi";
import { readApiError } from "../utils/readApiError";

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  accountNumber: string | null;
  taxRate: number | null;
  taxExempt: boolean;
  isActive: boolean;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  accountNumber: "",
  taxRate: "",
  taxExempt: false,
};

export default function ProveedoresAdminPage() {
  const { user } = useCurrentUser();
  const { market } = useAdminMarket();
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(adminApiUrl("/suppliers?includeInactive=true", market), {
        credentials: "include",
      });
      if (!res.ok) {
        showError(await readApiError(res, "Error al cargar proveedores"));
        return;
      }
      setSuppliers((await res.json()) as Supplier[]);
    } finally {
      setLoading(false);
    }
  }, [market, showError]);

  useEffect(() => {
    if (user?.role === "admin") void fetchSuppliers();
  }, [user, fetchSuppliers]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone ?? "",
      address: s.address ?? "",
      notes: s.notes ?? "",
      accountNumber: s.accountNumber ?? "",
      taxRate: s.taxRate != null ? String(Number(s.taxRate)) : "",
      taxExempt: !!s.taxExempt,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      showError("Nombre y email son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const taxRateNum = form.taxRate.trim() === "" ? null : parseFloat(form.taxRate);
      const url = editing ? `${API}/suppliers/${editing.id}` : `${API}/suppliers`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || undefined,
          address: form.address || undefined,
          notes: form.notes || undefined,
          accountNumber: form.accountNumber.trim() || null,
          taxExempt: form.taxExempt,
          taxRate: form.taxExempt ? 0 : taxRateNum,
          market,
        }),
      });

      if (!res.ok) {
        showError(await readApiError(res, "Error al guardar proveedor"));
        return;
      }

      showSuccess(editing ? "Proveedor actualizado" : "Proveedor creado");
      setDialogOpen(false);
      void fetchSuppliers();
    } catch {
      showError("Error al guardar proveedor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Proveedores</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Nuevo
        </Button>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Cuenta</TableCell>
                <TableCell>IVA</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay proveedores</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone ?? "N/D"}</TableCell>
                    <TableCell>{s.accountNumber ?? "—"}</TableCell>
                    <TableCell>
                      {s.taxExempt
                        ? "Exento"
                        : s.taxRate != null
                          ? `${Number(s.taxRate)}%`
                          : "Mercado"}
                    </TableCell>
                    <TableCell>{s.isActive ? "Sí" : "No"}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEdit(s)} aria-label="Editar">
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Dirección"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth
            />
            <TextField
              label="Número de cuenta"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              fullWidth
              placeholder="IBAN / cuenta bancaria"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.taxExempt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      taxExempt: e.target.checked,
                      taxRate: e.target.checked ? "0" : form.taxRate,
                    })
                  }
                />
              }
              label="Exento de IVA"
            />
            <TextField
              label="IVA (%)"
              type="number"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              fullWidth
              disabled={form.taxExempt}
              helperText="Vacío = IVA del mercado. Exento fuerza 0%."
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarHost />
    </>
  );
}
