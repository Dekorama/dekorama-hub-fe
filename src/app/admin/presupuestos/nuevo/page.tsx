"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useCurrentUser, API } from "../../../hooks/useCurrentUser";
import { useAdminMarket } from "../../context/AdminMarketContext";
import { adminApiUrl } from "../../utils/adminApi";
import { getClientDocumentOptions, isMarketCode } from "../../../utils/market";
import type { ClientDocumentType, ClientLegalType } from "../../../utils/userLabels";

interface ClientOption {
  id: string;
  name: string;
  email: string;
  taxRate: number | null;
  taxExempt: boolean;
  country: string;
  profileData?: Record<string, unknown> | null;
}

interface ProductOption {
  sku: string;
  name: string;
  pvpPrice: number;
}

interface LineDraft {
  key: string;
  productSku: string;
  productName: string;
  quantity: number;
  suggestedPrice: number;
}

interface SectionDraft {
  key: string;
  name: string;
  materials: LineDraft[];
}

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyLine(): LineDraft {
  return {
    key: newKey(),
    productSku: "",
    productName: "",
    quantity: 1,
    suggestedPrice: 0,
  };
}

function emptySection(index: number): SectionDraft {
  return {
    key: newKey(),
    name: `Sección ${index + 1}`,
    materials: [emptyLine()],
  };
}

interface NewClientForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  legalType: ClientLegalType;
  documentType: ClientDocumentType;
  documentNumber: string;
  address: string;
  city: string;
  province: string;
  taxRate: number;
  taxExempt: boolean;
}

function emptyNewClient(taxRate: number, market: string): NewClientForm {
  const code = isMarketCode(market) ? market : "VE";
  const docs = getClientDocumentOptions(code, "particular");
  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    legalType: "particular",
    documentType: docs[0]?.value ?? "cedula",
    documentNumber: "",
    address: "",
    city: "",
    province: "",
    taxRate,
    taxExempt: false,
  };
}

function buildClientProfileData(form: NewClientForm): Record<string, string> {
  const data: Record<string, string> = {
    legalType: form.legalType,
  };
  if (form.phone.trim()) data.phone = form.phone.trim();
  if (form.documentNumber.trim()) {
    data.documentType = form.documentType;
    data.documentNumber = form.documentNumber.trim();
  }
  if (form.address.trim()) data.address = form.address.trim();
  if (form.city.trim()) data.city = form.city.trim();
  if (form.province.trim()) data.province = form.province.trim();
  return data;
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore
  }
  return fallback;
}

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { market, config } = useAdminMarket();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [title, setTitle] = useState("");
  const [taxRate, setTaxRate] = useState(config.taxRate);
  const [laborCost, setLaborCost] = useState(0);
  const [externalComment, setExternalComment] = useState("");
  const [internalComment, setInternalComment] = useState("");
  const [sections, setSections] = useState<SectionDraft[]>([emptySection(0)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState<NewClientForm>(() =>
    emptyNewClient(config.taxRate, market),
  );

  const documentOptions = useMemo(
    () =>
      getClientDocumentOptions(
        isMarketCode(market) ? market : "VE",
        newClient.legalType,
      ),
    [market, newClient.legalType],
  );

  useEffect(() => {
    setNewClient((prev) => {
      const options = getClientDocumentOptions(
        isMarketCode(market) ? market : "VE",
        prev.legalType,
      );
      const stillValid = options.some((o) => o.value === prev.documentType);
      if (stillValid) return prev;
      return { ...prev, documentType: options[0]?.value ?? prev.documentType };
    });
  }, [market]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    void (async () => {
      const [cRes, pRes] = await Promise.all([
        fetch(adminApiUrl("/admin/users?role=client", market), { credentials: "include" }),
        fetch(adminApiUrl("/products", market), { credentials: "include" }),
      ]);
      if (cRes.ok) setClients(await cRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    })();
  }, [user, market]);

  useEffect(() => {
    if (!selectedClient) {
      setTaxRate(config.taxRate);
      return;
    }
    if (selectedClient.taxExempt) {
      setTaxRate(0);
      return;
    }
    setTaxRate(
      selectedClient.taxRate !== undefined && selectedClient.taxRate !== null
        ? Number(selectedClient.taxRate)
        : config.taxRate,
    );
  }, [selectedClient, config.taxRate]);

  const subtotal = useMemo(() => {
    const materials = sections.reduce(
      (sum, s) =>
        sum +
        s.materials.reduce(
          (lineSum, m) => lineSum + m.quantity * Number(m.suggestedPrice),
          0,
        ),
      0,
    );
    return materials + Number(laborCost || 0);
  }, [sections, laborCost]);

  const taxAmount = subtotal * (Number(taxRate) / 100);
  const total = subtotal + taxAmount;

  function updateSection(index: number, patch: Partial<SectionDraft>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function updateLine(sectionIndex: number, lineIndex: number, patch: Partial<LineDraft>) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        const materials = s.materials.map((m, j) =>
          j === lineIndex ? { ...m, ...patch } : m,
        );
        return { ...s, materials };
      }),
    );
  }

  function applyProduct(sectionIndex: number, lineIndex: number, product: ProductOption | null) {
    if (!product) {
      updateLine(sectionIndex, lineIndex, {
        productSku: "",
        productName: "",
        suggestedPrice: 0,
      });
      return;
    }
    updateLine(sectionIndex, lineIndex, {
      productSku: product.sku,
      productName: product.name,
      suggestedPrice: Number(product.pvpPrice),
    });
  }

  async function handleCreateClient() {
    setCreatingClient(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newClient.name,
          email: newClient.email,
          password: newClient.password,
          country: market,
          taxRate: newClient.taxExempt ? 0 : newClient.taxRate,
          taxExempt: newClient.taxExempt,
          profileData: buildClientProfileData(newClient),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "No se pudo crear el cliente"));
      const created = (await res.json()) as ClientOption;
      setClients((prev) => [created, ...prev]);
      setSelectedClient(created);
      setClientDialogOpen(false);
      setNewClient(emptyNewClient(config.taxRate, market));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleSave() {
    if (!selectedClient) {
      setError("Selecciona o crea un cliente");
      return;
    }
    const hasLines = sections.some((s) =>
      s.materials.some((m) => m.productSku && m.quantity > 0),
    );
    if (!hasLines) {
      setError("Agrega al menos una línea de producto");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/proposals/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientId: selectedClient.id,
          title: title || undefined,
          taxRate,
          laborCost,
          externalComment: externalComment || undefined,
          internalComment: internalComment || undefined,
          sections: sections.map((s, i) => ({
            name: s.name,
            sortOrder: i,
            materials: s.materials
              .filter((m) => m.productSku)
              .map((m) => ({
                productSku: m.productSku,
                productName: m.productName,
                quantity: m.quantity,
                suggestedPrice: m.suggestedPrice,
              })),
          })),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "No se pudo crear el presupuesto"));
      const proposal = (await res.json()) as { id: string };
      router.push(`/admin/presupuestos/${proposal.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          component={Link}
          href="/admin/presupuestos"
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          Volver
        </Button>
        <Typography variant="h5">Nuevo presupuesto</Typography>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Cliente
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
          <Autocomplete
            sx={{ flex: 1 }}
            options={clients}
            value={selectedClient}
            onChange={(_, value) => setSelectedClient(value)}
            getOptionLabel={(c) => `${c.name} (${c.email})`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label="Buscar cliente" size="small" />
            )}
          />
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setClientDialogOpen(true)}>
            Nuevo cliente
          </Button>
        </Stack>
        {selectedClient && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedClient.name} · {selectedClient.email}
              {selectedClient.profileData &&
              typeof selectedClient.profileData.phone === "string"
                ? ` · ${selectedClient.profileData.phone}`
                : ""}
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Datos del presupuesto
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Título"
            size="small"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label={`${config.taxLabel} %`}
            type="number"
            size="small"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ width: { sm: 140 } }}
          />
          <TextField
            label="Mano de obra"
            type="number"
            size="small"
            value={laborCost}
            onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ width: { sm: 160 } }}
          />
        </Stack>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Comentario externo (cliente)"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={externalComment}
            onChange={(e) => setExternalComment(e.target.value)}
          />
          <TextField
            label="Comentario interno"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={internalComment}
            onChange={(e) => setInternalComment(e.target.value)}
          />
        </Stack>
      </Paper>

      {sections.map((section, sectionIndex) => (
        <Paper key={section.key} sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <TextField
              label="Sección"
              size="small"
              value={section.name}
              onChange={(e) => updateSection(sectionIndex, { name: e.target.value })}
              sx={{ flex: 1 }}
            />
            <IconButton
              aria-label="Eliminar sección"
              disabled={sections.length === 1}
              onClick={() =>
                setSections((prev) => prev.filter((_, i) => i !== sectionIndex))
              }
            >
              <DeleteIcon />
            </IconButton>
          </Stack>

          <Stack spacing={1.5}>
            {section.materials.map((line, lineIndex) => (
              <Stack
                key={line.key}
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems={{ md: "center" }}
              >
                <Autocomplete
                  sx={{ flex: 2, minWidth: 220 }}
                  options={products}
                  value={products.find((p) => p.sku === line.productSku) ?? null}
                  onChange={(_, product) => applyProduct(sectionIndex, lineIndex, product)}
                  getOptionLabel={(p) => `${p.sku} — ${p.name}`}
                  isOptionEqualToValue={(a, b) => a.sku === b.sku}
                  renderInput={(params) => (
                    <TextField {...params} label="Producto" size="small" />
                  )}
                />
                <TextField
                  label="Cant."
                  type="number"
                  size="small"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(sectionIndex, lineIndex, {
                      quantity: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  inputProps={{ min: 1 }}
                  sx={{ width: { md: 90 } }}
                />
                <TextField
                  label="Precio"
                  type="number"
                  size="small"
                  value={line.suggestedPrice}
                  onChange={(e) =>
                    updateLine(sectionIndex, lineIndex, {
                      suggestedPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ width: { md: 120 } }}
                />
                <Typography sx={{ minWidth: 90 }} align="right">
                  ${(line.quantity * Number(line.suggestedPrice)).toFixed(2)}
                </Typography>
                <IconButton
                  aria-label="Eliminar línea"
                  disabled={section.materials.length === 1}
                  onClick={() =>
                    updateSection(sectionIndex, {
                      materials: section.materials.filter((_, j) => j !== lineIndex),
                    })
                  }
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>

          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{ mt: 1.5 }}
            onClick={() =>
              updateSection(sectionIndex, {
                materials: [...section.materials, emptyLine()],
              })
            }
          >
            Agregar línea
          </Button>
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setSections((prev) => [...prev, emptySection(prev.length)])}
      >
        Agregar sección
      </Button>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={0.5} alignItems="flex-end">
          <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
          <Typography>
            {config.taxLabel} ({taxRate}%): ${taxAmount.toFixed(2)}
          </Typography>
          <Typography fontWeight="bold">Total: ${total.toFixed(2)}</Typography>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button component={Link} href="/admin/presupuestos" disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Crear presupuesto"}
          </Button>
        </Stack>
      </Paper>

      <Dialog open={clientDialogOpen} onClose={() => setClientDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Tipo"
              size="small"
              value={newClient.legalType}
              onChange={(e) => {
                const legalType = e.target.value as ClientLegalType;
                const options = getClientDocumentOptions(
                  isMarketCode(market) ? market : "VE",
                  legalType,
                );
                setNewClient((c) => ({
                  ...c,
                  legalType,
                  documentType: options[0]?.value ?? c.documentType,
                }));
              }}
            >
              <MenuItem value="particular">Particular</MenuItem>
              <MenuItem value="empresa">Empresa</MenuItem>
            </TextField>
            <TextField
              label={newClient.legalType === "empresa" ? "Razón social" : "Nombre"}
              size="small"
              required
              value={newClient.name}
              onChange={(e) => setNewClient((c) => ({ ...c, name: e.target.value }))}
            />
            <TextField
              label="Email"
              size="small"
              type="email"
              required
              value={newClient.email}
              onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Documento"
                size="small"
                value={newClient.documentType}
                onChange={(e) =>
                  setNewClient((c) => ({
                    ...c,
                    documentType: e.target.value as ClientDocumentType,
                  }))
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
                size="small"
                fullWidth
                value={newClient.documentNumber}
                onChange={(e) =>
                  setNewClient((c) => ({ ...c, documentNumber: e.target.value }))
                }
              />
            </Stack>
            <TextField
              label="Teléfono"
              size="small"
              value={newClient.phone}
              onChange={(e) => setNewClient((c) => ({ ...c, phone: e.target.value }))}
            />
            <TextField
              label="Dirección"
              size="small"
              value={newClient.address}
              onChange={(e) => setNewClient((c) => ({ ...c, address: e.target.value }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Ciudad"
                size="small"
                fullWidth
                value={newClient.city}
                onChange={(e) => setNewClient((c) => ({ ...c, city: e.target.value }))}
              />
              <TextField
                label="Provincia"
                size="small"
                fullWidth
                value={newClient.province}
                onChange={(e) => setNewClient((c) => ({ ...c, province: e.target.value }))}
              />
            </Stack>
            <TextField
              label="Contraseña"
              size="small"
              type="password"
              required
              value={newClient.password}
              onChange={(e) => setNewClient((c) => ({ ...c, password: e.target.value }))}
              helperText="Mínimo 8 caracteres. Compártela al cliente por canal seguro."
              inputProps={{ minLength: 8 }}
            />
            <TextField
              select
              label="Exento de IVA"
              size="small"
              value={newClient.taxExempt ? "yes" : "no"}
              onChange={(e) =>
                setNewClient((c) => ({ ...c, taxExempt: e.target.value === "yes" }))
              }
            >
              <MenuItem value="no">No</MenuItem>
              <MenuItem value="yes">Sí</MenuItem>
            </TextField>
            {!newClient.taxExempt && (
              <TextField
                label={`${config.taxLabel} %`}
                type="number"
                size="small"
                value={newClient.taxRate}
                onChange={(e) =>
                  setNewClient((c) => ({
                    ...c,
                    taxRate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientDialogOpen(false)} disabled={creatingClient}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateClient}
            disabled={creatingClient || !newClient.name || !newClient.email}
          >
            {creatingClient ? <CircularProgress size={18} color="inherit" /> : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
