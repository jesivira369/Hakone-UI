import { SORT_OPTIONS, STATUS_FILTER_OPTIONS, type JobSort, type JobView, type StatusFilter } from "./viewOptions";

interface JobFiltersProps {
  view: JobView;
  onChange: (view: JobView) => void;
}

const selectClass = "h-10 w-full rounded-md border bg-background px-2 text-sm text-foreground";

/** Orden de la lista (urgentes primero, fechas, estado) y filtro por estado. Se recuerdan en el dispositivo. */
export function JobFilters({ view, onChange }: JobFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="min-w-0 text-xs font-medium text-muted-foreground">
        Ordenar por
        <select
          className={`${selectClass} mt-1`}
          value={view.sort}
          onChange={(e) => onChange({ ...view, sort: e.target.value as JobSort })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 text-xs font-medium text-muted-foreground">
        Estado
        <select
          className={`${selectClass} mt-1`}
          value={view.status}
          onChange={(e) => onChange({ ...view, status: e.target.value as StatusFilter })}
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
