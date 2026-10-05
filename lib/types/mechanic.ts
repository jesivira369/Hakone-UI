export interface Mechanic {
  id: number;
  name: string;
  createdAt: string;
  /** Enlace personal sin login (/m/{token}); null/ausente = sin enlace activo. */
  accessToken?: string | null;
  accessTokenLastUsedAt?: string | null;
}

export interface MechanicQuery {
  data: Mechanic[];
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
}
