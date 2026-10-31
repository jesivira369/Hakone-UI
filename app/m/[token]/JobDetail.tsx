"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServiceStatusLabel, getServiceStatusStyle, URGENT_STYLE } from "@/lib/enums";
import { dateInputToIso, isoToDateInput } from "@/lib/utils/formatDate";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatFolio } from "@/lib/whatsapp";
import type { JobSavePatch } from "./api";
import { diffParts, toDraftParts, type DraftPart } from "./jobDraft";
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
  /** Se llama tras guardar, para que la lista refleje la descripción y las fechas nuevas. */
  onSaved: () => void;
  /** Avisa si hay cambios sin guardar, para pedir confirmación antes de salir del trabajo. */
  onDirtyChange: (dirty: boolean) => void;
}

/**
 * Panel de detalle del trabajo. NO guarda solo: descripción, notas, fechas y repuestos se editan en pantalla y se
 * mandan juntos, en un único pedido, con "Guardar cambios". Así un taller no escribe en la base por cada toque.
 */
export function JobDetail({ token, detail, state, busyStatus, onRequestStatus, onBack, onSaved, onDirtyChange }: JobDetailProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(detail));
  const [partsDraft, setPartsDraft] = useState<DraftPart[]>(() => toDraftParts(detail.parts));
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  // Cuando el detalle cambia por fuera (se cambió el estado, el dueño editó, otra pestaña) se actualiza solo lo que el
  // mecánico NO está editando: lo que escribió y todavía no guardó no se pisa.
  const previous = useRef(detail);
  useEffect(() => {
    const before = toDraft(previous.current);
    const next = toDraft(detail);
    const beforeParts = previous.current.parts;
    setDraft((d) => ({
      description: d.description === before.description ? next.description : d.description,
      notes: d.notes === before.notes ? next.notes : d.notes,
      scheduledAt: d.scheduledAt === before.scheduledAt ? next.scheduledAt : d.scheduledAt,
      deliveryAt: d.deliveryAt === before.deliveryAt ? next.deliveryAt : d.deliveryAt,
    }));
    setPartsDraft((d) => (diffParts(beforeParts, d) ? d : toDraftParts(detail.parts)));
    previous.current = detail;
  }, [detail]);

  const saved = toDraft(detail);
  const fieldsDirty = (Object.keys(saved) as (keyof Draft)[]).some((k) => draft[k] !== saved[k]);
  const partsDiff = diffParts(detail.parts, partsDraft);
  const dirty = fieldsDirty || partsDiff !== null;
  const editable = detail.editable;
  const pricesVisible = detail.cost !== null;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  // Al cerrar el panel ya no quedan cambios pendientes.
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  // Evita perder lo escrito al cerrar o recargar la pestaña.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setField = (field: keyof Draft, value: string) => {
    setMessage(null);
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const changePartsDraft = (parts: DraftPart[]) => {
    setMessage(null);
    setPartsDraft(parts);
  };

  const discard = () => {
    setDraft(toDraft(detail));
    setPartsDraft(toDraftParts(detail.parts));
    setMessage(null);
  };

  const save = async () => {
    const patch: JobSavePatch = {};
    if (draft.description !== saved.description) patch.description = draft.description.trim();
    if (draft.notes !== saved.notes) patch.notes = draft.notes.trim() || null;
    if (draft.scheduledAt !== saved.scheduledAt) patch.scheduledAt = dateInputToIso(draft.scheduledAt);
    if (draft.deliveryAt !== saved.deliveryAt) patch.deliveryAt = dateInputToIso(draft.deliveryAt);
    if (partsDiff) patch.parts = partsDiff;

    const result = await state.save(patch);
    if (result.ok && result.current) {
      setDraft(toDraft(result.current));
      setPartsDraft(toDraftParts(result.current.parts));
      setMessage({ kind: "info", text: "Cambios guardados." });
      onSaved();
    } else if (result.conflict && result.current) {
      // El servicio cambió mientras se editaba: ya se recargó con lo vigente y no se pisó nada.
      setDraft(toDraft(result.current));
      setPartsDraft(toDraftParts(result.current.parts));
      setMessage({ kind: "info", text: `${result.message} Vuelve a hacer tu cambio si hace falta.` });
    } else {
      setMessage({ kind: "error", text: result.message ?? "No se pudo guardar" });
    }
  };

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
      </section>

      <PartsEditor parts={partsDraft} pricesVisible={pricesVisible} editable={editable} onChange={changePartsDraft} />

      {detail.cost && (
        <section aria-label="Montos" className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Montos (solo lectura{partsDiff ? "; se actualizan al guardar" : ""})
          </p>
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
      {editable && (
        // Barra fija abajo: el guardado es siempre manual y es un solo botón para todo lo que se cambió.
        <div className="sticky bottom-0 -mx-4 -mb-4 space-y-2 rounded-b-2xl border-t bg-card/95 px-4 py-3 backdrop-blur md:-mx-6 md:-mb-6 md:px-6">
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || state.saving || draft.description.trim().length < 3}
            >
              <Save size={16} className="mr-1.5" aria-hidden /> {state.saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="outline" onClick={discard} disabled={!dirty || state.saving}>
              <RotateCcw size={16} className="mr-1.5" aria-hidden /> Descartar
            </Button>
            <span className="text-xs text-muted-foreground">
              {dirty ? "Tienes cambios sin guardar." : "Nada pendiente de guardar."}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
