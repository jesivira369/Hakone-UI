export interface StatsOverview {
  totalClients: number;
  totalBicycles: number;
  totalServices: number;
  totalServicesDone: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface RevenuePoint {
  date: string;
  total: number;
}

export interface RevenueStats {
  series: RevenuePoint[];
  totalRevenue: number;
}

export interface ExpensesByCategory {
  SERVICIOS_BASICOS: number;
  MATERIALES_INSUMOS: number;
  SUELDOS: number;
  OTRO: number;
}

export interface ExpenseStats {
  series: RevenuePoint[];
  totalExpenses: number;
  byCategory: ExpensesByCategory;
}

export interface NetIncomePoint {
  date: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface NetIncomeStats {
  series: NetIncomePoint[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface ServicesByStatus {
  IN_REVIEW: number;
  QUOTED: number;
  SCHEDULED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  PAID: number;
  BLOCKED: number;
  CANCELED: number;
  total: number;
}

export interface RevenueByMethodItem {
  method: "CASH" | "CARD" | "TRANSFER" | "ELECTRONIC";
  total: number;
  count: number;
}

export interface RevenueByPaymentMethod {
  methods: RevenueByMethodItem[];
  totalRevenue: number;
}

export interface TopClientItem {
  client: {
    id: number;
    name: string;
    email: string | null;
    phone: string;
  };
  totalServices: number;
  totalSpent: number;
}
