import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // El token vive en cookie HttpOnly; aquí solo gateamos presencia.
  // La validación real (exp/firma/claims) ocurre en el backend.
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // Registro deshabilitado: redirige siempre a login.
  if (path === "/register" || path.startsWith("/register/")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/calendar") ||
    path.startsWith("/clients") ||
    path.startsWith("/bikes") ||
    path.startsWith("/services") ||
    path.startsWith("/mechanics");

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/register/:path*",
    "/dashboard/:path*",
    "/calendar/:path*",
    "/clients/:path*",
    "/bikes/:path*",
    "/services/:path*",
    "/mechanics/:path*",
  ],
};
