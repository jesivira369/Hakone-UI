import { Bike } from "./bikes";

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  bicycles: Bike[];
  services: any[];
  userId: number;
}
