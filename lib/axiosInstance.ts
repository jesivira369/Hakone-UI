import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const publicRoutes = ["/auth/login", "/auth/register"];

api.interceptors.request.use(
  (config) => {
    if (!publicRoutes.some((route) => config.url?.includes(route))) {
      const token = Cookies.get("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expirado, redirigiendo al login...");

      Cookies.remove("token");
      Cookies.remove("user");

      if (
        !publicRoutes.some((route) => window.location.pathname.includes(route))
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
