import { Bike } from "./bikes";
import { Client } from "./client";
import { Mechanic } from "./mechanic";

export interface ServicePart {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  serviceId: number;
}

export interface ServicePartInput {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Service {
  id: number;
  description: string;
  price: number;
  status: string;
  bicycle?: Bike;
  clientId: number;
  bicycleId: number;
  client?: Client;
  mechanic?: Mechanic;
  mechanicId: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  scheduledAt?: string | null;
  deliveryAt?: string | null;
  parts: ServicePart[];
}

export interface ServiceQuery {
  data: Service[];
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
}
