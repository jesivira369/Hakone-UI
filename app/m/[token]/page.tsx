"use client";

import { Suspense, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Bike, ChevronDown, ChevronUp, PanelLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { JobCard } from "./JobCard";
import { JobDetail } from "./JobDetail";
import { JobFilters } from "./JobFilters";
import { DEFAULT_VIEW } from "./viewOptions";
import { StatusConfirmDialog, type PendingStatusChange } from "./StatusConfirmDialog";
import type { JobItem, Section } from "./types";
import { useJobDetail } from "./useJobDetail";
import { useMechanicJobs } from "./useMechanicJobs";

// Vista personal del mecánico: se abre desde un enlace guardado como acceso directo, sin iniciar sesión.
// En celular: lista y, al abrir un trabajo, su detalle a pantalla completa. En tablet y PC: lista y detalle lado a lado.
// Los montos se muestran en solo lectura (no en "En revisión") y nunca el costo. Un enlace desconocido o vencido
// muestra siempre el mismo mensaje.

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
  selectedId: number | null;
  /** Tablet y PC: tarjetas compactas, porque el detalle está en el panel de al lado. */
  compact: boolean;
  onLoadMore: () => void;
  onRequestStatus: (item: JobItem, status: string) => void;
  onOpen: (item: JobItem) => void;
}

function JobList({ items, hasMore, loading, busyId, selectedId, compact, onLoadMore, onRequestStatus, onOpen }: JobListProps) {
  return (
    <>
      <ul className="grid gap-3">
        {items.map((item) => (
          <JobCard
            key={item.id}
            item={item}
            busy={busyId === item.id}
            selected={selectedId === item.id}
            compact={compact}
            onRequestStatus={onRequestStatus}
            onOpen={onOpen}
          />
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

function MechanicWorkspace() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const jobs = useMechanicJobs(token);

  // El trabajo abierto vive en la URL (`?job=<id>`): el botón "atrás" del celular vuelve a la lista.
  const jobParam = Number(search.get("job"));
  const selectedId = Number.isInteger(jobParam) && jobParam > 0 ? jobParam : null;
  const detail = useJobDetail(token, selectedId);

  const wide = useMediaQuery("(min-width: 768px)");
  // En tablet (md) la lista se puede ocultar para dar todo el ancho al detalle; en PC (lg) siempre está.
  const [listHidden, setListHidden] = useState(false);

  // Cambio de estado esperando confirmación en el modal.
  const [pending, setPending] = useState<PendingStatusChange | null>(null);
  const requestStatus = (item: PendingStatusChange["item"], status: string) => {
    setPending({ item, status });
  };

  const open = (item: Pick<JobItem, "id">) => router.push(`${pathname}?job=${item.id}`, { scroll: false });
  const back = () => router.replace(pathname, { scroll: false });

  if (jobs.unavailable && !jobs.header) return <Unavailable />;

  const { sections, counts } = jobs;
  const hasMore = (section: Section) => sections[section].page < sections[section].totalPages;
  const initialLoad = !jobs.header;
  const noJobs = !initialLoad && counts.todo === 0 && counts.ready === 0;
  const filtering = jobs.view.status !== DEFAULT_VIEW.status;
  const todoMatching = sections.todo.matching;

  const listPane = (
    <div className="space-y-5">
      {noJobs && (
        <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          <Bike className="mx-auto mb-2 h-7 w-7" aria-hidden />
          No tienes trabajos pendientes.
        </div>
      )}

      {!initialLoad && !noJobs && <JobFilters view={jobs.view} onChange={jobs.changeView} />}

      {counts.todo > 0 && filtering && !sections.todo.loading && todoMatching === 0 && (
        <p className="rounded-2xl border bg-card p-4 text-center text-sm text-muted-foreground">
          Ningún trabajo tiene ese estado.
        </p>
      )}

      {counts.todo > 0 && (
        <section aria-label="Para hacer">
          <h2 className="mb-2 px-1 text-sm font-semibold">
            Para hacer ({filtering ? `${todoMatching} de ${counts.todo}` : counts.todo})
          </h2>
          <JobList
            items={sections.todo.items}
            hasMore={hasMore("todo")}
            loading={sections.todo.loading}
            busyId={jobs.busyId}
            selectedId={selectedId}
            compact={wide}
            onLoadMore={() => jobs.loadMore("todo")}
            onRequestStatus={requestStatus}
            onOpen={open}
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
                selectedId={selectedId}
                compact={wide}
                onLoadMore={() => jobs.loadMore("ready")}
                onRequestStatus={requestStatus}
                onOpen={open}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );

  const detailPane = (() => {
    if (selectedId === null) {
      return (
        <div className="hidden rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground md:block">
          Elige un trabajo de la lista para ver su detalle.
        </div>
      );
    }
    if (detail.unavailable) {
      return (
        <div className="space-y-3 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          <p>Este trabajo ya no está disponible.</p>
          <Button variant="outline" size="sm" onClick={back}>
            Volver a la lista
          </Button>
        </div>
      );
    }
    if (detail.loadError) {
      return (
        <div className="space-y-3 rounded-2xl border bg-card p-6 text-center text-sm">
          <p role="alert">{detail.loadError}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={detail.refresh}>
              Reintentar
            </Button>
            <Button variant="outline" size="sm" onClick={back}>
              Volver a la lista
            </Button>
          </div>
        </div>
      );
    }
    if (!detail.detail) {
      return (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground" aria-busy>
          Cargando…
        </div>
      );
    }
    return (
      <JobDetail
        key={detail.detail.id}
        token={token}
        detail={detail.detail}
        state={detail}
        busyStatus={jobs.busyId === detail.detail.id}
        onRequestStatus={(status) => requestStatus(detail.detail!, status)}
        onBack={back}
        onSaved={jobs.reload}
      />
    );
  })();

  return (
    <main className="min-h-dvh bg-muted/40 px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-md space-y-5 md:max-w-none lg:max-w-[1500px]">
        <header className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{jobs.header?.shopName ?? " "}</p>
            <h1 className="truncate text-xl font-bold">{jobs.header ? `Hola ${jobs.header.mechanicName}` : "Cargando…"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex lg:hidden"
              onClick={() => setListHidden((v) => !v)}
              aria-pressed={listHidden}
            >
              <PanelLeft size={16} className="mr-1.5" aria-hidden /> {listHidden ? "Mostrar lista" : "Ocultar lista"}
            </Button>
            <Button variant="outline" size="sm" onClick={jobs.reload} disabled={sections.todo.loading} aria-label="Actualizar">
              <RefreshCw size={16} className={sections.todo.loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </header>

        <div
          className={cn(
            "md:grid md:items-start md:gap-5 md:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)]",
            listHidden && "md:max-lg:grid-cols-1",
          )}
        >
          {/* Lista: en celular se oculta mientras hay un trabajo abierto. En PC cada panel tiene su propio scroll. */}
          <div
            className={cn(
              "md:max-h-[calc(100dvh-7.5rem)] md:overflow-y-auto md:pr-1",
              selectedId !== null && "hidden md:block",
              listHidden && "md:max-lg:hidden",
            )}
          >
            {listPane}
          </div>
          <div className="md:max-h-[calc(100dvh-7.5rem)] md:overflow-y-auto md:pr-1">{detailPane}</div>
        </div>
      </div>

      <StatusConfirmDialog
        change={pending}
        onConfirm={async ({ item, status }) => {
          const error = await jobs.changeStatus(item, status);
          if (!error) detail.refresh();
          return error;
        }}
        onClose={() => setPending(null)}
      />
    </main>
  );
}

export default function MechanicPage() {
  // `useSearchParams` exige un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <MechanicWorkspace />
    </Suspense>
  );
}
