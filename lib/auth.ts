import api from "./axiosInstance";
import Cookies from "js-cookie";
import axios from "axios";

export const login = async (email: string, password: string) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    Cookies.set("token", data.token, { expires: 1 });
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
  window.location.href = "/login";
};

export const getToken = () => Cookies.get("token");

export const isAuthenticated = () => {
  const token = Cookies.get("token");
  return Boolean(token);
};
