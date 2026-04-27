import { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

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

  // Evitar problemas con compresión y streaming en algunos entornos.
  headers.delete("accept-encoding");

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const resHeaders = new Headers(upstream.headers);
  // Asegura que Set-Cookie pase (login/logout).
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) resHeaders.set("set-cookie", setCookie);

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

