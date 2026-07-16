"use client";

import { useCallback, useEffect, useState, Fragment } from "react";
import Link from "next/link";
import {
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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { ExportButton } from "../components/AdminNav";
import { SupplierOrderPreviewDialog } from "../components/SupplierOrderPreviewDialog";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import { useAppSnackbar } from "../../hooks/useAppSnackbar";
import { formatOrderTotal } from "../../utils/orderLabels";
import {
  formatClientOrderStatus,
  formatSupplierOrderStatus,
} from "../../utils/supplierOrderLabels";
import { useAdminMarket } from "../context/AdminMarketContext";
import { adminApiUrl } from "../utils/adminApi";
import { readApiError } from "../utils/readApiError";

interface OrderLineItem {
  id: string;
  productSku: string;
  quantityOrdered: number;
  quantitySentToSupplier: number;
  unitPrice: number;
}

interface SupplierOrderRef {
  id: string;
  orderNumber: string;
  status: string;
  supplier?: { name: string };
  clientOrder?: { id: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  externalNotes?: string | null;
  internalNotes?: string | null;
  client?: { name: string; email: string };
  lineItems?: OrderLineItem[];
}

function OrderDetailRow({
  order,
  supplierOrders,
  onGeneratePos,
  onInvoice,
}: {
  order: Order;
  supplierOrders: SupplierOrderRef[];
  onGeneratePos: (orderId: string) => void;
  onInvoice: (orderId: string) => void;
}) {
  const pendingPoCount = supplierOrders.filter(
    (po) => po.status === "draft" || po.status === "sent",
  ).length;

  return (
    <Stack spacing={2}>
      {(order.externalNotes || order.internalNotes) && (
        <Stack spacing={0.5}>
          {order.externalNotes && (
            <Typography variant="body2">
              <Typography component="span" variant="body2" fontWeight={600}>
                Comentario externo:{" "}
              </Typography>
              {order.externalNotes}
            </Typography>
          )}
          {order.internalNotes && (
            <Typography variant="body2">
              <Typography component="span" variant="body2" fontWeight={600}>
                Comentario interno:{" "}
              </Typography>
              {order.internalNotes}
            </Typography>
          )}
        </Stack>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          size="small"
          onClick={() => onGeneratePos(order.id)}
          disabled={order.status === "draft" || order.status === "cancelled"}
        >
          Generar POs
        </Button>
        <Button variant="outlined" size="small" onClick={() => onInvoice(order.id)}>
          Facturar cliente
        </Button>
        {pendingPoCount > 0 && (
          <Chip
            size="small"
            color="warning"
            label={`${pendingPoCount} PO pendiente(s)`}
            component={Link}
            href={`/admin/pedidos-proveedor?clientOrderId=${order.id}`}
            clickable
          />
        )}
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>SKU</TableCell>
            <TableCell align="right">Pedido</TableCell>
            <TableCell align="right">Enviado prov.</TableCell>
            <TableCell align="right">Pendiente</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(order.lineItems ?? []).map((li) => (
            <TableRow key={li.id}>
              <TableCell>{li.productSku}</TableCell>
              <TableCell align="right">{li.quantityOrdered}</TableCell>
              <TableCell align="right">{li.quantitySentToSupplier}</TableCell>
              <TableCell align="right">
                {li.quantityOrdered - li.quantitySentToSupplier}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {supplierOrders.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            POs a proveedor
          </Typography>
          <Stack spacing={0.5}>
            {supplierOrders.map((po) => (
              <Typography key={po.id} variant="body2">
                <Link href={`/admin/pedidos-proveedor?clientOrderId=${order.id}`}>
                  {po.orderNumber}
                </Link>
                {" · "}
                {formatSupplierOrderStatus(po.status)}
                {po.supplier?.name ? ` · ${po.supplier.name}` : ""}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export default function PedidosAdminPage() {
  const { user } = useCurrentUser();
  const { market, config } = useAdminMarket();
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrderRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceDialog, setInvoiceDialog] = useState<string | null>(null);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, poRes] = await Promise.all([
        fetch(adminApiUrl("/orders", market), { credentials: "include" }),
        fetch(adminApiUrl("/supplier-orders", market), { credentials: "include" }),
      ]);
      if (!oRes.ok) throw new Error(await readApiError(oRes, "Error al cargar pedidos"));
      if (!poRes.ok) throw new Error(await readApiError(poRes, "Error al cargar POs"));
      setOrders(await oRes.json());
      setSupplierOrders(await poRes.json());
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, [market, showError]);

  useEffect(() => {
    if (user?.role === "admin") void fetchOrders();
  }, [user, fetchOrders]);

  function posForOrder(orderId: string): SupplierOrderRef[] {
    return supplierOrders.filter((po) => po.clientOrder?.id === orderId);
  }

  async function createInvoice(orderId: string) {
    const res = await fetch(`${API}/invoices/from-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        orderId,
        issueDate: new Date().toISOString().slice(0, 10),
        taxRate: config.taxRate,
      }),
    });
    setInvoiceDialog(null);
    if (res.ok) {
      showSuccess("Factura creada");
      void fetchOrders();
    } else {
      showError(await readApiError(res, "Error al crear factura"));
    }
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Pedidos Cliente</Typography>
        <ExportButton endpoint="/admin/exports/orders" label="Exportar Excel" market={market} />
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={48} />
                <TableCell>Número</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>POs</TableCell>
                <TableCell>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay pedidos</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const pos = posForOrder(o.id);
                  const pending = pos.filter(
                    (p) => p.status === "draft" || p.status === "sent",
                  ).length;
                  const expanded = expandedId === o.id;

                  return (
                    <Fragment key={o.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedId(expanded ? null : o.id)}
                            aria-label="Ver detalle"
                          >
                            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{o.orderNumber}</TableCell>
                        <TableCell>{o.client?.name ?? o.client?.email}</TableCell>
                        <TableCell>{formatClientOrderStatus(o.status)}</TableCell>
                        <TableCell>{formatOrderTotal(o.total, o.lineItems)}</TableCell>
                        <TableCell>
                          {pos.length === 0 ? (
                            "—"
                          ) : pending > 0 ? (
                            <Chip size="small" color="warning" label={`${pending} pend.`} />
                          ) : (
                            <Chip size="small" label={`${pos.length} PO`} variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>{new Date(o.createdAt).toLocaleDateString("es-ES")}</TableCell>
                      </TableRow>
                      <TableRow key={`${o.id}-detail`}>
                        <TableCell colSpan={7} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}>
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 1 }}>
                              <OrderDetailRow
                                order={o}
                                supplierOrders={pos}
                                onGeneratePos={setPreviewOrderId}
                                onInvoice={setInvoiceDialog}
                              />
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={!!invoiceDialog} onClose={() => setInvoiceDialog(null)}>
        <DialogTitle>Facturar pedido</DialogTitle>
        <DialogContent>
          <Typography>¿Crear factura con todas las líneas pendientes?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => invoiceDialog && void createInvoice(invoiceDialog)}
          >
            Facturar
          </Button>
        </DialogActions>
      </Dialog>

      <SupplierOrderPreviewDialog
        open={!!previewOrderId}
        clientOrderId={previewOrderId}
        currency={config.currency}
        onClose={() => setPreviewOrderId(null)}
        onGenerated={(msg) => {
          showSuccess(msg);
          void fetchOrders();
        }}
        onError={showError}
      />

      <SnackbarHost />
    </>
  );
}
