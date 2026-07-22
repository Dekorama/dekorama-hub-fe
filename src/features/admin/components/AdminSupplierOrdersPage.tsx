"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { ExportButton } from "@/features/admin/components/AdminNav";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { LabeledSelect } from "@/shared/components/LabeledSelect";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { readApiError } from "@/features/admin/utils/readApiError";
import type { SupplierPreviewData } from "@/features/admin/components/SupplierOrderPreviewDialog";
import {
  formatCurrency,
  formatSupplierInvoiceStatus,
  formatSupplierOrderStatus,
  supplierOrderTotal,
} from "@/shared/utils/supplierOrderLabels";
import { ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";

interface Supplier {
  id: string;
  name: string;
}

interface ClientOrderRef {
  id: string;
  orderNumber: string;
}

interface SupplierOrderLineItem {
  id: string;
  productSku: string;
  factoryCode: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

interface SupplierOrder {
  id: string;
  orderNumber: string;
  status: string;
  sentAt: string | null;
  notes: string | null;
  supplier?: { id: string; name: string; email: string };
  clientOrder?: ClientOrderRef;
  lineItems?: SupplierOrderLineItem[];
  createdAt: string;
}

interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  supplier?: { name: string };
  supplierOrderId: string;
  fileUrl?: string | null;
}

const PO_STATUS_OPTIONS = ["draft", "sent", "confirmed", "received", "cancelled"] as const;
const INV_STATUS_OPTIONS = ["pending", "matched", "paid"] as const;

function OrderRow({
  order,
  currency,
  expanded,
  onToggle,
  onPdf,
  onEmail,
  onStatusChange,
  pdfLoadingId,
  emailLoadingId,
}: {
  order: SupplierOrder;
  currency: string;
  expanded: boolean;
  onToggle: () => void;
  onPdf: (id: string) => void;
  onEmail: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  pdfLoadingId: string | null;
  emailLoadingId: string | null;
}) {
  const total = supplierOrderTotal(order.lineItems ?? []);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={onToggle} aria-label="Ver detalle">
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{order.orderNumber}</TableCell>
        <TableCell>
          {order.clientOrder ? (
            <Link href={`/admin/pedidos-proveedor?clientOrderId=${order.clientOrder.id}`}>
              {order.clientOrder.orderNumber}
            </Link>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell>{order.supplier?.name ?? "—"}</TableCell>
        <TableCell>
          <Chip
            size="small"
            label={formatSupplierOrderStatus(order.status)}
            color={order.status === "cancelled" ? "default" : "primary"}
            variant="outlined"
          />
        </TableCell>
        <TableCell>{formatCurrency(total, currency)}</TableCell>
        <TableCell>{new Date(order.createdAt).toLocaleDateString("es-ES")}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              disabled={pdfLoadingId === order.id}
              onClick={() => onPdf(order.id)}
            >
              {pdfLoadingId === order.id ? "…" : "PDF"}
            </Button>
            <Button
              size="small"
              disabled={emailLoadingId === order.id || order.status === "cancelled"}
              onClick={() => onEmail(order.id)}
            >
              {emailLoadingId === order.id ? "…" : "Email"}
            </Button>
            <LabeledSelect
              label="Estado"
              value={order.status}
              size="small"
              sx={{ minWidth: 130 }}
              onChange={(e) => onStatusChange(order.id, e.target.value as string)}
            >
              {PO_STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {formatSupplierOrderStatus(s)}
                </MenuItem>
              ))}
            </LabeledSelect>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2 }}>
              {order.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Notas: {order.notes}
                </Typography>
              )}
              {order.sentAt && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Enviado: {new Date(order.sentAt).toLocaleString("es-ES")}
                </Typography>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Cód. fábrica</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">Coste u.</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.lineItems ?? []).map((li) => (
                    <TableRow key={li.id}>
                      <TableCell>{li.productSku}</TableCell>
                      <TableCell>{li.factoryCode}</TableCell>
                      <TableCell align="right">{li.quantity}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Number(li.unitCost), currency)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(Number(li.lineTotal), currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function AdminSupplierOrdersPage() {
  const { user } = useCurrentUser();
  const { market, config } = useAdminMarket();
  const searchParams = useSearchParams();
  const clientOrderFilter = searchParams.get("clientOrderId") ?? "";
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clientOrders, setClientOrders] = useState<ClientOrderRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [emailLoadingId, setEmailLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clientOrderId: "", supplierId: "" });
  const [manualPreview, setManualPreview] = useState<SupplierPreviewData | null>(null);
  const [manualPreviewLoading, setManualPreviewLoading] = useState(false);
  const [invForm, setInvForm] = useState({
    supplierOrderId: "",
    invoiceNumber: "",
    amount: "",
    issueDate: "",
  });
  const [invFile, setInvFile] = useState<File | null>(null);

  const filteredOrders = useMemo(() => {
    if (!clientOrderFilter) return orders;
    return orders.filter((o) => o.clientOrder?.id === clientOrderFilter);
  }, [orders, clientOrderFilter]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const poUrl = clientOrderFilter
        ? `${adminApiUrl("/supplier-orders", market)}&clientOrderId=${clientOrderFilter}`
        : adminApiUrl("/supplier-orders", market);

      const [oRes, iRes, sRes, cRes] = await Promise.all([
        fetch(poUrl, { credentials: "include" }),
        fetch(adminApiUrl("/supplier-orders/invoices/list", market), { credentials: "include" }),
        fetch(adminApiUrl("/suppliers", market), { credentials: "include" }),
        fetch(adminApiUrl("/orders", market), { credentials: "include" }),
      ]);

      if (!oRes.ok) throw new Error(await readApiError(oRes, "Error al cargar POs"));
      if (!iRes.ok) throw new Error(await readApiError(iRes, "Error al cargar facturas"));
      if (!sRes.ok) throw new Error(await readApiError(sRes, "Error al cargar proveedores"));
      if (!cRes.ok) throw new Error(await readApiError(cRes, "Error al cargar pedidos"));

      setOrders(await oRes.json());
      setInvoices(await iRes.json());
      setSuppliers(await sRes.json());
      setClientOrders(await cRes.json());
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [market, clientOrderFilter, showError]);

  useEffect(() => {
    if (user?.role === "admin") void fetchAll();
  }, [user, fetchAll]);

  useEffect(() => {
    if (!createOpen || !form.clientOrderId) {
      setManualPreview(null);
      return;
    }

    let cancelled = false;
    setManualPreviewLoading(true);

    fetch(`${API}/orders/${form.clientOrderId}/supplier-preview`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await readApiError(res, "No se pudo cargar líneas del pedido"));
        }
        return res.json() as Promise<SupplierPreviewData>;
      })
      .then((data) => {
        if (!cancelled) setManualPreview(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setManualPreview(null);
          showError(err instanceof Error ? err.message : "Error al cargar líneas");
        }
      })
      .finally(() => {
        if (!cancelled) setManualPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [createOpen, form.clientOrderId, showError]);

  const manualSupplierGroup = useMemo(
    () => manualPreview?.groups.find((g) => g.supplier.id === form.supplierId) ?? null,
    [manualPreview, form.supplierId],
  );

  async function createPO() {
    if (!form.clientOrderId || !form.supplierId) {
      showError("Selecciona pedido cliente y proveedor");
      return;
    }
    if (!manualSupplierGroup?.lines.length) {
      showError(
        "Este proveedor no tiene líneas asignables en el pedido. Usa Generar POs en Pedidos Cliente.",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API}/supplier-orders/from-client-order/${form.clientOrderId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            supplierId: form.supplierId,
            clientOrderLineItemIds: manualSupplierGroup.lines.map((l) => l.lineItemId),
          }),
        },
      );
      if (!res.ok) throw new Error(await readApiError(res, "Error al crear PO"));
      const po = (await res.json()) as { orderNumber: string };
      showSuccess(`PO ${po.orderNumber} creado`);
      setCreateOpen(false);
      setForm({ clientOrderId: "", supplierId: "" });
      void fetchAll();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al crear PO");
    } finally {
      setSaving(false);
    }
  }

  async function createInvoice() {
    if (!invForm.supplierOrderId || !invForm.invoiceNumber) {
      showError("Completa PO y número de factura");
      return;
    }
    const amount = parseFloat(invForm.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      showError("Monto inválido");
      return;
    }
    setSaving(true);
    try {
      let fileUrl: string | undefined;
      if (invFile) {
        const fd = new FormData();
        fd.append("file", invFile);
        const up = await fetch(`${API}/uploads/invoices/supplier`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!up.ok) throw new Error(await readApiError(up, "Error al subir PDF"));
        const uploaded = (await up.json()) as { fileUrl: string };
        fileUrl = uploaded.fileUrl;
      }

      const res = await fetch(`${API}/supplier-orders/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplierOrderId: invForm.supplierOrderId,
          invoiceNumber: invForm.invoiceNumber,
          amount,
          issueDate: invForm.issueDate || new Date().toISOString().slice(0, 10),
          ...(fileUrl ? { fileUrl } : {}),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Error al registrar factura"));
      showSuccess("Factura registrada");
      setInvoiceOpen(false);
      setInvForm({ supplierOrderId: "", invoiceNumber: "", amount: "", issueDate: "" });
      setInvFile(null);
      void fetchAll();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al registrar factura");
    } finally {
      setSaving(false);
    }
  }

  async function openSupplierInvoiceFile(id: string) {
    try {
      const res = await fetch(`${API}/supplier-orders/invoices/${id}/file`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readApiError(res, "Sin archivo"));
      const data = (await res.json()) as { url: string };
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "No se pudo abrir el archivo");
    }
  }

  async function downloadPdf(id: string) {
    setPdfLoadingId(id);
    try {
      const res = await fetch(`${API}/supplier-orders/${id}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error(await readApiError(res, "No se pudo descargar el PDF"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al descargar PDF");
    } finally {
      setPdfLoadingId(null);
    }
  }

  async function sendEmail(id: string) {
    setEmailLoadingId(id);
    try {
      const res = await fetch(`${API}/supplier-orders/${id}/send-email`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readApiError(res, "Error al enviar email"));
      showSuccess("Email enviado");
      void fetchAll();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al enviar email");
    } finally {
      setEmailLoadingId(null);
    }
  }

  async function updatePoStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API}/supplier-orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Error al actualizar estado"));
      showSuccess("Estado actualizado");
      void fetchAll();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al actualizar estado");
    }
  }

  async function updateInvoiceStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API}/supplier-orders/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Error al actualizar factura"));
      showSuccess("Estado de factura actualizado");
      void fetchAll();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al actualizar factura");
    }
  }

  function openInvoiceDialog(orderId: string) {
    const po = orders.find((o) => o.id === orderId);
    const total = supplierOrderTotal(po?.lineItems ?? []);
    setInvForm({
      supplierOrderId: orderId,
      invoiceNumber: "",
      amount: total > 0 ? String(total) : "",
      issueDate: new Date().toISOString().slice(0, 10),
    });
    setInvFile(null);
    setInvoiceOpen(true);
  }

  return (
    <>
      <AdminPageHeader
        title="Pedidos a Proveedor"
        actions={
          <>
            <ExportButton endpoint="/admin/exports/supplier-orders" label="Exportar PO" market={market} />
            <ExportButton
              endpoint="/admin/exports/supplier-invoices"
              label="Exportar facturas"
              market={market}
            />
            <Button variant="contained" onClick={() => setCreateOpen(true)}>
              Nuevo PO (manual)
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setInvFile(null);
                setInvoiceOpen(true);
              }}
            >
              Registrar factura
            </Button>
          </>
        }
      />
      {clientOrderFilter && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Filtrado por pedido cliente ·{" "}
          <Link href="/admin/pedidos-proveedor">Quitar filtro</Link>
        </Typography>
      )}

      <Box sx={{ mb: 3 }}>
        <ResponsiveTable minWidth={800}>
          <TableHead>
            <TableRow>
              <TableCell width={48} />
              <TableCell>Número</TableCell>
              <TableCell>Pedido cliente</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Total coste</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableLoadingRow colSpan={8} />
            ) : filteredOrders.length === 0 ? (
              <TableEmptyRow colSpan={8} message="No hay pedidos a proveedor" />
            ) : (
              filteredOrders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  currency={config.currency}
                  expanded={expandedId === o.id}
                  onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
                  onPdf={downloadPdf}
                  onEmail={sendEmail}
                  onStatusChange={updatePoStatus}
                  pdfLoadingId={pdfLoadingId}
                  emailLoadingId={emailLoadingId}
                />
              ))
            )}
          </TableBody>
        </ResponsiveTable>
      </Box>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Facturas Proveedor
      </Typography>
      <ResponsiveTable minWidth={640} size="small">
        <TableHead>
          <TableRow>
            <TableCell>Número</TableCell>
            <TableCell>Proveedor</TableCell>
            <TableCell>Monto</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableLoadingRow colSpan={5} />
          ) : invoices.length === 0 ? (
            <TableEmptyRow colSpan={5} message="No hay facturas de proveedor" />
          ) : (
            invoices.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.invoiceNumber}</TableCell>
                <TableCell>{i.supplier?.name}</TableCell>
                <TableCell>{formatCurrency(Number(i.amount), config.currency)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={formatSupplierInvoiceStatus(i.status)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <LabeledSelect
                      label="Estado"
                      value={i.status}
                      size="small"
                      sx={{ minWidth: 130 }}
                      onChange={(e) =>
                        updateInvoiceStatus(i.id, e.target.value as string)
                      }
                    >
                      {INV_STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s}>
                          {formatSupplierInvoiceStatus(s)}
                        </MenuItem>
                      ))}
                    </LabeledSelect>
                    {i.fileUrl ? (
                      <Button size="small" onClick={() => void openSupplierInvoiceFile(i.id)}>
                        PDF
                      </Button>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </ResponsiveTable>

      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)}>
        <DialogTitle>Crear pedido proveedor (manual)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <Typography variant="body2" color="text.secondary">
              Para pedidos multi-proveedor usa &quot;Generar POs&quot; desde Pedidos Cliente.
            </Typography>
            <LabeledSelect
              label="Pedido cliente"
              value={form.clientOrderId}
              emptyLabel="Seleccionar pedido"
              fullWidth
              formControlProps={{ fullWidth: true }}
              onChange={(e) =>
                setForm({ clientOrderId: String(e.target.value), supplierId: "" })
              }
            >
              {clientOrders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.orderNumber}
                </MenuItem>
              ))}
            </LabeledSelect>
            <LabeledSelect
              label="Proveedor"
              value={form.supplierId}
              emptyLabel="Seleccionar proveedor"
              fullWidth
              formControlProps={{ fullWidth: true }}
              onChange={(e) => setForm({ ...form, supplierId: String(e.target.value) })}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </LabeledSelect>

            {manualPreviewLoading && (
              <Box display="flex" justifyContent="center" py={1}>
                <CircularProgress size={24} />
              </Box>
            )}

            {manualPreview && manualPreview.unmappedSkus.length > 0 && (
              <Alert severity="warning" sx={{ py: 0 }}>
                SKUs sin proveedor primario: {manualPreview.unmappedSkus.join(", ")}.{" "}
                <Link href="/admin/productos">Configurar en productos</Link>
              </Alert>
            )}

            {form.supplierId && manualPreview && !manualPreviewLoading && (
              manualSupplierGroup ? (
                <Alert severity="info" sx={{ py: 0 }}>
                  Se incluirán {manualSupplierGroup.lines.length} línea(s):{" "}
                  {manualSupplierGroup.lines.map((l) => l.productSku).join(", ")}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ py: 0 }}>
                  Este proveedor no tiene productos asignados en el pedido. Elige otro proveedor
                  o usa Generar POs en Pedidos Cliente.
                </Alert>
              )
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={createPO}
            disabled={saving || !manualSupplierGroup?.lines.length}
          >
            {saving ? "Creando…" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={invoiceOpen} onClose={() => !saving && setInvoiceOpen(false)}>
        <DialogTitle>Registrar factura proveedor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <LabeledSelect
              label="PO"
              value={invForm.supplierOrderId}
              emptyLabel="Seleccionar pedido proveedor"
              fullWidth
              formControlProps={{ fullWidth: true }}
              onChange={(e) => {
                const id = e.target.value;
                const po = orders.find((o) => o.id === id);
                const total = supplierOrderTotal(po?.lineItems ?? []);
                setInvForm({
                  ...invForm,
                  supplierOrderId: id,
                  amount: total > 0 ? String(total) : invForm.amount,
                });
              }}
            >
              {orders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.orderNumber} · {o.supplier?.name}
                </MenuItem>
              ))}
            </LabeledSelect>
            <TextField
              label="Número factura"
              value={invForm.invoiceNumber}
              onChange={(e) => setInvForm({ ...invForm, invoiceNumber: e.target.value })}
              fullWidth
            />
            <TextField
              label="Monto"
              type="number"
              value={invForm.amount}
              onChange={(e) => setInvForm({ ...invForm, amount: e.target.value })}
              fullWidth
            />
            <TextField
              label="Fecha emisión"
              type="date"
              value={invForm.issueDate || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setInvForm({ ...invForm, issueDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" component="label">
              {invFile ? invFile.name : "Adjuntar PDF factura"}
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={(e) => setInvFile(e.target.files?.[0] ?? null)}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setInvoiceOpen(false);
              setInvFile(null);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button variant="contained" onClick={createInvoice} disabled={saving}>
            {saving ? "Guardando…" : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarHost />
    </>
  );
}
