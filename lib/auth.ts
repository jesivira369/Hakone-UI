import api from "./axiosInstance";
import Cookies from "js-cookie";

export const login = async (email: string, password: string) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    Cookies.set("token", data.token, { expires: 1 });
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error al iniciar sesión");
  }
};

export const register = async (email: string, password: string) => {
  try {
    const { data } = await api.post("/auth/register", { email, password });
    Cookies.set("token", data.token, { expires: 1 });
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error al registrarse");
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
