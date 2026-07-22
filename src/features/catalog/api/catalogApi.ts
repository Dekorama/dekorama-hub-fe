import { API } from "@/features/auth/hooks/useCurrentUser";
import type {
  CatalogFiltersResponse,
  CatalogListResponse,
  CatalogProduct,
  CatalogQuery,
} from "../types";

function buildQuery(params: CatalogQuery): string {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.family) qs.set("family", params.family);
  if (params.supplierId) qs.set("supplierId", params.supplierId);
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 24));
  return qs.toString();
}

export async function fetchCatalogProducts(
  params: CatalogQuery,
): Promise<CatalogListResponse> {
  const res = await fetch(`${API}/products?${buildQuery(params)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al cargar el catálogo");
  return res.json() as Promise<CatalogListResponse>;
}

export async function fetchCatalogFilters(): Promise<CatalogFiltersResponse> {
  const res = await fetch(`${API}/products/catalog-filters`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al cargar filtros");
  return res.json() as Promise<CatalogFiltersResponse>;
}

export async function fetchProductBySku(sku: string): Promise<CatalogProduct> {
  const res = await fetch(`${API}/products/sku/${encodeURIComponent(sku)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Producto no encontrado");
  return res.json() as Promise<CatalogProduct>;
}

export async function addProductToCart(
  productSku: string,
  quantity: number,
): Promise<void> {
  const res = await fetch(`${API}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productSku, quantity }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Error al añadir al carrito");
  }
}
