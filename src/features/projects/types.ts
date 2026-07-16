import { getMarketLabel, type MarketCode } from "@/shared/utils/market";

export type ProjectType = "reconstruction" | "renovation" | "new_build";
export type DepartmentType =
  | "structure"
  | "electricity"
  | "plumbing"
  | "finishes"
  | "hvac"
  | "other";
export type DepartmentStatus = "planned" | "approved" | "in_progress" | "completed";
export type ProjectMemberRole = "owner" | "editor" | "viewer";

export interface ProjectDepartment {
  id: string;
  department: DepartmentType;
  status: DepartmentStatus;
  progressPercentage: number;
  technicalDetails: string | null;
  damageDescription: string | null;
  designNotes: string | null;
  blueprints: string[] | null;
  images: string[] | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  status: string;
  projectType: ProjectType;
  budget: number | null;
  location: string | null;
  locality: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  clientId: string;
  isDetailed: boolean;
  departments: ProjectDepartment[];
  createdAt: string;
}

export interface ProposalDepartment {
  id: string;
  projectDepartmentId: string;
  partialLaborCost: number;
  estimatedDays: number | null;
}

export interface Proposal {
  id: string;
  professionalId: string;
  laborCost: number;
  message: string | null;
  status: string;
  createdAt: string;
  proposalDepartments?: ProposalDepartment[];
}

export interface Material {
  id: string;
  productSku: string;
  productName: string;
  quantity: number;
  suggestedPrice: number;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  pvpPrice: number;
  price?: number;
  family?: string;
  subfamily?: string;
}

export interface ProgressEntry {
  id: string;
  title: string;
  description: string;
  progressPercentage: number | null;
  departmentId: string | null;
  department?: ProjectDepartment | null;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface ProjectNoteItem {
  id: string;
  content: string;
  author?: { id: string; name: string };
  createdAt: string;
}

export interface ProjectProductItem {
  id: string;
  productSku: string;
  productName: string;
  quantity: number;
  notes: string | null;
  addedBy?: { id: string; name: string };
  createdAt: string;
}

export interface ProjectMemberItem {
  id: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
  user: { id: string; name: string; email: string };
}

export interface ProjectInvitationItem {
  id: string;
  inviteeEmail: string;
  role: ProjectMemberRole;
  status: string;
  createdAt: string;
}

export interface CommunityMemberItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  residentProfile: {
    unitNumber: string | null;
    floor: string | null;
    isOccupant: boolean;
    notes: string | null;
  } | null;
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  reconstruction: "Reconstrucción",
  renovation: "Renovación",
  new_build: "Obra nueva",
};

export const DEPARTMENT_LABELS: Record<DepartmentType, string> = {
  structure: "Estructura",
  electricity: "Electricidad",
  plumbing: "Plomería",
  finishes: "Acabados",
  hvac: "HVAC",
  other: "Otro",
};

export const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  reviewing: "En revisión",
  in_progress: "En progreso",
  completed: "Finalizado",
};

export const DEPARTMENT_STATUS_LABELS: Record<DepartmentStatus, string> = {
  planned: "Planificado",
  approved: "Aprobado",
  in_progress: "En progreso",
  completed: "Completado",
};

export const MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  owner: "Dueño",
  editor: "Editor",
  viewer: "Lector",
};

export function formatAddress(project: Project): string {
  const countryLabel =
    project.country === "VE" || project.country === "ES"
      ? getMarketLabel(project.country as MarketCode)
      : project.country;
  const parts = [
    project.location,
    project.locality,
    project.state,
    project.postalCode,
    countryLabel,
  ].filter(Boolean);
  return parts.join(", ");
}

export function getProductPrice(product: CatalogProduct): number {
  return Number(product.pvpPrice ?? product.price ?? 0);
}
