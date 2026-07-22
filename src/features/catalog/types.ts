export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  family: string;
  familyName: string;
  subfamily: string;
  subfamilyName: string;
  unit: string;
  piecesPerBox: number | null;
  unitPerPiece: number | null;
  finishType: string | null;
  stock: number;
  isActive: boolean;
  market: string;
};

export type CatalogFamily = {
  code: string;
  name: string;
  icon: string | null;
};

export type CatalogSupplier = {
  id: string;
  name: string;
  familyCodes: string[];
};

export type CatalogFiltersResponse = {
  families: CatalogFamily[];
  suppliers: CatalogSupplier[];
};

export type CatalogListResponse = {
  items: CatalogProduct[];
  total: number;
  page: number;
  limit: number;
};

export type CatalogViewMode = "grid" | "list";

export type CatalogQuery = {
  search?: string;
  family?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
};
