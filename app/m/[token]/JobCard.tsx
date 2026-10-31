import { cn } from "@/lib/utils";
import { getServiceStatusLabel, getServiceStatusStyle, URGENT_STYLE } from "@/lib/enums";
import { formatFolio } from "@/lib/whatsapp";
import { StatusActions } from "./StatusActions";
import type { JobItem } from "./types";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

interface JobCardProps {
  item: JobItem;
  busy: boolean;
  /** Pide confirmar el cambio; la tarjeta no cambia el estado por sí sola. */
  onRequestStatus: (item: JobItem, status: string) => void;
  /** Abre el trabajo en el panel de detalle. */
  onOpen: (item: JobItem) => void;
  /** Es el trabajo abierto en el panel (solo se resalta en tablet y PC). */
  selected?: boolean;
  /** Modo lista de tablet y PC: sin repuestos ni botones de estado, que viven en el panel de detalle. */
  compact?: boolean;
}

/**
 * Un trabajo del mecánico. Prioriza la información: orden, estado, descripción completa y repuestos; los botones de
 * estado son chicos y secundarios (cada cambio se confirma en un modal).
 */
export function JobCard({ item, busy, onRequestStatus, onOpen, selected = false, compact = false }: JobCardProps) {
  return (
    <li
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm",
        compact && "cursor-pointer transition-colors hover:bg-accent/40",
        selected && "border-primary ring-1 ring-primary",
      )}
      onClick={compact ? () => onOpen(item) : undefined}
    >
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
      <p className={cn("mt-3 whitespace-pre-line break-words text-lg font-semibold leading-snug", compact && "line-clamp-3")}>
        {item.description}
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        {item.clientName}
        {item.bike ? ` · ${item.bike}` : ""}
      </p>
      {item.deliveryAt && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          Entrega: <span className="font-medium text-foreground">{shortDate(item.deliveryAt)}</span>
        </p>
      )}

      {!compact && item.parts.length > 0 && (
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

      {compact ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(item);
          }}
          aria-pressed={selected}
          className="mt-3 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:underline"
        >
          {selected ? "Abierto" : "Abrir"}
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusActions status={item.status} busy={busy} onRequest={(status) => onRequestStatus(item, status)} />
          <button
            type="button"
            onClick={() => onOpen(item)}
            className="ml-auto text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:underline"
          >
            Ver detalle
          </button>
        </div>
      )}
    </li>
  );
}
