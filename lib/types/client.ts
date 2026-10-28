import { Bike } from "./bikes";
import { Service } from "./service";

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  // Cliente único y reutilizable por taller ("Cliente Ocasional") para
  // trabajos de una sola vez que no ameritan datos completos. No se puede
  // archivar/eliminar (ver ensureGenericClient en la API).
  isGeneric?: boolean;
  createdAt: string;
  updatedAt: string;
  bicycles: Bike[];
  services: Service[];
  userId: number;
}

/** Respuesta de GET /clients/:id/stats (ver spec 010). Fechas en ISO. */
export interface ClientStats {
  totalSpent: number;
  servicesCount: number;
  servicesByStatus: Record<string, number>;
  paidCount: number;
  averageTicket: number | null;
  firstServiceAt: string | null;
  lastServiceAt: string | null;
  daysSinceLastService: number | null;
  spendByMonth: { month: string; total: number }[];
  topCategories: { category: string; count: number; total: number }[];
  bikesCount: number;
  inShopCount: number;
}

export interface ClientQuery {
  data: Client[];
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
}
