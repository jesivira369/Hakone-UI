export type UserRole = "ADMIN" | "SUPER_ADMIN";

export interface AppUser {
  id: number;
  email: string;
  shopName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UsersQuery {
  data: AppUser[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

