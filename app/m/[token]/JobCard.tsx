import { Button } from "@/components/ui/button";
import { getServiceStatusLabel, getServiceStatusStyle, URGENT_STYLE } from "@/lib/enums";
import { formatFolio } from "@/lib/whatsapp";
import type { JobItem } from "./types";

const MAIN_ACTIONS = [
  { status: "IN_PROGRESS", label: "En curso" },
  { status: "COMPLETED", label: "Completado" },
  { status: "BLOCKED", label: "Bloqueado" },
] as const;

const OTHER_STATUSES = [
  { status: "IN_REVIEW", label: "En revisión" },
  { status: "QUOTED", label: "Presupuestado" },
  { status: "SCHEDULED", label: "Programado" },
] as const;

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

interface JobCardProps {
  item: JobItem;
  busy: boolean;
  error?: string;
  onChangeStatus: (item: JobItem, status: string) => void;
}

/** Un trabajo del mecánico: qué hay que hacer y botones grandes para cambiar el estado desde el celular. */
export function JobCard({ item, busy, error, onChangeStatus }: JobCardProps) {
  return (
    <li className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            Orden {formatFolio(item.number)}
            {item.deliveryAt && <> · entrega {shortDate(item.deliveryAt)}</>}
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
        {MAIN_ACTIONS.map((action) => (
          <Button
            key={action.status}
            size="sm"
            variant={item.status === action.status ? "default" : "outline"}
            disabled={busy || item.status === action.status}
            onClick={() => onChangeStatus(item, action.status)}
            className="h-10 px-1 text-xs"
          >
            {action.label}
          </Button>
        ))}
      </div>

      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        Otro estado
        <select
          className="h-9 flex-1 rounded-md border bg-background px-2 text-sm text-foreground"
          value=""
          disabled={busy}
          onChange={(e) => e.target.value && onChangeStatus(item, e.target.value)}
        >
          <option value="">Elegir…</option>
          {OTHER_STATUSES.filter((o) => o.status !== item.status).map((o) => (
            <option key={o.status} value={o.status}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
    </li>
  );
}
