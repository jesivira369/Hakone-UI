import api from "./axiosInstance";
import axios from "axios";

export const login = async (email: string, password: string) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    // El backend setea cookie HttpOnly "token". Aquí solo devolvemos el usuario.
    return data as { user: { id: number; email: string; shopName: string; role: string } };
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
  // Mejor esfuerzo: limpia cookie en backend y luego redirige.
  api.post("/auth/logout").finally(() => {
    window.location.href = "/login";
  });
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data as { user: { id: number; email: string; shopName: string; role: string } };
};
