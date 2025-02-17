import { Client } from "./client";
import { Service } from "./service";

export interface Bike {
  id: number;
  brand: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  lastServiceDate?: string;
  clientId: number;
  client: Client;
  services: Service[];
  userId: number;
}
