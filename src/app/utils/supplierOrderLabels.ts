const SUPPLIER_ORDER_STATUS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  confirmed: "Confirmado",
  received: "Recibido",
  cancelled: "Cancelado",
};

const SUPPLIER_INVOICE_STATUS: Record<string, string> = {
  pending: "Pendiente",
  matched: "Conciliada",
  paid: "Pagada",
};

const CLIENT_ORDER_STATUS: Record<string, string> = {
  draft: "Borrador",
  confirmed: "Confirmado",
  partial: "Parcial",
  fulfilled: "Completado",
  cancelled: "Cancelado",
};

export function formatSupplierOrderStatus(status: string): string {
  return SUPPLIER_ORDER_STATUS[status] ?? status;
}

export function formatSupplierInvoiceStatus(status: string): string {
  return SUPPLIER_INVOICE_STATUS[status] ?? status;
}

export function formatClientOrderStatus(status: string): string {
  return CLIENT_ORDER_STATUS[status] ?? status;
}

export function formatCurrency(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "N/D";
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function supplierOrderTotal(
  lineItems: { quantity: number; unitCost: number | string; lineTotal?: number | string }[],
): number {
  return lineItems.reduce((sum, item) => {
    const lineTotal = Number(item.lineTotal);
    if (Number.isFinite(lineTotal)) return sum + lineTotal;
    return sum + Number(item.unitCost) * Number(item.quantity);
  }, 0);
}
