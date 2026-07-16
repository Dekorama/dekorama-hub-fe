import { API } from "@/features/auth/hooks/useCurrentUser";
import type { MarketCode } from "@/shared/utils/market";

export function withMarketQuery(path: string, market: MarketCode): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}market=${market}`;
}

/** Path + market query (sin host). Prefer `adminApiUrl` en fetch. */
export function adminApiPath(path: string, market: MarketCode): string {
  return withMarketQuery(path, market);
}

/** URL completa al backend Nest. */
export function adminApiUrl(path: string, market: MarketCode): string {
  return `${API}${adminApiPath(path, market)}`;
}
