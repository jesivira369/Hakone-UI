"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Bike, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServiceStatusLabel, getServiceStatusStyle, URGENT_STYLE } from "@/lib/enums";

// Vista personal del mecánico: se abre desde un enlace guardado como acceso directo, sin iniciar sesión.
// No muestra precios ni teléfonos. Un enlace desconocido o vencido muestra siempre el mismo mensaje.

interface Item {
  id: number;
  number: number;
  description: string;
  status: string;
  isUrgent: boolean;
  deliveryAt: string | null;
  scheduledAt: string | null;
  clientName: string;
  bike: string | null;
}

interface Payload {
  mechanicName: string;
  shopName: string;
  services: Item[];
}

const MAIN_ACTIONS: { status: string; label: string }[] = [
  { status: "IN_PROGRESS", label: "En curso" },
  { status: "COMPLETED", label: "Completado" },
  { status: "BLOCKED", label: "Bloqueado" },
];
const OTHER_STATUSES: { status: string; label: string }[] = [
  { status: "IN_REVIEW", label: "En revisión" },
  { status: "QUOTED", label: "Presupuestado" },
  { status: "SCHEDULED", label: "Programado" },
];

const folio = (n: number) => `#${String(n).padStart(4, "0")}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

export default function MechanicPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/public/mechanic/${encodeURIComponent(token)}/services`, { cache: "no-store" });
      if (!res.ok) {
        setUnavailable(true);
        return;
      }
      setData((await res.json()) as Payload);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    // Al volver a abrir la app desde el acceso directo se refresca la lista (y se renueva la vigencia del enlace).
    const onVisible = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const changeStatus = async (item: Item, status: string) => {
    if (status === item.status) return;
    setBusyId(item.id);
    setErrors((e) => ({ ...e, [item.id]: "" }));
    try {
      const res = await fetch(`/api/v1/public/mechanic/${encodeURIComponent(token)}/services/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setErrors((e) => ({ ...e, [item.id]: body.message ?? "No se pudo cambiar el estado" }));
        return;
      }
      const updated = (await res.json()) as Item;
      setData((d) => (d ? { ...d, services: d.services.map((s) => (s.id === updated.id ? updated : s)) } : d));
    } catch {
      setErrors((e) => ({ ...e, [item.id]: "No se pudo cambiar el estado. Revisá tu conexión." }));
    } finally {
      setBusyId(null);
    }
  };

  if (unavailable && !data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
        <div className="max-w-sm rounded-2xl border bg-card p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
          <h1 className="text-lg font-semibold">Este enlace ya no está disponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pedile uno nuevo al dueño del taller.</p>
        </div>
      </main>
    );
  }

  const todo = (data?.services ?? []).filter((s) => s.status !== "COMPLETED");
  const ready = (data?.services ?? []).filter((s) => s.status === "COMPLETED");

  const renderCard = (item: Item) => (
    <li key={item.id} className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            Orden {folio(item.number)}
            {item.deliveryAt && <> · entrega {day(item.deliveryAt)}</>}
          </p>
          <p className="mt-0.5 text-base font-semibold">{item.description}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {item.clientName}
            {item.bike ? ` · ${item.bike}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getServiceStatusStyle(item.status).badge}`}>
            {getServiceStatusLabel(item.status)}
          </span>
          {item.isUrgent && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${URGENT_STYLE.badge}`}>Urgente</span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {MAIN_ACTIONS.map((a) => (
          <Button
            key={a.status}
            size="sm"
            variant={item.status === a.status ? "default" : "outline"}
            disabled={busyId === item.id || item.status === a.status}
            onClick={() => void changeStatus(item, a.status)}
            className="h-10 px-1 text-xs"
          >
            {a.label}
          </Button>
        ))}
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        Otro estado
        <select
          className="h-9 flex-1 rounded-md border bg-background px-2 text-sm text-foreground"
          value=""
          disabled={busyId === item.id}
          onChange={(e) => e.target.value && void changeStatus(item, e.target.value)}
        >
          <option value="">Elegir…</option>
          {OTHER_STATUSES.filter((o) => o.status !== item.status).map((o) => (
            <option key={o.status} value={o.status}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {errors[item.id] && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {errors[item.id]}
        </p>
      )}
    </li>
  );

  return (
    <main className="min-h-dvh bg-muted/40 px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{data?.shopName ?? " "}</p>
            <h1 className="truncate text-xl font-bold">{data ? `Hola ${data.mechanicName}` : "Cargando…"}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} aria-label="Actualizar">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
        </header>

        {data && todo.length === 0 && ready.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            <Bike className="mx-auto mb-2 h-7 w-7" aria-hidden />
            No tenés trabajos pendientes.
          </div>
        )}

        {todo.length > 0 && (
          <section aria-label="Para hacer">
            <h2 className="mb-2 px-1 text-sm font-semibold">Para hacer ({todo.length})</h2>
            <ul className="space-y-3">{todo.map(renderCard)}</ul>
          </section>
        )}

        {ready.length > 0 && (
          <section aria-label="Listos en el taller">
            <h2 className="mb-2 px-1 text-sm font-semibold">Listos en el taller ({ready.length})</h2>
            <ul className="space-y-3">{ready.map(renderCard)}</ul>
          </section>
        )}
      </div>
    </main>
  );
}
