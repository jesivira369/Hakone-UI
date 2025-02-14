import { Bike } from "./bikes";
import { Client } from "./client";

export interface Service {
  id: number;
  description: string;
  price: number;
  status: string;
  bicycle?: Bike;
  clientId: number;
  bicycleId: number;
  client?: Client;
  mechanicId: any;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  partsUsed?: Record<string, number> | null;
}
