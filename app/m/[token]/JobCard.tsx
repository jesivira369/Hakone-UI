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
  /** Pide confirmar el cambio; la tarjeta no cambia el estado por sí sola. */
  onRequestStatus: (item: JobItem, status: string) => void;
}

/**
 * Un trabajo del mecánico. Prioriza la información: orden, estado, descripción completa y repuestos; los botones de
 * estado son chicos y secundarios (cada cambio se confirma en un modal).
 */
export function JobCard({ item, busy, onRequestStatus }: JobCardProps) {
  return (
    <li className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-lg font-bold leading-none text-primary">
          {formatFolio(item.number)}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {item.isUrgent && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${URGENT_STYLE.badge}`}>Urgente</span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getServiceStatusStyle(item.status).badge}`}>
            {getServiceStatusLabel(item.status)}
          </span>
        </div>
      </div>

      {/* Descripción completa (sin recortar): es lo que el mecánico tiene que hacer */}
      <p className="mt-3 whitespace-pre-line break-words text-lg font-semibold leading-snug">{item.description}</p>

      <p className="mt-2 text-sm text-muted-foreground">
        {item.clientName}
        {item.bike ? ` · ${item.bike}` : ""}
      </p>
      {item.deliveryAt && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          Entrega: <span className="font-medium text-foreground">{shortDate(item.deliveryAt)}</span>
        </p>
      )}

      {item.parts.length > 0 && (
        <div className="mt-3 rounded-lg bg-muted/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repuestos</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {item.parts.map((part, i) => (
              <li key={`${part.name}-${i}`} className="flex gap-2">
                <span className="w-8 shrink-0 font-semibold tabular-nums">{part.quantity}×</span>
                <span className="min-w-0 break-words">{part.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {MAIN_ACTIONS.map((action) => (
          <Button
            key={action.status}
            size="sm"
            variant={item.status === action.status ? "default" : "outline"}
            disabled={busy || item.status === action.status}
            onClick={() => onRequestStatus(item, action.status)}
            className="h-8 px-2.5 text-xs"
          >
            {action.label}
          </Button>
        ))}
        <select
          aria-label="Otro estado"
          className="h-8 rounded-md border bg-background px-1.5 text-xs text-foreground"
          value=""
          disabled={busy}
          onChange={(e) => e.target.value && onRequestStatus(item, e.target.value)}
        >
          <option value="">Otro…</option>
          {OTHER_STATUSES.filter((o) => o.status !== item.status).map((o) => (
            <option key={o.status} value={o.status}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}
