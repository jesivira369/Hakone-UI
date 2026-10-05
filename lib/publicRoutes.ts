/**
 * Rutas que se ven sin sesión. El AuthProvider no consulta `/auth/me` en ellas (si lo hiciera, el 401 redirigiría
 * a /login): `/s/{código}` es el seguimiento del cliente y `/m/{token}` la vista del mecánico, ambas sin login.
 * `middleware.ts` solo protege los prefijos del panel, por eso estas no hace falta listarlas allí.
 */
const PUBLIC_PREFIXES = ["/login", "/register", "/contact", "/privacidad", "/terminos", "/s/", "/m/"];

export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}
