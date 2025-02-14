import { Client } from "./client";

export interface Bike {
  id: number;
  brand: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  lastServiceDate?: string;
  clientId: number;
  client: Client;
  services: any[];
  userId: number;
}
