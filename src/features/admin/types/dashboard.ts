export interface AdminDashboardConversion {
  solicitudes: number;
  proformas: number;
  signed: number;
  orders: number;
  invoices: number;
}

export interface AdminDashboardTopProduct {
  sku: string;
  totalSold: string;
  totalRevenue?: string;
}

export interface AdminDashboardData {
  monthlySales: number;
  openOrders: number;
  pendingSolicitudes: number;
  topProducts: AdminDashboardTopProduct[];
  sales: {
    monthly: number;
    ytd: number;
    pendingCollection: number;
    pendingInvoices: number;
  };
  orders: {
    open: number;
    total: number;
  };
  proposals: {
    pendingSolicitudes: number;
    open: number;
  };
  projects: {
    total: number;
    open: number;
    inProgress: number;
    public: number;
  };
  users: {
    clients: number;
    professionals: number;
    pendingVerification: number;
  };
  catalog: {
    activeProducts: number;
    suppliers: number;
  };
  supplierOrders: {
    pending: number;
  };
  conversion: AdminDashboardConversion;
}

const EMPTY_CONVERSION: AdminDashboardConversion = {
  solicitudes: 0,
  proformas: 0,
  signed: 0,
  orders: 0,
  invoices: 0,
};

export function normalizeDashboardData(raw: unknown): AdminDashboardData | null {
  if (!raw || typeof raw !== "object") return null;

  const d = raw as Partial<AdminDashboardData>;
  const monthly = Number(d.monthlySales ?? d.sales?.monthly ?? 0);

  return {
    monthlySales: monthly,
    openOrders: Number(d.openOrders ?? d.orders?.open ?? 0),
    pendingSolicitudes: Number(d.pendingSolicitudes ?? d.proposals?.pendingSolicitudes ?? 0),
    topProducts: Array.isArray(d.topProducts) ? d.topProducts : [],
    sales: {
      monthly,
      ytd: Number(d.sales?.ytd ?? 0),
      pendingCollection: Number(d.sales?.pendingCollection ?? 0),
      pendingInvoices: Number(d.sales?.pendingInvoices ?? 0),
    },
    orders: {
      open: Number(d.orders?.open ?? d.openOrders ?? 0),
      total: Number(d.orders?.total ?? 0),
    },
    proposals: {
      pendingSolicitudes: Number(d.proposals?.pendingSolicitudes ?? d.pendingSolicitudes ?? 0),
      open: Number(d.proposals?.open ?? 0),
    },
    projects: {
      total: Number(d.projects?.total ?? 0),
      open: Number(d.projects?.open ?? 0),
      inProgress: Number(d.projects?.inProgress ?? 0),
      public: Number(d.projects?.public ?? 0),
    },
    users: {
      clients: Number(d.users?.clients ?? 0),
      professionals: Number(d.users?.professionals ?? 0),
      pendingVerification: Number(d.users?.pendingVerification ?? 0),
    },
    catalog: {
      activeProducts: Number(d.catalog?.activeProducts ?? 0),
      suppliers: Number(d.catalog?.suppliers ?? 0),
    },
    supplierOrders: {
      pending: Number(d.supplierOrders?.pending ?? 0),
    },
    conversion: { ...EMPTY_CONVERSION, ...d.conversion },
  };
}
