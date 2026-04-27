export type ContactRequestStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface ContactRequest {
  id: number;
  name: string;
  shopName: string;
  phone: string;
  email: string;
  message: string;
  status: ContactRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequestsQuery {
  data: ContactRequest[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

