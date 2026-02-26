export interface StatsOverview {
  totalClients: number;
  totalBicycles: number;
  totalServices: number;
  totalServicesDone: number;
  totalRevenue: number;
}

export interface RevenuePoint {
  date: string;
  total: number;
}

export interface RevenueStats {
  series: RevenuePoint[];
  totalRevenue: number;
}

export interface ServicesByStatus {
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELED: number;
  total: number;
}

export interface TopClientItem {
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  totalServices: number;
  totalSpent: number;
}
