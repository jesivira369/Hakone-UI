import api from "./axiosInstance";
import Cookies from "js-cookie";
import axios from "axios";
import jwt, { JwtPayload } from "jsonwebtoken";

export const login = async (email: string, password: string) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });

    Cookies.set("token", data.accessToken, { expires: 1 });

    const decoded = jwt.decode(data.accessToken) as JwtPayload | null;
    if (!decoded) throw new Error("Token inválido");

    Cookies.set("user", JSON.stringify(decoded), { expires: 1 });

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Error al iniciar sesión"
      );
    }
    throw new Error("Error desconocido al iniciar sesión");
  }
};

export const register = async (
  email: string,
  password: string,
  shopName?: string
) => {
  try {
    await api.post("/auth/register", { email, password, shopName });
    return { success: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Error al registrarse");
    }
    throw new Error("Error desconocido al registrarse");
  }
};

export const logout = () => {
  Cookies.remove("token");
  Cookies.remove("user");
  window.location.href = "/login";
};

export const getToken = (): string | null => Cookies.get("token") || null;

export const getUser = (): JwtPayload | null => {
  const user = Cookies.get("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded || !decoded.exp) return false;

    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      logout();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al validar token", error);
    return false;
  }
};

export const verifyToken = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded || !decoded.exp) return false;

    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Error al validar token", error);
    return false;
  }
};
