export type ProposalStatusKey =
  | "solicitud_submitted"
  | "pending"
  | "proforma_ready"
  | "signed"
  | "rejected";

export type ProposalTypeKey = "solicitud" | "direct_sale" | "project";

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatusKey, string> = {
  solicitud_submitted: "Solicitud enviada",
  pending: "Pendiente",
  proforma_ready: "Proforma lista",
  signed: "Firmada",
  rejected: "Rechazada",
};

export const PROPOSAL_STATUS_COLORS: Record<
  ProposalStatusKey,
  "default" | "info" | "warning" | "success" | "error"
> = {
  solicitud_submitted: "info",
  pending: "default",
  proforma_ready: "warning",
  signed: "success",
  rejected: "error",
};

export const PROPOSAL_TYPE_LABELS: Record<ProposalTypeKey, string> = {
  solicitud: "Solicitud de compra",
  direct_sale: "Venta directa",
  project: "Propuesta de proyecto",
};

export function getProposalStatusLabel(status: string): string {
  return PROPOSAL_STATUS_LABELS[status as ProposalStatusKey] ?? status.replace(/_/g, " ");
}

export function getProposalStatusColor(
  status: string,
): "default" | "info" | "warning" | "success" | "error" {
  return PROPOSAL_STATUS_COLORS[status as ProposalStatusKey] ?? "default";
}

export function getProposalTypeLabel(type: string): string {
  return PROPOSAL_TYPE_LABELS[type as ProposalTypeKey] ?? type.replace(/_/g, " ");
}

export function canGenerateProforma(status: string): boolean {
  return status === "solicitud_submitted" || status === "pending";
}
