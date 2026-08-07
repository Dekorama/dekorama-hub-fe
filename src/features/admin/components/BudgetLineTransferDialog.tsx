"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { displayUnitLabel } from "@/features/admin/utils/lineItemMath";

export type TransferTarget = "order" | "supplier_order" | "invoice";

export type TransferLine = {
  id: string;
  productSku: string;
  productName: string;
  unit: string;
  quantity: number;
  remaining: number;
};

type BudgetLineTransferDialogProps = {
  open: boolean;
  target: TransferTarget;
  lines: TransferLine[];
  submitting: boolean;
  taxRate: number;
  taxLabel: string;
  laborCost?: number;
  onClose: () => void;
  onConfirm: (payload: {
    materialListIds: string[];
    externalNotes?: string;
    internalNotes?: string;
    issueDate?: string;
    dueDate?: string;
    includeLabor?: boolean;
  }) => void;
};

const TITLES: Record<TransferTarget, string> = {
  order: "Pasar a Pedido",
  supplier_order: "Pasar a Pedido a Proveedor",
  invoice: "Pasar a Factura",
};

const CONFIRM_LABELS: Record<TransferTarget, string> = {
  order: "Crear pedido",
  supplier_order: "Crear pedido + pedidos a proveedor",
  invoice: "Crear factura",
};

export function BudgetLineTransferDialog({
  open,
  target,
  lines,
  submitting,
  taxRate,
  taxLabel,
  laborCost = 0,
  onClose,
  onConfirm,
}: BudgetLineTransferDialogProps) {
  const [externalNotes, setExternalNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [issueDate, setIssueDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [includeLabor, setIncludeLabor] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setExternalNotes("");
    setInternalNotes("");
    setNotes("");
    setIncludeLabor(false);
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
  }, [open, target]);

  const ConfirmIcon =
    target === "invoice"
      ? ReceiptIcon
      : target === "supplier_order"
        ? LocalShippingIcon
        : ShoppingCartIcon;

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{TITLES[target]}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Se traspasará la cantidad pendiente de cada línea seleccionada.
        </Typography>
        <Stack spacing={0.75} sx={{ mb: 2 }}>
          {lines.map((m) => (
            <Typography key={m.id} variant="body2">
              {m.productName}
              {m.productSku ? ` (${m.productSku})` : ""} — ×{m.remaining}{" "}
              {displayUnitLabel(m.unit)}
            </Typography>
          ))}
          {lines.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Sin líneas seleccionadas
            </Typography>
          )}
        </Stack>

        {target !== "invoice" && (
          <Stack spacing={2}>
            <TextField
              label="Comentario externo (cliente)"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={externalNotes}
              onChange={(e) => setExternalNotes(e.target.value)}
              disabled={submitting}
            />
            <TextField
              label="Comentario interno"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              disabled={submitting}
            />
            <Typography variant="caption" color="text.secondary">
              {taxLabel}: {taxRate}%
            </Typography>
            {target === "supplier_order" && (
              <Typography variant="body2" color="text.secondary">
                Se creará un pedido de cliente con estas líneas y, a continuación, los
                pedidos a proveedor correspondientes.
              </Typography>
            )}
          </Stack>
        )}

        {target === "invoice" && (
          <Stack spacing={2}>
            <TextField
              label="Fecha de emisión"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              disabled={submitting}
            />
            <TextField
              label="Fecha de vencimiento"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
            />
            <TextField
              label="Notas"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
            {laborCost > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeLabor}
                    onChange={(e) => setIncludeLabor(e.target.checked)}
                    disabled={submitting}
                  />
                }
                label={`Incluir mano de obra (${laborCost})`}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {taxLabel}: {taxRate}%
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={target === "invoice" ? "primary" : "success"}
          disabled={lines.length === 0 || submitting}
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <ConfirmIcon />
            )
          }
          onClick={() => {
            if (target === "invoice") {
              onConfirm({
                materialListIds: lines.map((l) => l.id),
                issueDate,
                dueDate: dueDate || undefined,
                includeLabor,
                internalNotes: notes || undefined,
              });
              return;
            }
            onConfirm({
              materialListIds: lines.map((l) => l.id),
              externalNotes: externalNotes || undefined,
              internalNotes: internalNotes || undefined,
            });
          }}
        >
          {CONFIRM_LABELS[target]}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
