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

export default api;
