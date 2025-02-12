export interface AuthError {
  message: string;
}

export interface AuthData {
  email: string;
  password: string;
  shopName?: string;
}
