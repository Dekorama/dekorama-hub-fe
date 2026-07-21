"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { readApiError } from "@/features/admin/utils/readApiError";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";
import {
  defaultSupplierDocumentType,
  getClientDocumentLabel,
  getClientDocumentOptions,
  type MarketCode,
} from "@/shared/utils/market";
import type { ClientDocumentType, ClientLegalType } from "@/shared/utils/userLabels";

interface Family {
  code: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  prefix: string | null;
  familyCodes: string[];
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
  prefix: string;
  familyCodes: string[];
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
    prefix: "",
    familyCodes: [],
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
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(() => buildEmptyForm(market));
  const [saving, setSaving] = useState(false);

  const documentOptions = useMemo(
    () => getClientDocumentOptions(market, form.legalType),
    [market, form.legalType],
  );

  const familyNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of families) map.set(f.code, f.name);
    return map;
  }, [families]);

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

  const fetchFamilies = useCallback(async () => {
    const res = await fetch(`${API}/products/families/all`, { credentials: "include" });
    if (!res.ok) return;
    setFamilies((await res.json()) as Family[]);
  }, []);

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
    if (user?.role === "admin") {
      void fetchSuppliers();
      void fetchFamilies();
    }
  }, [user, fetchSuppliers, fetchFamilies]);

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
      prefix: s.prefix ?? "",
      familyCodes: s.familyCodes ?? [],
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
    const prefix = form.prefix.trim().toUpperCase();
    if (prefix && prefix.length !== 3) {
      showError("Prefijo SKU: 3 caracteres o vacío (auto)");
      return;
    }
    if (form.familyCodes.length === 0) {
      showError("Selecciona al menos una familia");
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
          ...(prefix ? { prefix } : editing ? {} : {}),
          familyCodes: form.familyCodes,
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

  function handleFamiliesChange(event: SelectChangeEvent<string[]>) {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      familyCodes: typeof value === "string" ? value.split(",") : value,
    }));
  }

  return (
    <>
      <AdminPageHeader
        title="Proveedores"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Nuevo
          </Button>
        }
      />

      <ResponsiveTable minWidth={720}>
        <TableHead>
          <TableRow>
            <TableCell>Prefijo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Familias</TableCell>
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
          {loading ? (
            <TableLoadingRow colSpan={10} />
          ) : suppliers.length === 0 ? (
            <TableEmptyRow colSpan={10} message="No hay proveedores" />
          ) : (
            suppliers.map((s) => {
              const emails = allEmails(s);
              const phones = allPhones(s);
              const docLabel = s.documentType
                ? getClientDocumentLabel(s.documentType)
                : null;
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <Typography fontFamily="monospace" fontWeight={600}>
                      {s.prefix ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    {(s.familyCodes ?? []).length === 0
                      ? "—"
                      : (s.familyCodes ?? [])
                          .map((c) => familyNameByCode.get(c) ?? c)
                          .join(", ")}
                  </TableCell>
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
              label="Prefijo SKU (3 letras)"
              value={form.prefix}
              onChange={(e) =>
                setForm({
                  ...form,
                  prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3),
                })
              }
              fullWidth
              helperText={
                editing
                  ? "SKU del producto: PREFIJO-00001"
                  : "Opcional. Si vacío, se genera desde el nombre."
              }
              inputProps={{ maxLength: 3, style: { fontFamily: "monospace", letterSpacing: 2 } }}
            />

            <FormControl fullWidth required>
              <InputLabel id="supplier-families-label">Familias</InputLabel>
              <Select
                labelId="supplier-families-label"
                multiple
                value={form.familyCodes}
                onChange={handleFamiliesChange}
                input={<OutlinedInput label="Familias" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((code) => (
                      <Chip
                        key={code}
                        size="small"
                        label={familyNameByCode.get(code) ?? code}
                      />
                    ))}
                  </Box>
                )}
              >
                {families.map((f) => (
                  <MenuItem key={f.code} value={f.code}>
                    {f.name} ({f.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
