"use client";

import { useState } from "react";
import { Check, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { PartInput } from "./api";
import type { JobPart } from "./types";
import type { EditResult } from "./useJobDetail";

interface PartsEditorProps {
  parts: JobPart[];
  /** `false` en "En revisión": los montos están ocultos y no se cargan precios. */
  pricesVisible: boolean;
  editable: boolean;
  saving: boolean;
  onAdd: (part: PartInput) => Promise<EditResult>;
  onEdit: (partId: number, patch: Partial<PartInput>) => Promise<EditResult>;
  onRemove: (partId: number) => Promise<EditResult>;
}

const MAX_QUANTITY = 1000;

/** Repuestos del trabajo: el mecánico los agrega, cambia cantidades, corrige o borra cualquiera. */
export function PartsEditor({ parts, pricesVisible, editable, saving, onAdd, onEdit, onRemove }: PartsEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const report = (result: EditResult) => {
    setError(result.ok ? null : (result.message ?? "No se pudo guardar"));
    return result.ok;
  };

  return (
    <section aria-label="Repuestos" className="space-y-3">
      <h3 className="text-sm font-semibold">Repuestos ({parts.length})</h3>

      {parts.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay repuestos cargados.</p>}

      <ul className="divide-y rounded-xl border bg-card">
        {parts.map((part) =>
          editingId === part.id ? (
            <PartEditRow
              key={part.id}
              part={part}
              pricesVisible={pricesVisible}
              saving={saving}
              onCancel={() => setEditingId(null)}
              onSave={async (patch) => {
                if (report(await onEdit(part.id, patch))) setEditingId(null);
              }}
            />
          ) : (
            <li key={part.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={`Restar una unidad de ${part.name}`}
                  disabled={!editable || saving || part.quantity <= 1}
                  onClick={async () => report(await onEdit(part.id, { quantity: part.quantity - 1 }))}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-9 text-center font-semibold tabular-nums">{part.quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={`Sumar una unidad de ${part.name}`}
                  disabled={!editable || saving || part.quantity >= MAX_QUANTITY}
                  onClick={async () => report(await onEdit(part.id, { quantity: part.quantity + 1 }))}
                >
                  <Plus size={14} />
                </Button>
              </div>

              <div className="order-first min-w-0 basis-full lg:order-none lg:basis-0 lg:flex-1">
                <p className="break-words text-sm font-medium">{part.name}</p>
                <p className="text-xs text-muted-foreground">
                  {part.addedBy === "MECHANIC" ? "Cargado por mecánico" : "Cargado por el taller"}
                  {pricesVisible && part.unitPrice !== undefined && ` · ${formatCurrency(part.unitPrice)} c/u`}
                </p>
              </div>

              {editable && removingId === part.id ? (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-sm">¿Borrar?</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={saving}
                    onClick={async () => {
                      if (report(await onRemove(part.id))) setRemovingId(null);
                    }}
                  >
                    Sí
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setRemovingId(null)}>
                    No
                  </Button>
                </div>
              ) : (
                editable && (
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label={`Editar ${part.name}`}
                      disabled={saving}
                      onClick={() => {
                        setError(null);
                        setEditingId(part.id);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      aria-label={`Borrar ${part.name}`}
                      disabled={saving}
                      onClick={() => setRemovingId(part.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )
              )}
            </li>
          ),
        )}
      </ul>

      {editable && <AddPartForm pricesVisible={pricesVisible} saving={saving} onAdd={onAdd} onResult={report} />}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}

interface PartEditRowProps {
  part: JobPart;
  pricesVisible: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (patch: Partial<PartInput>) => Promise<void>;
}

function PartEditRow({ part, pricesVisible, saving, onCancel, onSave }: PartEditRowProps) {
  const [name, setName] = useState(part.name);
  const [quantity, setQuantity] = useState<number | null>(part.quantity);
  const [price, setPrice] = useState<number | null>(part.unitPrice ?? null);

  const canEditPrice = pricesVisible && part.editablePrice;
  const valid = name.trim().length > 0 && quantity !== null && quantity >= 1;

  const submit = () => {
    if (!valid || quantity === null) return;
    const patch: Partial<PartInput> = {};
    if (name.trim() !== part.name) patch.name = name.trim();
    if (quantity !== part.quantity) patch.quantity = quantity;
    if (canEditPrice && price !== null && price !== part.unitPrice) patch.unitPrice = price;
    if (Object.keys(patch).length === 0) onCancel();
    else void onSave(patch);
  };

  return (
    <li className="space-y-2 bg-muted/40 p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_5rem_8rem]">
        <label className="text-xs font-medium text-muted-foreground">
          Nombre
          <Input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className="mt-1 h-10" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Cantidad
          <NumericInput value={quantity} onValueChange={setQuantity} emptyValue={1} min={1} className="mt-1 h-10" />
        </label>
        {canEditPrice && (
          <label className="text-xs font-medium text-muted-foreground">
            Precio c/u
            <NumericInput value={price} onValueChange={setPrice} decimal emptyValue={0} className="mt-1 h-10" />
          </label>
        )}
      </div>
      {!canEditPrice && pricesVisible && (
        <p className="text-xs text-muted-foreground">El precio de este repuesto lo fija el taller.</p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          <X size={14} className="mr-1" aria-hidden /> Cancelar
        </Button>
        <Button type="button" size="sm" onClick={submit} disabled={saving || !valid}>
          <Check size={14} className="mr-1" aria-hidden /> {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </li>
  );
}

interface AddPartFormProps {
  pricesVisible: boolean;
  saving: boolean;
  onAdd: (part: PartInput) => Promise<EditResult>;
  onResult: (result: EditResult) => boolean;
}

function AddPartForm({ pricesVisible, saving, onAdd, onResult }: AddPartFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | null>(1);
  const [price, setPrice] = useState<number | null>(null);

  const valid = name.trim().length > 0 && quantity !== null && quantity >= 1;

  const submit = async () => {
    if (!valid || quantity === null) return;
    const input: PartInput = { name: name.trim(), quantity };
    if (pricesVisible && price !== null) input.unitPrice = price;
    if (onResult(await onAdd(input))) {
      setName("");
      setQuantity(1);
      setPrice(null);
    }
  };

  return (
    <form
      className="space-y-2 rounded-xl border border-dashed p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agregar repuesto</p>
      <div className={`grid gap-2 ${pricesVisible ? "sm:grid-cols-[1fr_5rem_8rem]" : "sm:grid-cols-[1fr_5rem]"}`}>
        <Input
          aria-label="Nombre del repuesto"
          placeholder="Ej. Pastillas de freno"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
        />
        <NumericInput
          aria-label="Cantidad"
          value={quantity}
          onValueChange={setQuantity}
          emptyValue={1}
          min={1}
          className="h-10"
        />
        {pricesVisible && (
          <NumericInput
            aria-label="Precio unitario (opcional)"
            placeholder="Precio (opcional)"
            value={price}
            onValueChange={setPrice}
            decimal
            className="h-10"
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {pricesVisible ? "El precio es opcional; si lo dejas vacío lo completa el taller." : "Los precios se cargan desde que el trabajo sale de revisión."}
        </p>
        <Button type="submit" size="sm" disabled={saving || !valid}>
          <Plus size={14} className="mr-1" aria-hidden /> Agregar
        </Button>
      </div>
    </form>
  );
}
