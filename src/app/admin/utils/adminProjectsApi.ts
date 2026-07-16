import type { MarketCode } from "../../utils/market";

export type CountryFilterMode = "active" | "all" | MarketCode;

export interface AdminProjectFilters {
  search: string;
  countryMode: CountryFilterMode;
  status: string;
  projectType: string;
  visibility: string;
}

export function buildAdminProjectsQuery(
  filters: AdminProjectFilters,
  activeMarket: MarketCode,
): string {
  const params = new URLSearchParams();

  const country =
    filters.countryMode === "active"
      ? activeMarket
      : filters.countryMode === "all"
        ? undefined
        : filters.countryMode;

  if (country) params.set("market", country);
  if (filters.status) params.set("status", filters.status);
  if (filters.projectType) params.set("projectType", filters.projectType);
  if (filters.visibility) params.set("visibility", filters.visibility);
  if (filters.search.trim()) params.set("search", filters.search.trim());

  const query = params.toString();
  return query ? `/admin/projects?${query}` : "/admin/projects";
}
