import type { PartAdd, PartUpdate } from "./api";
import type { JobPart } from "./types";

/**
 * Repuesto tal como lo ve el mecánico mientras edita: todavía no se guardó nada. Los que ya existen llevan `id`;
 * los nuevos no. Los cambios se mandan juntos con "Guardar cambios".
 */
export interface DraftPart {
  /** Clave estable para React (los repuestos nuevos todavía no tienen id). */
  key: string;
  id?: number;
  name: string;
  quantity: number;
  /** `null` = sin precio cargado (o montos ocultos en "En revisión"). */
  unitPrice: number | null;
  addedBy: "OWNER" | "MECHANIC";
  editablePrice: boolean;
}

export const toDraftParts = (parts: JobPart[]): DraftPart[] =>
  parts.map((p) => ({
    key: `p${p.id}`,
    id: p.id,
    name: p.name,
    quantity: p.quantity,
    unitPrice: p.unitPrice ?? null,
    addedBy: p.addedBy,
    editablePrice: p.editablePrice,
  }));

let counter = 0;
/** Repuesto nuevo, todavía sin guardar. Lo carga el mecánico, así que puede fijar su precio. */
export function newDraftPart(input: { name: string; quantity: number; unitPrice: number | null }): DraftPart {
  counter += 1;
  return { key: `n${counter}`, ...input, addedBy: "MECHANIC", editablePrice: true };
}

export interface PartsDiff {
  add: PartAdd[];
  update: PartUpdate[];
  remove: number[];
}

/**
 * Qué cambió entre lo guardado y el borrador. `null` si no hay nada que guardar. El precio solo se manda en los
 * repuestos cuyo precio puede editar el mecánico.
 */
export function diffParts(saved: JobPart[], draft: DraftPart[]): PartsDiff | null {
  const savedById = new Map(saved.map((p) => [p.id, p]));
  const keptIds = new Set<number>();
  const diff: PartsDiff = { add: [], update: [], remove: [] };

  for (const d of draft) {
    if (d.id === undefined) {
      diff.add.push({ name: d.name.trim(), quantity: d.quantity, ...(d.unitPrice !== null ? { unitPrice: d.unitPrice } : {}) });
      continue;
    }
    keptIds.add(d.id);
    const original = savedById.get(d.id);
    if (!original) continue;
    const change: PartUpdate = { id: d.id };
    if (d.name.trim() !== original.name) change.name = d.name.trim();
    if (d.quantity !== original.quantity) change.quantity = d.quantity;
    if (d.editablePrice && d.unitPrice !== null && d.unitPrice !== original.unitPrice) change.unitPrice = d.unitPrice;
    if (Object.keys(change).length > 1) diff.update.push(change);
  }
  for (const p of saved) if (!keptIds.has(p.id)) diff.remove.push(p.id);

  return diff.add.length || diff.update.length || diff.remove.length ? diff : null;
}
