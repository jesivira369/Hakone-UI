export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "GRACE" | "EXPIRED";

export interface AuthError {
  message: string;
}

export interface AuthData {
  email: string;
  password: string;
  shopName?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  shopName: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  subscriptionEndsAt: string | null;
}
