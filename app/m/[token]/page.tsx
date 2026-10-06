"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Bike, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "./JobCard";
import { StatusConfirmDialog, type PendingStatusChange } from "./StatusConfirmDialog";
import type { JobItem, Section } from "./types";
import { useMechanicJobs } from "./useMechanicJobs";

// Vista personal del mecánico: se abre desde un enlace guardado como acceso directo, sin iniciar sesión.
// No muestra precios ni teléfonos. Un enlace desconocido o vencido muestra siempre el mismo mensaje.

function Unavailable() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="max-w-sm rounded-2xl border bg-card p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">Este enlace ya no está disponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pide uno nuevo al dueño del taller.</p>
      </div>
    </main>
  );
}

interface JobListProps {
  items: JobItem[];
  hasMore: boolean;
  loading: boolean;
  busyId: number | null;
  onLoadMore: () => void;
  onRequestStatus: (item: JobItem, status: string) => void;
}

function JobList({ items, hasMore, loading, busyId, onLoadMore, onRequestStatus }: JobListProps) {
  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => (
          <JobCard key={item.id} item={item} busy={busyId === item.id} onRequestStatus={onRequestStatus} />
        ))}
      </ul>
      {hasMore && (
        <Button variant="outline" className="mt-3 w-full" onClick={onLoadMore} disabled={loading}>
          {loading ? "Cargando…" : "Ver más"}
        </Button>
      )}
    </>
  );
}

export default function MechanicPage() {
  const { token } = useParams<{ token: string }>();
  const jobs = useMechanicJobs(token);
  // Cambio de estado esperando confirmación en el modal.
  const [pending, setPending] = useState<PendingStatusChange | null>(null);
  const requestStatus = (item: JobItem, status: string) => {
    if (status !== item.status) setPending({ item, status });
  };

  if (jobs.unavailable && !jobs.header) return <Unavailable />;

  const { sections, counts } = jobs;
  const hasMore = (section: Section) => sections[section].page < sections[section].totalPages;
  const initialLoad = !jobs.header;
  const noJobs = !initialLoad && counts.todo === 0 && counts.ready === 0;

  return (
    <main className="min-h-dvh bg-muted/40 px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{jobs.header?.shopName ?? " "}</p>
            <h1 className="truncate text-xl font-bold">{jobs.header ? `Hola ${jobs.header.mechanicName}` : "Cargando…"}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={jobs.reload} disabled={sections.todo.loading} aria-label="Actualizar">
            <RefreshCw size={16} className={sections.todo.loading ? "animate-spin" : ""} />
          </Button>
        </header>

        {noJobs && (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            <Bike className="mx-auto mb-2 h-7 w-7" aria-hidden />
            No tienes trabajos pendientes.
          </div>
        )}

        {counts.todo > 0 && (
          <section aria-label="Para hacer">
            <h2 className="mb-2 px-1 text-sm font-semibold">Para hacer ({counts.todo})</h2>
            <JobList
              items={sections.todo.items}
              hasMore={hasMore("todo")}
              loading={sections.todo.loading}
              busyId={jobs.busyId}
              onLoadMore={() => jobs.loadMore("todo")}
              onRequestStatus={requestStatus}
            />
          </section>
        )}

        {counts.ready > 0 && (
          <section aria-label="Listos en el taller">
            <button
              type="button"
              onClick={jobs.toggleReady}
              aria-expanded={jobs.readyOpen}
              className="flex w-full items-center justify-between px-1 text-sm font-semibold"
            >
              Listos en el taller ({counts.ready})
              {jobs.readyOpen ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
            </button>
            {jobs.readyOpen && (
              <div className="mt-2">
                <JobList
                  items={sections.ready.items}
                  hasMore={hasMore("ready")}
                  loading={sections.ready.loading}
                  busyId={jobs.busyId}
                  onLoadMore={() => jobs.loadMore("ready")}
                  onRequestStatus={requestStatus}
                />
              </div>
            )}
          </section>
        )}
      </div>

      <StatusConfirmDialog
        change={pending}
        onConfirm={({ item, status }) => jobs.changeStatus(item, status)}
        onClose={() => setPending(null)}
      />
    </main>
  );
}
