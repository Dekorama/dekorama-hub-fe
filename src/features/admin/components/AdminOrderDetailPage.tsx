"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { readApiError } from "@/features/admin/utils/readApiError";
import { lineNetTotal } from "@/features/admin/utils/lineItemMath";
import { formatClientOrderStatus } from "@/shared/utils/supplierOrderLabels";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

interface ProductOption {
  sku: string;
  name: string;
  pvpPrice: number;
  unit: string;
}

interface LineDraft {
  key: string;
  id?: string;
  productSku: string;
  productName: string;
  unit: string;
  quantityOrdered: number;
  unitPrice: number;
  discountPct: number;
  externalComment: string;
  internalComment: string;
  proposalMaterialListId?: string | null;
  quantitySentToSupplier: number;
  quantityInvoiced: number;
  quantityFulfilled: number;
}

interface SectionDraft {
  key: string;
  name: string;
  lineItems: LineDraft[];
}

interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  externalNotes?: string | null;
  internalNotes?: string | null;
  client?: { name: string; email: string };
  sections?: Array<{
    id: string;
    name: string;
    sortOrder: number;
  }>;
  lineItems?: Array<{
    id: string;
    productSku: string;
    unit: string;
    quantityOrdered: number;
    unitPrice: number;
    discountPct: number;
    externalComment?: string | null;
    internalComment?: string | null;
    proposalMaterialListId?: string | null;
    sectionId?: string | null;
    quantitySentToSupplier?: number;
    quantityInvoiced?: number;
    quantityFulfilled?: number;
    product?: { name: string };
  }>;
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
    quantityOrdered: 1,
    unitPrice: 0,
    discountPct: 0,
    externalComment: "",
    internalComment: "",
    proposalMaterialListId: null,
    quantitySentToSupplier: 0,
    quantityInvoiced: 0,
    quantityFulfilled: 0,
  };
}

function emptySection(index: number): SectionDraft {
  return {
    key: newKey(),
    name: `Sección ${index + 1}`,
    lineItems: [emptyLine()],
  };
}

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const { market, config } = useAdminMarket();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [status, setStatus] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [externalNotes, setExternalNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [sections, setSections] = useState<SectionDraft[]>([emptySection(0)]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  const showFeedback = (
    message: string,
    severity: "success" | "error" | "info",
  ) => setFeedback({ open: true, message, severity });

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([
        fetch(`${API}/orders/${id}`, { credentials: "include" }),
        fetch(adminApiUrl("/products", market), { credentials: "include" }),
      ]);
      if (!oRes.ok) throw new Error(await readApiError(oRes, "No se pudo cargar el pedido"));

      const productList: ProductOption[] = pRes.ok ? await pRes.json() : [];
      setProducts(productList);
      const productNameBySku = new Map(productList.map((p) => [p.sku, p.name]));

      const order = (await oRes.json()) as OrderResponse;
      setOrderNumber(order.orderNumber);
      setStatus(order.status);
      setClientLabel(order.client?.name ?? order.client?.email ?? "");
      setTaxRate(Number(order.taxRate) || 0);
      setExternalNotes(order.externalNotes ?? "");
      setInternalNotes(order.internalNotes ?? "");

      const lines = order.lineItems ?? [];
      const orderedSections = [...(order.sections ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      if (orderedSections.length > 0) {
        const bySection = new Map<string, LineDraft[]>();
        for (const s of orderedSections) bySection.set(s.id, []);

        const unsectioned: LineDraft[] = [];
        for (const li of lines) {
          const draft: LineDraft = {
            key: li.id,
            id: li.id,
            productSku: li.productSku,
            productName:
              li.product?.name ??
              productNameBySku.get(li.productSku) ??
              li.productSku,
            unit: li.unit || "unidad",
            quantityOrdered: Number(li.quantityOrdered),
            unitPrice: Number(li.unitPrice),
            discountPct: Number(li.discountPct) || 0,
            externalComment: li.externalComment ?? "",
            internalComment: li.internalComment ?? "",
            proposalMaterialListId: li.proposalMaterialListId ?? null,
            quantitySentToSupplier: Number(li.quantitySentToSupplier) || 0,
            quantityInvoiced: Number(li.quantityInvoiced) || 0,
            quantityFulfilled: Number(li.quantityFulfilled) || 0,
          };
          if (li.sectionId && bySection.has(li.sectionId)) {
            bySection.get(li.sectionId)!.push(draft);
          } else {
            unsectioned.push(draft);
          }
        }

        const drafts: SectionDraft[] = orderedSections.map((s) => ({
          key: s.id,
          name: s.name,
          lineItems: bySection.get(s.id) ?? [],
        }));
        if (unsectioned.length > 0) {
          drafts.push({
            key: newKey(),
            name: "Sin sección",
            lineItems: unsectioned,
          });
        }
        setSections(
          drafts.length > 0 && drafts.some((d) => d.lineItems.length > 0)
            ? drafts.filter((d) => d.lineItems.length > 0 || d.name !== "Sin sección")
            : [emptySection(0)],
        );
      } else if (lines.length > 0) {
        setSections([
          {
            key: newKey(),
            name: "Líneas",
            lineItems: lines.map((li) => ({
              key: li.id,
              id: li.id,
              productSku: li.productSku,
              productName:
                li.product?.name ??
                productNameBySku.get(li.productSku) ??
                li.productSku,
              unit: li.unit || "unidad",
              quantityOrdered: Number(li.quantityOrdered),
              unitPrice: Number(li.unitPrice),
              discountPct: Number(li.discountPct) || 0,
              externalComment: li.externalComment ?? "",
              internalComment: li.internalComment ?? "",
              proposalMaterialListId: li.proposalMaterialListId ?? null,
              quantitySentToSupplier: Number(li.quantitySentToSupplier) || 0,
              quantityInvoiced: Number(li.quantityInvoiced) || 0,
              quantityFulfilled: Number(li.quantityFulfilled) || 0,
            })),
          },
        ]);
      } else {
        setSections([emptySection(0)]);
      }
    } catch (err: unknown) {
      showFeedback(
        err instanceof Error ? err.message : "Error al cargar",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [id, market]);

  useEffect(() => {
    if (user?.role === "admin") void loadOrder();
  }, [user, loadOrder]);

  const subtotal = useMemo(
    () =>
      sections.reduce(
        (sum, s) =>
          sum +
          s.lineItems.reduce(
            (lineSum, li) =>
              lineSum +
              lineNetTotal(
                li.quantityOrdered,
                Number(li.unitPrice),
                li.discountPct,
              ),
            0,
          ),
        0,
      ),
    [sections],
  );
  const taxAmount = subtotal * (Number(taxRate) / 100);
  const total = subtotal + taxAmount;

  const locked = status === "cancelled";

  function updateSection(index: number, patch: Partial<SectionDraft>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  function updateLine(
    sectionIndex: number,
    lineIndex: number,
    patch: Partial<LineDraft>,
  ) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        const lineItems = s.lineItems.map((m, j) =>
          j === lineIndex ? { ...m, ...patch } : m,
        );
        return { ...s, lineItems };
      }),
    );
  }

  function applyProduct(
    sectionIndex: number,
    lineIndex: number,
    product: ProductOption | null,
  ) {
    if (!product) {
      updateLine(sectionIndex, lineIndex, {
        productSku: "",
        productName: "",
        unit: "unidad",
        unitPrice: 0,
        discountPct: 0,
      });
      return;
    }
    updateLine(sectionIndex, lineIndex, {
      productSku: product.sku,
      productName: product.name,
      unit: product.unit || "unidad",
      unitPrice: Number(product.pvpPrice),
    });
  }

  async function handleSave() {
    if (locked) return;
    const hasLines = sections.some((s) =>
      s.lineItems.some((m) => m.productSku && m.quantityOrdered > 0),
    );
    if (!hasLines) {
      showFeedback("Agrega al menos una línea de producto", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taxRate,
          externalNotes: externalNotes || null,
          internalNotes: internalNotes || null,
          sections: sections.map((s, i) => ({
            name: s.name,
            sortOrder: i,
            lineItems: s.lineItems
              .filter((m) => m.productSku)
              .map((m) => ({
                id: m.id,
                productSku: m.productSku,
                productName: m.productName,
                quantityOrdered: m.quantityOrdered,
                unitPrice: m.unitPrice,
                discountPct: m.discountPct,
                unit: m.unit,
                externalComment: m.externalComment || null,
                internalComment: m.internalComment || null,
                proposalMaterialListId: m.proposalMaterialListId ?? null,
              })),
          })),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "No se pudo guardar"));
      await loadOrder();
      showFeedback("Pedido guardado", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <Alert severity="warning">Solo administradores pueden ver esta página</Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <AdminPageHeader
        title={orderNumber || "Pedido"}
        actions={
          <Button
            component={Link}
            href="/admin/pedidos"
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            Volver
          </Button>
        }
      />

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Cliente: {clientLabel || "—"} · Estado:{" "}
            {formatClientOrderStatus(status)}
          </Typography>
          <TextField
            label={`IVA / ${config.taxLabel} %`}
            type="number"
            size="small"
            value={taxRate}
            disabled={locked}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ maxWidth: 160 }}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              label="Comentario externo (doc)"
              size="small"
              fullWidth
              multiline
              minRows={2}
              disabled={locked}
              value={externalNotes}
              onChange={(e) => setExternalNotes(e.target.value)}
            />
            <TextField
              label="Comentario interno (doc)"
              size="small"
              fullWidth
              multiline
              minRows={2}
              disabled={locked}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </Stack>
        </Stack>
      </Paper>

      {sections.map((section, sectionIndex) => (
        <Paper key={section.key} sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <TextField
              label="Sección"
              size="small"
              value={section.name}
              disabled={locked}
              onChange={(e) =>
                updateSection(sectionIndex, { name: e.target.value })
              }
              sx={{ flex: 1 }}
            />
            <IconButton
              aria-label="Eliminar sección"
              disabled={locked || sections.length === 1}
              onClick={() =>
                setSections((prev) => prev.filter((_, i) => i !== sectionIndex))
              }
            >
              <DeleteIcon />
            </IconButton>
          </Stack>

          <Stack spacing={1.5}>
            {section.lineItems.map((line, lineIndex) => (
              <Stack key={line.key} spacing={1}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  alignItems={{ md: "center" }}
                >
                  <Autocomplete
                    sx={{ flex: 2, minWidth: 220 }}
                    options={products}
                    disabled={locked}
                    value={
                      products.find((p) => p.sku === line.productSku) ?? null
                    }
                    onChange={(_, product) =>
                      applyProduct(sectionIndex, lineIndex, product)
                    }
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
                    disabled={locked}
                    value={line.quantityOrdered}
                    onChange={(e) =>
                      updateLine(sectionIndex, lineIndex, {
                        quantityOrdered: parseFloat(e.target.value) || 0,
                      })
                    }
                    inputProps={{
                      min: Math.max(
                        line.quantitySentToSupplier,
                        line.quantityInvoiced,
                        line.quantityFulfilled,
                      ),
                      step: "any",
                    }}
                    sx={{ width: { md: 90 } }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 40, textAlign: "center" }}
                  >
                    {line.unit || "—"}
                  </Typography>
                  <TextField
                    label="Precio"
                    type="number"
                    size="small"
                    disabled={locked}
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(sectionIndex, lineIndex, {
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ width: { md: 110 } }}
                  />
                  <TextField
                    label="Dto %"
                    type="number"
                    size="small"
                    disabled={locked}
                    value={line.discountPct}
                    onChange={(e) =>
                      updateLine(sectionIndex, lineIndex, {
                        discountPct: Math.min(
                          100,
                          Math.max(0, parseFloat(e.target.value) || 0),
                        ),
                      })
                    }
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    sx={{ width: { md: 90 } }}
                  />
                  <Typography sx={{ minWidth: 90 }} align="right">
                    $
                    {lineNetTotal(
                      line.quantityOrdered,
                      Number(line.unitPrice),
                      line.discountPct,
                    ).toFixed(2)}
                  </Typography>
                  <IconButton
                    aria-label="Eliminar línea"
                    disabled={
                      locked ||
                      section.lineItems.length === 1 ||
                      line.quantitySentToSupplier > 0 ||
                      line.quantityInvoiced > 0
                    }
                    onClick={() =>
                      updateSection(sectionIndex, {
                        lineItems: section.lineItems.filter(
                          (_, j) => j !== lineIndex,
                        ),
                      })
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  <TextField
                    label="Comentario externo"
                    size="small"
                    fullWidth
                    disabled={locked}
                    value={line.externalComment}
                    onChange={(e) =>
                      updateLine(sectionIndex, lineIndex, {
                        externalComment: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Comentario interno"
                    size="small"
                    fullWidth
                    disabled={locked}
                    value={line.internalComment}
                    onChange={(e) =>
                      updateLine(sectionIndex, lineIndex, {
                        internalComment: e.target.value,
                      })
                    }
                  />
                </Stack>
              </Stack>
            ))}
          </Stack>

          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{ mt: 1.5 }}
            disabled={locked}
            onClick={() =>
              updateSection(sectionIndex, {
                lineItems: [...section.lineItems, emptyLine()],
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
        disabled={locked}
        onClick={() =>
          setSections((prev) => [...prev, emptySection(prev.length)])
        }
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
          <Button component={Link} href="/admin/pedidos" disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={saving || locked}
            onClick={() => void handleSave()}
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
      >
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
