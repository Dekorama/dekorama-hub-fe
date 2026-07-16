import type { ClientDocumentType, ClientLegalType } from "./userLabels";

export type MarketCode = "VE" | "ES";

export interface MarketConfig {
  code: MarketCode;
  label: string;
  storeName: string;
  taxRate: number;
  taxLabel: string;
  currency: string;
  locale: string;
  docLabel: string;
  paymentMethods: string[];
}

export interface ClientDocumentOption {
  value: ClientDocumentType;
  label: string;
}

const DOCUMENT_LABELS: Record<ClientDocumentType, string> = {
  dni: "DNI",
  nie: "NIE",
  nif: "NIF",
  cif: "CIF",
  cedula: "Cédula",
  rif: "RIF",
};

export function getClientDocumentOptions(
  market: MarketCode,
  legalType: ClientLegalType,
): ClientDocumentOption[] {
  const types: ClientDocumentType[] =
    market === "VE"
      ? legalType === "empresa"
        ? ["rif"]
        : ["cedula"]
      : legalType === "empresa"
        ? ["cif", "nif"]
        : ["dni", "nie", "nif"];

  return types.map((value) => ({ value, label: DOCUMENT_LABELS[value] }));
}

export function getClientDocumentLabel(type: ClientDocumentType): string {
  return DOCUMENT_LABELS[type];
}

export const MARKETS: Record<MarketCode, MarketConfig> = {
  VE: {
    code: "VE",
    label: "Venezuela",
    storeName: "Dekorama Venezuela",
    taxRate: 16,
    taxLabel: "IVA",
    currency: "USD",
    locale: "es-VE",
    docLabel: "RIF",
    paymentMethods: ["Pagomovil", "Zelle", "Transferencia"],
  },
  ES: {
    code: "ES",
    label: "España",
    storeName: "Dekorama España",
    taxRate: 21,
    taxLabel: "IVA",
    currency: "EUR",
    locale: "es-ES",
    docLabel: "NIF/CIF",
    paymentMethods: ["Transferencia", "Tarjeta (próximamente)"],
  },
};

export const MARKET_OPTIONS: MarketCode[] = ["VE", "ES"];

export function isMarketCode(value: string): value is MarketCode {
  return value === "VE" || value === "ES";
}

export function getMarketConfig(code: MarketCode): MarketConfig {
  return MARKETS[code];
}

export function getMarketLabel(code: MarketCode): string {
  return MARKETS[code].label;
}

export function formatMarketBadge(code: MarketCode): string {
  return `${MARKETS[code].label} · ${MARKETS[code].storeName}`;
}
