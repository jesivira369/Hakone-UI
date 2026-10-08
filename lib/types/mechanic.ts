export interface Mechanic {
  id: number;
  name: string;
  /** Teléfono internacional (E.164) validado para WhatsApp; opcional. */
  phone?: string | null;
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
