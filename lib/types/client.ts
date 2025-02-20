import { Bike } from "./bikes";
import { Service } from "./service";

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
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
