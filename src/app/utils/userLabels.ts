export type ClientLegalType = "particular" | "empresa";

export type ClientDocumentType =
  | "dni"
  | "nie"
  | "nif"
  | "cif"
  | "cedula"
  | "rif";

export interface UserProfileData {
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  legalType?: ClientLegalType;
  documentType?: ClientDocumentType;
  documentNumber?: string;
  bio?: string;
  specialties?: string[];
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  client: "Cliente",
  professional: "Profesional",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: "Particular",
  community: "Comunidad de propietarios",
  member: "Miembro de comunidad",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function getAccountTypeLabel(accountType: string | null | undefined): string {
  if (!accountType) return "N/D";
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
