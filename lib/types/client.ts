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

export interface ClientQuery {
  data: Client[];
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
}
