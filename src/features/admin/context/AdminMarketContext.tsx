"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { API } from "@/features/auth/hooks/useCurrentUser";
import {
  getMarketConfig,
  isMarketCode,
  type MarketCode,
  type MarketConfig,
} from "@/shared/utils/market";

const STORAGE_KEY = "dekorama_admin_market";

interface MarketSettingsResponse {
  code: MarketCode;
  label: string;
  storeName: string;
  taxRate: number;
  taxLabel: string;
  currency: string;
  locale: string;
  docLabel: string;
  paymentMethods: string[];
  updatedAt: string;
}

interface AdminMarketContextValue {
  market: MarketCode;
  setMarket: (market: MarketCode) => void;
  config: MarketConfig;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const AdminMarketContext = createContext<AdminMarketContextValue | null>(null);

function readStoredMarket(): MarketCode {
  if (typeof window === "undefined") return "VE";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isMarketCode(stored)) return stored;
  return "VE";
}

function settingsToConfig(settings: MarketSettingsResponse): MarketConfig {
  return {
    code: settings.code,
    label: settings.label,
    storeName: settings.storeName,
    taxRate: Number(settings.taxRate),
    taxLabel: settings.taxLabel,
    currency: settings.currency,
    locale: settings.locale,
    docLabel: settings.docLabel,
    paymentMethods: settings.paymentMethods ?? [],
  };
}

export function AdminMarketProvider({ children }: { children: ReactNode }) {
  const [market, setMarketState] = useState<MarketCode>("VE");
  const [config, setConfig] = useState<MarketConfig>(getMarketConfig("VE"));
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async (code: MarketCode) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/markets/${code}/settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as MarketSettingsResponse;
        setConfig(settingsToConfig(data));
      } else {
        setConfig(getMarketConfig(code));
      }
    } catch {
      setConfig(getMarketConfig(code));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = readStoredMarket();
    setMarketState(stored);
    void loadConfig(stored);
  }, [loadConfig]);

  const setMarket = useCallback(
    (next: MarketCode) => {
      setMarketState(next);
      localStorage.setItem(STORAGE_KEY, next);
      void loadConfig(next);
    },
    [loadConfig],
  );

  const refreshConfig = useCallback(async () => {
    await loadConfig(market);
  }, [loadConfig, market]);

  const value = useMemo(
    () => ({ market, setMarket, config, loading, refreshConfig }),
    [market, setMarket, config, loading, refreshConfig],
  );

  return (
    <AdminMarketContext.Provider value={value}>{children}</AdminMarketContext.Provider>
  );
}

export function useAdminMarket(): AdminMarketContextValue {
  const ctx = useContext(AdminMarketContext);
  if (!ctx) {
    throw new Error("useAdminMarket must be used within AdminMarketProvider");
  }
  return ctx;
}
