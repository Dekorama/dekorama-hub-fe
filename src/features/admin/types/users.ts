export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "professional" | "client";
  accountType: "individual" | "community" | "member" | null;
  isVerified: boolean;
  country: string;
  taxRate?: number | null;
  taxExempt?: boolean;
  createdAt: string;
  profileData: {
    specialties?: string[];
    phone?: string;
    company?: string;
    [key: string]: unknown;
  } | null;
}
