import { Button } from "@/components/ui/button";

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

interface StatusActionsProps {
  status: string;
  busy: boolean;
  /** Pide confirmar el cambio; este componente no cambia el estado por sí solo. */
  onRequest: (status: string) => void;
  /** Botones más grandes para el panel de detalle en tablet y PC. */
  large?: boolean;
}

/** Botones de estado del mecánico: nunca llegan a "Pagado" ni "Cancelado" (eso es del dueño). */
export function StatusActions({ status, busy, onRequest, large = false }: StatusActionsProps) {
  const size = large ? "h-10 px-4 text-sm" : "h-8 px-2.5 text-xs";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {MAIN_ACTIONS.map((action) => (
        <Button
          key={action.status}
          size="sm"
          variant={status === action.status ? "default" : "outline"}
          disabled={busy || status === action.status}
          onClick={() => onRequest(action.status)}
          className={size}
        >
          {action.label}
        </Button>
      ))}
      <select
        aria-label="Otro estado"
        className={`rounded-md border bg-background px-1.5 text-foreground ${large ? "h-10 text-sm" : "h-8 text-xs"}`}
        value=""
        disabled={busy}
        onChange={(e) => e.target.value && onRequest(e.target.value)}
      >
        <option value="">Otro…</option>
        {OTHER_STATUSES.filter((o) => o.status !== status).map((o) => (
          <option key={o.status} value={o.status}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
