import { NextRequest } from "next/server";

// 4001 es el puerto de la API en desarrollo (ver PORT en Hakone-API/.env).
// En producción NEXT_PUBLIC_API_URL siempre viene seteada.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

// Si la API no responde, cortamos en lugar de dejar la conexión (y la RAM del servicio Next) colgada.
// El export de Excel arma un libro grande, por eso tiene un margen mayor.
const DEFAULT_TIMEOUT_MS = 30_000;
const EXPORT_TIMEOUT_MS = 120_000;

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ statusCode: status, message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function buildTargetUrl(req: NextRequest, pathParts: string[]) {
  const url = new URL(req.url);
  const target = new URL(`${API_URL}/api/v1/${pathParts.join("/")}`);
  target.search = url.search;
  return target;
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const targetUrl = buildTargetUrl(req, path);

  const token = req.cookies.get("token")?.value;

  const headers = new Headers(req.headers);
  headers.set("host", targetUrl.host);
  headers.delete("content-length");

  // Forward auth as Bearer so el backend no dependa de Cookie en rewrites.
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  } else {
    headers.delete("authorization");
  }

  // La API limita peticiones por IP. Todo el tráfico llega desde este servidor, así que reenviamos la IP real del
  // cliente junto con un secreto compartido (BFF_SECRET); la API solo confía en el header si el secreto coincide.
  headers.delete("x-client-ip");
  headers.delete("x-bff-secret");
  const bffSecret = process.env.BFF_SECRET;
  if (bffSecret) {
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) {
      headers.set("x-client-ip", forwarded);
      headers.set("x-bff-secret", bffSecret);
    }
  }

  // Evitar problemas con compresión y streaming en algunos entornos.
  headers.delete("accept-encoding");

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const timeoutMs = path[path.length - 1] === "export" ? EXPORT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return jsonError(504, "La API tardó demasiado en responder");
    }
    return jsonError(502, "No se pudo conectar con la API");
  }

  const resHeaders = new Headers(upstream.headers);

  // Set-Cookie es el único header que puede repetirse legítimamente, y `get()`
  // los devuelve unidos por coma —lo que corrompe cookies con `Expires`, que ya
  // llevan una coma adentro—. `getSetCookie()` los devuelve separados.
  const cookies = upstream.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    resHeaders.delete("set-cookie");
    for (const cookie of cookies) resHeaders.append("set-cookie", cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const PUT = proxy;
export const OPTIONS = proxy;

