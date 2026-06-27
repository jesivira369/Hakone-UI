import { SubscriptionStatus } from "./auth";

export type UserRole = "ADMIN" | "SUPER_ADMIN";

export interface AppUser {
  id: number;
  email: string;
  shopName: string;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  subscriptionEndsAt: string | null;
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

