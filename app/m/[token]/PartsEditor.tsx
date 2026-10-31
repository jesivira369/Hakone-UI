"use client";

import { useState } from "react";
import { Check, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { newDraftPart, type DraftPart } from "./jobDraft";

interface PartsEditorProps {
  /** Borrador local: nada de lo que se hace aquí se guarda hasta tocar "Guardar cambios". */
  parts: DraftPart[];
  /** `false` en "En revisión": los montos están ocultos y no se cargan precios. */
  pricesVisible: boolean;
  editable: boolean;
  onChange: (parts: DraftPart[]) => void;
}

const MAX_QUANTITY = 1000;

/**
 * Repuestos del trabajo. El mecánico agrega, cambia cantidades, corrige o quita cualquiera, pero todo queda en
 * pantalla: se guarda de una vez con el botón de abajo (no se escribe en la base por cada toque).
 */
export function PartsEditor({ parts, pricesVisible, editable, onChange }: PartsEditorProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const replace = (key: string, patch: Partial<DraftPart>) =>
    onChange(parts.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const remove = (key: string) => onChange(parts.filter((p) => p.key !== key));

  return (
    <section aria-label="Repuestos" className="space-y-3">
      <h3 className="text-sm font-semibold">Repuestos ({parts.length})</h3>

      {parts.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay repuestos cargados.</p>}

      <ul className="divide-y rounded-xl border bg-card">
        {parts.map((part) =>
          editingKey === part.key ? (
            <PartEditRow
              key={part.key}
              part={part}
              pricesVisible={pricesVisible}
              onCancel={() => setEditingKey(null)}
              onApply={(patch) => {
                replace(part.key, patch);
                setEditingKey(null);
              }}
            />
          ) : (
            <li key={part.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={`Restar una unidad de ${part.name}`}
                  disabled={!editable || part.quantity <= 1}
                  onClick={() => replace(part.key, { quantity: part.quantity - 1 })}
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
                  disabled={!editable || part.quantity >= MAX_QUANTITY}
                  onClick={() => replace(part.key, { quantity: part.quantity + 1 })}
                >
                  <Plus size={14} />
                </Button>
              </div>

              <div className="order-first min-w-0 basis-full lg:order-none lg:basis-0 lg:flex-1">
                <p className="break-words text-sm font-medium">{part.name}</p>
                <p className="text-xs text-muted-foreground">
                  {part.id === undefined
                    ? "Nuevo, sin guardar"
                    : part.addedBy === "MECHANIC"
                      ? "Cargado por mecánico"
                      : "Cargado por el taller"}
                  {pricesVisible && part.unitPrice !== null && ` · ${formatCurrency(part.unitPrice)} c/u`}
                </p>
              </div>

              {editable && (
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label={`Editar ${part.name}`}
                    onClick={() => setEditingKey(part.key)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    aria-label={`Quitar ${part.name}`}
                    onClick={() => remove(part.key)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </li>
          ),
        )}
      </ul>

      {editable && <AddPartForm pricesVisible={pricesVisible} onAdd={(part) => onChange([...parts, part])} />}
    </section>
  );
}

interface PartEditRowProps {
  part: DraftPart;
  pricesVisible: boolean;
  onCancel: () => void;
  onApply: (patch: Partial<DraftPart>) => void;
}

function PartEditRow({ part, pricesVisible, onCancel, onApply }: PartEditRowProps) {
  const [name, setName] = useState(part.name);
  const [quantity, setQuantity] = useState<number | null>(part.quantity);
  const [price, setPrice] = useState<number | null>(part.unitPrice);

  const canEditPrice = pricesVisible && part.editablePrice;
  const valid = name.trim().length > 0 && quantity !== null && quantity >= 1;

  const apply = () => {
    if (!valid || quantity === null) return;
    onApply({ name: name.trim(), quantity, ...(canEditPrice ? { unitPrice: price } : {}) });
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
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          <X size={14} className="mr-1" aria-hidden /> Cancelar
        </Button>
        <Button type="button" size="sm" onClick={apply} disabled={!valid}>
          <Check size={14} className="mr-1" aria-hidden /> Aplicar
        </Button>
      </div>
    </li>
  );
}

interface AddPartFormProps {
  pricesVisible: boolean;
  onAdd: (part: DraftPart) => void;
}

function AddPartForm({ pricesVisible, onAdd }: AddPartFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | null>(1);
  const [price, setPrice] = useState<number | null>(null);

  const valid = name.trim().length > 0 && quantity !== null && quantity >= 1;

  const submit = () => {
    if (!valid || quantity === null) return;
    onAdd(newDraftPart({ name: name.trim(), quantity, unitPrice: pricesVisible ? price : null }));
    setName("");
    setQuantity(1);
    setPrice(null);
  };

  return (
    <form
      className="space-y-2 rounded-xl border border-dashed p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
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
          {pricesVisible
            ? "El precio es opcional; si lo dejas vacío lo completa el taller."
            : "Los precios se cargan desde que el trabajo sale de revisión."}
        </p>
        <Button type="submit" size="sm" disabled={!valid}>
          <Plus size={14} className="mr-1" aria-hidden /> Agregar
        </Button>
      </div>
    </form>
  );
}
