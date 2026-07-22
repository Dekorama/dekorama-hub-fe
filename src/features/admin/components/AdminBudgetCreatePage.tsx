"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import {
  lineNetTotal,
  normalizeUnit,
  parsePackaging,
} from "@/features/admin/utils/lineItemMath";
import { PageToolbar, ResponsiveTable, ClearableNumberField } from "@/shared/ui";
import {
  BudgetLineRow,
  type BudgetLineEditable,
} from "@/features/admin/components/BudgetLineRow";
import {
  BudgetClientForm,
  buildClientProfileData,
  clientFormHasChanges,
  clientToFormValues,
  emptyBudgetClientForm,
  type BudgetClientFormValues,
} from "@/features/admin/components/BudgetClientForm";

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
  unit: string;
  piecesPerBox: number | null;
  unitPerPiece: number | null;
}

interface LineDraft extends BudgetLineEditable {
  key: string;
  productSku: string;
  productName: string;
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
    unit: "unidad",
    quantity: 1,
    suggestedPrice: 0,
    discountPct: 0,
    piecesPerBox: null,
    unitPerPiece: null,
    externalComment: "",
    internalComment: "",
  };
}

function emptySection(index: number): SectionDraft {
  return {
    key: newKey(),
    name: `Sección ${index + 1}`,
    materials: [emptyLine()],
  };
}

function mapProductOption(raw: Record<string, unknown>): ProductOption {
  const packaging = parsePackaging({
    piecesPerBox: raw.piecesPerBox as number | string | null | undefined,
    unitPerPiece: raw.unitPerPiece as number | string | null | undefined,
  });
  return {
    sku: String(raw.sku ?? ""),
    name: String(raw.name ?? ""),
    pvpPrice: Number(raw.pvpPrice) || 0,
    unit: normalizeUnit(typeof raw.unit === "string" ? raw.unit : "unidad"),
    piecesPerBox: packaging.piecesPerBox,
    unitPerPiece: packaging.unitPerPiece,
  };
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

/** Create table: Producto | qty | Ud | Precio | Dto | Subtotal | actions = 7 */
const CREATE_COMMENTS_COLSPAN = 7;

export function AdminBudgetCreatePage() {
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
  const [clientForm, setClientForm] = useState<BudgetClientFormValues>(() =>
    emptyBudgetClientForm(config.taxRate, market),
  );
  const [newClientForm, setNewClientForm] = useState<BudgetClientFormValues>(() =>
    emptyBudgetClientForm(config.taxRate, market),
  );

  useEffect(() => {
    setNewClientForm(emptyBudgetClientForm(config.taxRate, market));
  }, [market, config.taxRate]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    void (async () => {
      const [cRes, pRes] = await Promise.all([
        fetch(adminApiUrl("/admin/users?role=client", market), { credentials: "include" }),
        fetch(adminApiUrl("/products", market), { credentials: "include" }),
      ]);
      if (cRes.ok) setClients(await cRes.json());
      if (pRes.ok) {
        const raw = (await pRes.json()) as Record<string, unknown>[];
        setProducts(raw.map(mapProductOption));
      }
    })();
  }, [user, market]);

  useEffect(() => {
    if (!selectedClient) {
      setClientForm(emptyBudgetClientForm(config.taxRate, market));
      setTaxRate(config.taxRate);
      return;
    }
    const form = clientToFormValues(selectedClient, config.taxRate, market);
    setClientForm(form);
    setTaxRate(form.taxExempt ? 0 : form.taxRate);
  }, [selectedClient, config.taxRate, market]);

  function patchClientForm(patch: Partial<BudgetClientFormValues>) {
    setClientForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.taxExempt !== undefined || patch.taxRate !== undefined) {
        setTaxRate(next.taxExempt ? 0 : next.taxRate);
      }
      return next;
    });
  }

  const subtotal = useMemo(() => {
    const materials = sections.reduce(
      (sum, s) =>
        sum +
        s.materials.reduce(
          (lineSum, m) =>
            lineSum +
            lineNetTotal(m.quantity, Number(m.suggestedPrice), m.discountPct),
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
        unit: "unidad",
        suggestedPrice: 0,
        discountPct: 0,
        piecesPerBox: null,
        unitPerPiece: null,
      });
      return;
    }
    updateLine(sectionIndex, lineIndex, {
      productSku: product.sku,
      productName: product.name,
      unit: normalizeUnit(product.unit),
      suggestedPrice: Number(product.pvpPrice),
      piecesPerBox: product.piecesPerBox,
      unitPerPiece: product.unitPerPiece,
    });
  }

  async function handleCreateClient() {
    if (!newClientForm.name.trim() || !newClientForm.email.trim()) {
      setError("Nombre y email son obligatorios");
      return;
    }
    if (newClientForm.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setCreatingClient(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newClientForm.name,
          email: newClientForm.email,
          password: newClientForm.password,
          country: market,
          taxRate: newClientForm.taxExempt ? 0 : newClientForm.taxRate,
          taxExempt: newClientForm.taxExempt,
          profileData: buildClientProfileData(newClientForm),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "No se pudo crear el cliente"));
      const created = (await res.json()) as ClientOption;
      setClients((prev) => [created, ...prev]);
      setSelectedClient(created);
      setClientDialogOpen(false);
      setNewClientForm(emptyBudgetClientForm(config.taxRate, market));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setCreatingClient(false);
    }
  }

  async function persistSelectedClientUpdates(): Promise<ClientOption> {
    if (!selectedClient) throw new Error("Selecciona o crea un cliente");
    if (
      !clientFormHasChanges(clientForm, selectedClient, config.taxRate, market)
    ) {
      return selectedClient;
    }
    const res = await fetch(`${API}/admin/users/${selectedClient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: clientForm.name.trim(),
        email: clientForm.email.trim(),
        taxRate: clientForm.taxExempt ? 0 : clientForm.taxRate,
        taxExempt: clientForm.taxExempt,
        profileData: buildClientProfileData(clientForm),
      }),
    });
    if (!res.ok) throw new Error(await readApiError(res, "No se pudo actualizar el cliente"));
    const updated = (await res.json()) as ClientOption;
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedClient(updated);
    return updated;
  }

  async function handleSave() {
    if (!selectedClient) {
      setError("Selecciona o crea un cliente");
      return;
    }
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      setError("Nombre y email del cliente son obligatorios");
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
      const client = await persistSelectedClientUpdates();
      const res = await fetch(`${API}/proposals/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientId: client.id,
          title: title || undefined,
          taxRate: clientForm.taxExempt ? 0 : taxRate,
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
                discountPct: m.discountPct,
                unit: normalizeUnit(m.unit),
                externalComment: m.externalComment || undefined,
                internalComment: m.internalComment || undefined,
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
    <Stack spacing={2} sx={{ pb: 10 }}>
      <PageToolbar>
        <Button
          component={Link}
          href="/admin/presupuestos"
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          Volver
        </Button>
        <Typography variant="h5" sx={{ flex: 1, minWidth: { sm: "auto" } }}>
          Nuevo presupuesto
        </Typography>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : "Crear presupuesto"}
        </Button>
      </PageToolbar>

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
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setNewClientForm(emptyBudgetClientForm(config.taxRate, market));
              setClientDialogOpen(true);
            }}
          >
            Nuevo cliente
          </Button>
        </Stack>
        {selectedClient ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Edita los datos si hace falta. Se guardan en el cliente al crear el presupuesto.
            </Typography>
            <BudgetClientForm
              value={clientForm}
              onChange={patchClientForm}
              market={market}
              taxLabel={config.taxLabel}
            />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Selecciona un cliente del sistema o crea uno nuevo.
          </Typography>
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
          <ClearableNumberField
            label={`${config.taxLabel} %`}
            size="small"
            value={taxRate}
            onValueChange={setTaxRate}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ width: { sm: 140 } }}
          />
          <ClearableNumberField
            label="Mano de obra"
            size="small"
            value={laborCost}
            onValueChange={setLaborCost}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ width: { sm: 160 } }}
          />
        </Stack>
        <Accordion disableGutters elevation={0} sx={{ mt: 1, "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" color="text.secondary">
              Comentarios del documento
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
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
          </AccordionDetails>
        </Accordion>
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

          <ResponsiveTable minWidth={860} size="small" elevation={0}>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Cant. / m²</TableCell>
                <TableCell>Ud</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell align="right">Dto %</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right" width={88} />
              </TableRow>
            </TableHead>
            <TableBody>
              {section.materials.map((line, lineIndex) => (
                <BudgetLineRow
                  key={line.key}
                  line={line}
                  commentsColSpan={CREATE_COMMENTS_COLSPAN}
                  canDelete={section.materials.length > 1}
                  onDelete={() =>
                    updateSection(sectionIndex, {
                      materials: section.materials.filter((_, j) => j !== lineIndex),
                    })
                  }
                  onChange={(patch) => updateLine(sectionIndex, lineIndex, patch)}
                  leadingCells={
                    <TableCell sx={{ minWidth: 240, verticalAlign: "top" }}>
                      <Autocomplete
                        size="small"
                        options={products}
                        value={products.find((p) => p.sku === line.productSku) ?? null}
                        onChange={(_, product) =>
                          applyProduct(sectionIndex, lineIndex, product)
                        }
                        getOptionLabel={(p) => `${p.sku} — ${p.name}`}
                        isOptionEqualToValue={(a, b) => a.sku === b.sku}
                        renderInput={(params) => (
                          <TextField {...params} label="Producto" size="small" />
                        )}
                      />
                    </TableCell>
                  }
                />
              ))}
            </TableBody>
          </ResponsiveTable>

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

      <Paper
        sx={{
          p: 2,
          position: "sticky",
          bottom: 0,
          zIndex: 2,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.25}>
            <Typography variant="body2" color="text.secondary">
              Subtotal: ${subtotal.toFixed(2)} · {config.taxLabel} ({taxRate}%): $
              {taxAmount.toFixed(2)}
            </Typography>
            <Typography fontWeight="bold">Total: ${total.toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button component={Link} href="/admin/presupuestos" disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={18} color="inherit" /> : "Crear presupuesto"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={clientDialogOpen} onClose={() => setClientDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <BudgetClientForm
              value={newClientForm}
              onChange={(patch) => setNewClientForm((prev) => ({ ...prev, ...patch }))}
              market={market}
              taxLabel={config.taxLabel}
              showPassword
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientDialogOpen(false)} disabled={creatingClient}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateClient}
            disabled={
              creatingClient || !newClientForm.name.trim() || !newClientForm.email.trim()
            }
          >
            {creatingClient ? <CircularProgress size={18} color="inherit" /> : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
