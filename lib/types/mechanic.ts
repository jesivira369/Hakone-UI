export interface Mechanic {
  id: number;
  name: string;
  createdAt: string;
}

export interface MechanicQuery {
  data: Mechanic[];
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
}
