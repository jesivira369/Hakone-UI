export interface AuthError {
  message: string;
}

export interface AuthData {
  email: string;
  password: string;
  shopName?: string;
}

export interface AuthUser {
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  shopName?: string;
}
