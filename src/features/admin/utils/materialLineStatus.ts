export type MaterialLineStatus =
  | "pending"
  | "in_order"
  | "in_supplier_order"
  | "invoiced"
  | "partial";

const STATUS_LABELS: Record<MaterialLineStatus, string> = {
  pending: "Pendiente",
  in_order: "En Pedido",
  in_supplier_order: "En Pedido Proveedor",
  invoiced: "Facturado",
  partial: "Parcial",
};

const STATUS_COLORS: Record<
  MaterialLineStatus,
  "default" | "warning" | "info" | "success" | "secondary"
> = {
  pending: "default",
  in_order: "info",
  in_supplier_order: "secondary",
  invoiced: "success",
  partial: "warning",
};

export function getMaterialLineStatusLabel(status: MaterialLineStatus | string): string {
  return STATUS_LABELS[status as MaterialLineStatus] ?? status;
}

export function getMaterialLineStatusColor(
  status: MaterialLineStatus | string,
): "default" | "warning" | "info" | "success" | "secondary" {
  return STATUS_COLORS[status as MaterialLineStatus] ?? "default";
}

export function invoiceRemainingQty(m: {
  quantity: number;
  invoicedQuantity?: number;
  orderInvoicedQuantity?: number;
}): number {
  const qty = Number(m.quantity) || 0;
  const direct = Number(m.invoicedQuantity) || 0;
  const viaOrder = Number(m.orderInvoicedQuantity) || 0;
  return Math.max(0, qty - Math.max(direct, viaOrder));
}

export function orderRemainingQty(m: {
  quantity: number;
  orderedQuantity?: number;
}): number {
  return Math.max(0, (Number(m.quantity) || 0) - (Number(m.orderedQuantity) || 0));
}
