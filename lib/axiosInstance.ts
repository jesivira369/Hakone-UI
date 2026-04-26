import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const publicApiRoutes = ["/auth/login", "/auth/register", "/auth/me", "/auth/logout"];
const publicPages = ["/login", "/register", "/register/success"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("No autorizado (401), redirigiendo al login...");

      if (
        typeof window !== "undefined" &&
        !publicPages.some((p) => window.location.pathname.startsWith(p)) &&
        !publicApiRoutes.some((route) => String(error.config?.url ?? "").includes(route))
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
