import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Bike, CheckCircle2, Circle } from "lucide-react";

// Datos del cliente: nunca se cachean ni se indexan. La vista previa al pegar el enlace en WhatsApp es genérica
// (no incluye nombre, bici ni taller).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seguimiento de tu bici",
  description: "Mirá el estado de tu bicicleta en el taller.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Seguimiento de tu bici",
    description: "Mirá el estado de tu bicicleta en el taller.",
    type: "website",
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface Tracking {
  shopName: string;
  number: number;
  clientFirstName: string;
  bike: string | null;
  description: string;
  status: "IN_REVIEW" | "QUOTED" | "SCHEDULED" | "IN_PROGRESS" | "READY" | "DELIVERED";
  statusLabel: string;
  statusText: string;
  estimatedDelivery: string | null;
  pickedUpAt: string | null;
  timeline: { label: string; at: string }[];
}

const STATUS_STYLE: Record<Tracking["status"], string> = {
  IN_REVIEW: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  QUOTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  SCHEDULED: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  READY: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
};

const folio = (n: number) => `#${String(n).padStart(4, "0")}`;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

async function loadTracking(code: string): Promise<Tracking | null> {
  // La API limita por IP: reenviamos la del cliente con el secreto compartido (si no, todos los clientes de
  // todos los talleres compartirían la IP de este servidor).
  const h = await headers();
  const forward: Record<string, string> = {};
  const secret = process.env.BFF_SECRET;
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (secret && ip) {
    forward["x-client-ip"] = ip;
    forward["x-bff-secret"] = secret;
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/public/tracking/${encodeURIComponent(code)}`, {
      cache: "no-store",
      headers: forward,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Tracking;
  } catch {
    return null;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-muted/40 px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-4">
        {children}
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Seguimiento con{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Hakone
          </Link>
        </p>
      </div>
    </main>
  );
}

export default async function TrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = await loadTracking(code);

  if (!t) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <Bike className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
          <h1 className="text-lg font-semibold">Este enlace ya no está disponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pedile uno nuevo al taller si todavía lo necesitás.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{t.shopName}</p>
          <h1 className="text-xl font-bold">Orden {folio(t.number)}</h1>
        </div>
        <Bike className="h-7 w-7 shrink-0 text-primary" aria-hidden />
      </header>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Estado">
        {t.clientFirstName && <p className="mb-3 text-sm text-muted-foreground">Hola {t.clientFirstName}</p>}
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[t.status]}`}>
          {t.statusLabel}
        </span>
        <p className="mt-3 text-base">
          {t.status === "DELIVERED" && t.pickedUpAt ? `Tu bici fue entregada el ${day(t.pickedUpAt)}.` : t.statusText}
        </p>
        {t.estimatedDelivery && t.status !== "DELIVERED" && t.status !== "READY" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Entrega estimada: <span className="font-medium text-foreground">{day(t.estimatedDelivery)}</span>
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Detalle">
        <dl className="space-y-3 text-sm">
          {t.bike && (
            <div>
              <dt className="text-muted-foreground">Bicicleta</dt>
              <dd className="font-medium">{t.bike}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Trabajo</dt>
            <dd className="font-medium">{t.description}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Línea de tiempo">
        <h2 className="mb-3 text-sm font-semibold">Recorrido</h2>
        <ol className="space-y-3">
          {t.timeline.map((step, i) => {
            const last = i === t.timeline.length - 1;
            return (
              <li key={`${step.label}-${step.at}`} className="flex items-start gap-3">
                {last ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className={`text-sm ${last ? "font-semibold" : ""}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground">{day(step.at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </Shell>
  );
}
