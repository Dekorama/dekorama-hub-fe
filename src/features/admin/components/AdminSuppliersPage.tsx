"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  MenuItem,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { readApiError } from "@/features/admin/utils/readApiError";
import { ResponsiveTable } from "@/shared/ui";
import {
  defaultSupplierDocumentType,
  getClientDocumentLabel,
  getClientDocumentOptions,
  type MarketCode,
} from "@/shared/utils/market";
import type { ClientDocumentType, ClientLegalType } from "@/shared/utils/userLabels";

interface Supplier {
  id: string;
  name: string;
  legalType: ClientLegalType | null;
  documentType: ClientDocumentType | null;
  documentNumber: string | null;
  email: string;
  emails: string[] | null;
  phone: string | null;
  phones: string[] | null;
  address: string | null;
  notes: string | null;
  accountNumber: string | null;
  taxRate: number | null;
  taxExempt: boolean;
  isActive: boolean;
}

interface SupplierForm {
  name: string;
  legalType: ClientLegalType;
  documentType: ClientDocumentType;
  documentNumber: string;
  emails: string[];
  phones: string[];
  address: string;
  notes: string;
  accountNumber: string;
  taxRate: string;
  taxExempt: boolean;
}

function buildEmptyForm(market: MarketCode): SupplierForm {
  return {
    name: "",
    legalType: "empresa",
    documentType: defaultSupplierDocumentType(market),
    documentNumber: "",
    emails: [""],
    phones: [""],
    address: "",
    notes: "",
    accountNumber: "",
    taxRate: "",
    taxExempt: false,
  };
}

function allEmails(s: Supplier): string[] {
  return [s.email, ...(s.emails ?? [])].filter(Boolean);
}

function allPhones(s: Supplier): string[] {
  return [s.phone, ...(s.phones ?? [])].filter((p): p is string => !!p?.trim());
}

export function AdminSuppliersPage() {
  const { user } = useCurrentUser();
  const { market } = useAdminMarket();
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(() => buildEmptyForm(market));
  const [saving, setSaving] = useState(false);

  const documentOptions = useMemo(
    () => getClientDocumentOptions(market, form.legalType),
    [market, form.legalType],
  );

  useEffect(() => {
    setForm((prev) => {
      const stillValid = documentOptions.some((o) => o.value === prev.documentType);
      if (stillValid) return prev;
      return {
        ...prev,
        documentType: documentOptions[0]?.value ?? defaultSupplierDocumentType(market),
      };
    });
  }, [documentOptions, market]);

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
    setForm(buildEmptyForm(market));
    setDialogOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    const emails = allEmails(s);
    const phones = allPhones(s);
    const legalType: ClientLegalType = s.legalType === "particular" ? "particular" : "empresa";
    const options = getClientDocumentOptions(market, legalType);
    const documentType =
      s.documentType && options.some((o) => o.value === s.documentType)
        ? s.documentType
        : (options[0]?.value ?? defaultSupplierDocumentType(market));
    setForm({
      name: s.name,
      legalType,
      documentType,
      documentNumber: s.documentNumber ?? "",
      emails: emails.length > 0 ? emails : [""],
      phones: phones.length > 0 ? phones : [""],
      address: s.address ?? "",
      notes: s.notes ?? "",
      accountNumber: s.accountNumber ?? "",
      taxRate: s.taxRate != null ? String(Number(s.taxRate)) : "",
      taxExempt: !!s.taxExempt,
    });
    setDialogOpen(true);
  }

  function updateEmail(index: number, value: string) {
    setForm((prev) => {
      const emails = [...prev.emails];
      emails[index] = value;
      return { ...prev, emails };
    });
  }

  function addEmail() {
    setForm((prev) => ({ ...prev, emails: [...prev.emails, ""] }));
  }

  function removeEmail(index: number) {
    setForm((prev) => {
      if (prev.emails.length <= 1) return { ...prev, emails: [""] };
      return { ...prev, emails: prev.emails.filter((_, i) => i !== index) };
    });
  }

  function updatePhone(index: number, value: string) {
    setForm((prev) => {
      const phones = [...prev.phones];
      phones[index] = value;
      return { ...prev, phones };
    });
  }

  function addPhone() {
    setForm((prev) => ({ ...prev, phones: [...prev.phones, ""] }));
  }

  function removePhone(index: number) {
    setForm((prev) => {
      if (prev.phones.length <= 1) return { ...prev, phones: [""] };
      return { ...prev, phones: prev.phones.filter((_, i) => i !== index) };
    });
  }

  async function handleSave() {
    const trimmedEmails = form.emails.map((e) => e.trim()).filter(Boolean);
    if (!form.name.trim() || trimmedEmails.length === 0) {
      showError("Nombre y al menos un email son obligatorios");
      return;
    }

    const [primaryEmail, ...extraEmails] = trimmedEmails;
    const trimmedPhones = form.phones.map((p) => p.trim()).filter(Boolean);
    const [primaryPhone, ...extraPhones] = trimmedPhones;

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
          legalType: form.legalType,
          documentType: form.documentNumber.trim() ? form.documentType : null,
          documentNumber: form.documentNumber.trim() || null,
          email: primaryEmail,
          emails: extraEmails,
          phone: primaryPhone || undefined,
          phones: extraPhones,
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
        <ResponsiveTable minWidth={720} paperSx={{ borderRadius: 3 }}>
          <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Documento</TableCell>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay proveedores</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((s) => {
                  const emails = allEmails(s);
                  const phones = allPhones(s);
                  const docLabel = s.documentType
                    ? getClientDocumentLabel(s.documentType)
                    : null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>
                        {s.documentNumber
                          ? `${docLabel ?? "Doc"} ${s.documentNumber}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {emails.length === 0
                          ? "N/D"
                          : emails.map((email) => (
                              <Typography key={email} variant="body2" component="div">
                                {email}
                              </Typography>
                            ))}
                      </TableCell>
                      <TableCell>
                        {phones.length === 0
                          ? "N/D"
                          : phones.map((phone) => (
                              <Typography key={phone} variant="body2" component="div">
                                {phone}
                              </Typography>
                            ))}
                      </TableCell>
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
                  );
                })
              )}
            </TableBody>
        </ResponsiveTable>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre / Razón social"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              select
              label="Tipo"
              value={form.legalType}
              onChange={(e) => {
                const legalType = e.target.value as ClientLegalType;
                const options = getClientDocumentOptions(market, legalType);
                setForm((prev) => ({
                  ...prev,
                  legalType,
                  documentType: options[0]?.value ?? prev.documentType,
                }));
              }}
              fullWidth
            >
              <MenuItem value="empresa">Empresa</MenuItem>
              <MenuItem value="particular">Particular</MenuItem>
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Documento"
                value={form.documentType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    documentType: e.target.value as ClientDocumentType,
                  })
                }
                sx={{ minWidth: { sm: 140 } }}
              >
                {documentOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Número de documento"
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                fullWidth
                placeholder={
                  market === "VE"
                    ? form.documentType === "rif"
                      ? "J-12345678-9"
                      : "V-12345678"
                    : form.documentType === "cif" || form.documentType === "nif"
                      ? "B12345678"
                      : "12345678A"
                }
              />
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Emails</Typography>
              {form.emails.map((email, index) => (
                <Stack key={`email-${index}`} direction="row" spacing={1} alignItems="center">
                  <TextField
                    label={index === 0 ? "Email principal" : `Email ${index + 1}`}
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    required={index === 0}
                    fullWidth
                  />
                  <IconButton
                    onClick={() => removeEmail(index)}
                    disabled={form.emails.length === 1}
                    aria-label="Quitar email"
                  >
                    <Delete />
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<Add />} onClick={addEmail} size="small" sx={{ alignSelf: "flex-start" }}>
                Añadir email
              </Button>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Teléfonos</Typography>
              {form.phones.map((phone, index) => (
                <Stack key={`phone-${index}`} direction="row" spacing={1} alignItems="center">
                  <TextField
                    label={index === 0 ? "Teléfono principal" : `Teléfono ${index + 1}`}
                    value={phone}
                    onChange={(e) => updatePhone(index, e.target.value)}
                    fullWidth
                  />
                  <IconButton
                    onClick={() => removePhone(index)}
                    disabled={form.phones.length === 1}
                    aria-label="Quitar teléfono"
                  >
                    <Delete />
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<Add />} onClick={addPhone} size="small" sx={{ alignSelf: "flex-start" }}>
                Añadir teléfono
              </Button>
            </Stack>

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
