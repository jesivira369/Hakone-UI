"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServiceStatusLabel, getServiceStatusStyle, URGENT_STYLE } from "@/lib/enums";
import { dateInputToIso, isoToDateInput } from "@/lib/utils/formatDate";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatFolio } from "@/lib/whatsapp";
import type { JobFieldsPatch } from "./api";
import { MechanicReadyWhatsApp } from "./MechanicReadyWhatsApp";
import { PartsEditor } from "./PartsEditor";
import { StatusActions } from "./StatusActions";
import type { JobDetail as JobDetailData } from "./types";
import type { useJobDetail } from "./useJobDetail";

type DetailState = ReturnType<typeof useJobDetail>;

interface Draft {
  description: string;
  notes: string;
  scheduledAt: string;
  deliveryAt: string;
}

const toDraft = (d: JobDetailData): Draft => ({
  description: d.description,
  notes: d.notes ?? "",
  scheduledAt: isoToDateInput(d.scheduledAt),
  deliveryAt: isoToDateInput(d.deliveryAt),
});

const textareaClass =
  "mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface JobDetailProps {
  token: string;
  detail: JobDetailData;
  state: DetailState;
  busyStatus: boolean;
  onRequestStatus: (status: string) => void;
  /** Vuelve a la lista (en celular el detalle ocupa toda la pantalla). */
  onBack: () => void;
  /** Se llama tras guardar campos, para que la lista refleje la descripción y las fechas nuevas. */
  onSaved: () => void;
}

/** Panel de detalle del trabajo: estado, descripción, notas, fechas, repuestos y montos en solo lectura. */
export function JobDetail({ token, detail, state, busyStatus, onRequestStatus, onBack, onSaved }: JobDetailProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(detail));
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  // Cuando el detalle cambia (repuestos, estado, otra pestaña) se actualizan solo los campos que el mecánico NO está
  // editando: lo que escribió y todavía no guardó no se pisa.
  const previous = useRef(detail);
  useEffect(() => {
    const before = toDraft(previous.current);
    const next = toDraft(detail);
    setDraft((d) => ({
      description: d.description === before.description ? next.description : d.description,
      notes: d.notes === before.notes ? next.notes : d.notes,
      scheduledAt: d.scheduledAt === before.scheduledAt ? next.scheduledAt : d.scheduledAt,
      deliveryAt: d.deliveryAt === before.deliveryAt ? next.deliveryAt : d.deliveryAt,
    }));
    previous.current = detail;
  }, [detail]);

  const saved = toDraft(detail);
  const dirty = (Object.keys(saved) as (keyof Draft)[]).some((k) => draft[k] !== saved[k]);
  const editable = detail.editable;
  const setField = (field: keyof Draft, value: string) => {
    setMessage(null);
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const save = async () => {
    const patch: JobFieldsPatch = {};
    if (draft.description !== saved.description) patch.description = draft.description.trim();
    if (draft.notes !== saved.notes) patch.notes = draft.notes.trim() || null;
    if (draft.scheduledAt !== saved.scheduledAt) patch.scheduledAt = dateInputToIso(draft.scheduledAt);
    if (draft.deliveryAt !== saved.deliveryAt) patch.deliveryAt = dateInputToIso(draft.deliveryAt);

    const result = await state.saveFields(patch);
    if (result.ok) {
      setMessage({ kind: "info", text: "Cambios guardados." });
      onSaved();
    } else if (result.conflict) {
      // El servicio cambió mientras se editaba: ya se recargó con lo vigente y no se pisó nada.
      if (result.current) setDraft(toDraft(result.current));
      setMessage({ kind: "info", text: `${result.message} Vuelve a hacer tu cambio si hace falta.` });
    } else {
      setMessage({ kind: "error", text: result.message ?? "No se pudo guardar" });
    }
  };

  const pricesVisible = detail.cost !== null;

  return (
    <article className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm md:p-6" aria-label={`Trabajo ${formatFolio(detail.number)}`}>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onBack} aria-label="Volver a la lista" className="md:hidden">
              <ArrowLeft size={16} />
            </Button>
            <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xl font-bold leading-none text-primary">
              {formatFolio(detail.number)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1">
            {detail.isUrgent && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${URGENT_STYLE.badge}`}>Urgente</span>
            )}
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getServiceStatusStyle(detail.status).badge}`}>
              {getServiceStatusLabel(detail.status)}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {detail.clientName}
          {detail.bike ? ` · ${detail.bike}` : ""}
        </p>
        {editable ? (
          <StatusActions status={detail.status} busy={busyStatus} onRequest={onRequestStatus} large />
        ) : (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Este servicio ya está cerrado: no se puede editar desde aquí. Avisa al dueño si hay que corregir algo.
          </p>
        )}
        <MechanicReadyWhatsApp token={token} detail={detail} />
      </header>

      <section aria-label="Datos del trabajo" className="space-y-4">
        <label className="block text-xs font-medium text-muted-foreground">
          Descripción
          <textarea
            className={textareaClass}
            rows={3}
            maxLength={2000}
            value={draft.description}
            disabled={!editable}
            onChange={(e) => setField("description", e.target.value)}
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Notas del taller (no las ve el cliente)
          <textarea
            className={textareaClass}
            rows={3}
            maxLength={2000}
            placeholder="Diagnóstico, pendientes, avisos para el resto del taller…"
            value={draft.notes}
            disabled={!editable}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Fecha programada
            <Input
              type="date"
              className="mt-1 h-10"
              value={draft.scheduledAt}
              disabled={!editable}
              onChange={(e) => setField("scheduledAt", e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Fecha de entrega
            <Input
              type="date"
              className="mt-1 h-10"
              value={draft.deliveryAt}
              disabled={!editable}
              onChange={(e) => setField("deliveryAt", e.target.value)}
            />
          </label>
        </div>

        {editable && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void save()} disabled={!dirty || state.saving || draft.description.trim().length < 3}>
              <Save size={16} className="mr-1.5" aria-hidden /> {state.saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            {dirty && <span className="text-xs text-muted-foreground">Tienes cambios sin guardar.</span>}
          </div>
        )}
        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={
              message.kind === "error"
                ? "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "rounded-md bg-muted px-3 py-2 text-sm"
            }
          >
            {message.text}
          </p>
        )}
      </section>

      <PartsEditor
        parts={detail.parts}
        pricesVisible={pricesVisible}
        editable={editable}
        saving={state.saving}
        onAdd={state.addPart}
        onEdit={state.editPart}
        onRemove={state.removePart}
      />

      {detail.cost && (
        <section aria-label="Montos" className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Montos (solo lectura)</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Mano de obra</dt>
              <dd className="tabular-nums">{formatCurrency(detail.cost.labor)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Repuestos</dt>
              <dd className="tabular-nums">{formatCurrency(detail.cost.parts)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t pt-1 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(detail.cost.total)}</dd>
            </div>
          </dl>
        </section>
      )}
    </article>
  );
}
