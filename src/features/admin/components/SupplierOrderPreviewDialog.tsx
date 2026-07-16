"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { readApiError } from "@/features/admin/utils/readApiError";
import {
  formatCurrency,
  formatSupplierOrderStatus,
} from "@/shared/utils/supplierOrderLabels";
import { ResponsiveTable } from "@/shared/ui";

export interface SupplierPreviewLine {
  lineItemId: string;
  productSku: string;
  quantityPending: number;
  primarySupplier?: { id: string; name: string };
  factoryCode?: string;
  unitCost?: number;
  warning?: "no_primary_supplier" | "already_fully_sent";
}

export interface SupplierPreviewGroup {
  supplier: { id: string; name: string; email: string };
  lines: SupplierPreviewLine[];
  estimatedTotal: number;
}

export interface SupplierPreviewData {
  clientOrder: {
    id: string;
    orderNumber: string;
    clientName: string;
    status: string;
  };
  pendingLines: SupplierPreviewLine[];
  groups: SupplierPreviewGroup[];
  unmappedSkus: string[];
  existingSupplierOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    supplierName: string;
  }>;
}

interface SupplierOrderPreviewDialogProps {
  open: boolean;
  clientOrderId: string | null;
  currency: string;
  onClose: () => void;
  onGenerated: (message: string) => void;
  onError: (message: string) => void;
}

export function SupplierOrderPreviewDialog({
  open,
  clientOrderId,
  currency,
  onClose,
  onGenerated,
  onError,
}: SupplierOrderPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<SupplierPreviewData | null>(null);

  useEffect(() => {
    if (!open || !clientOrderId) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API}/orders/${clientOrderId}/supplier-preview`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await readApiError(res, "No se pudo cargar la vista previa"));
        }
        return res.json() as Promise<SupplierPreviewData>;
      })
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : "Error al cargar vista previa");
          onClose();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, clientOrderId, onClose, onError]);

  async function handleGenerate() {
    if (!clientOrderId) return;
    setGenerating(true);
    try {
      const res = await fetch(
        `${API}/supplier-orders/from-client-order/${clientOrderId}/generate-all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudieron generar los PO"));
      }
      const result = (await res.json()) as {
        created: Array<{ orderNumber: string }>;
        skipped: Array<{ sku: string; reason: string }>;
      };
      const numbers = result.created.map((po) => po.orderNumber).join(", ");
      let message = result.created.length
        ? `${result.created.length} PO(s) creados: ${numbers}`
        : "No se crearon POs";
      if (result.skipped.length) {
        message += `. ${result.skipped.length} SKU(s) omitidos por falta de proveedor primario`;
      }
      onGenerated(message);
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Error al generar POs");
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate = (preview?.groups.length ?? 0) > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Generar pedidos a proveedor</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : preview ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Pedido {preview.clientOrder.orderNumber} · {preview.clientOrder.clientName}
            </Typography>

            {preview.unmappedSkus.length > 0 && (
              <Alert severity="warning">
                SKUs sin proveedor primario: {preview.unmappedSkus.join(", ")}.{" "}
                <Link href="/admin/productos">Configurar en productos</Link>
              </Alert>
            )}

            {preview.existingSupplierOrders.length > 0 && (
              <Alert severity="info">
                POs existentes:{" "}
                {preview.existingSupplierOrders
                  .map(
                    (po) =>
                      `${po.orderNumber} (${formatSupplierOrderStatus(po.status)} · ${po.supplierName})`,
                  )
                  .join(", ")}
              </Alert>
            )}

            {preview.groups.length === 0 ? (
              <Typography color="text.secondary">
                No hay líneas pendientes con proveedor primario configurado.
              </Typography>
            ) : (
              preview.groups.map((group) => (
                <Box key={group.supplier.id}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {group.supplier.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {group.supplier.email}
                  </Typography>
                  <ResponsiveTable minWidth={480} size="small" elevation={0}>
                    <TableHead>
                      <TableRow>
                        <TableCell>SKU</TableCell>
                        <TableCell>Cód. fábrica</TableCell>
                        <TableCell align="right">Cant.</TableCell>
                        <TableCell align="right">Coste</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.lines.map((line) => (
                        <TableRow key={line.lineItemId}>
                          <TableCell>{line.productSku}</TableCell>
                          <TableCell>{line.factoryCode}</TableCell>
                          <TableCell align="right">{line.quantityPending}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(line.unitCost ?? 0, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <strong>Total estimado</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>{formatCurrency(group.estimatedTotal, currency)}</strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </ResponsiveTable>
                </Box>
              ))
            )}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={generating}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
        >
          {generating ? "Generando…" : `Generar ${preview?.groups.length ?? 0} PO(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}