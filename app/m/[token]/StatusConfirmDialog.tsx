"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getServiceStatusLabel } from "@/lib/enums";
import { formatFolio } from "@/lib/whatsapp";
import type { JobItem } from "./types";

export interface PendingStatusChange {
  item: JobItem;
  status: string;
}

interface StatusConfirmDialogProps {
  change: PendingStatusChange | null;
  /** Devuelve `null` si salió bien o el mensaje de error (por ejemplo, si el dueño aún no cargó el precio). */
  onConfirm: (change: PendingStatusChange) => Promise<string | null>;
  onClose: () => void;
}

/** Confirmación de cambio de estado, igual a la de la app original, para evitar toques accidentales en el celular. */
export function StatusConfirmDialog({ change, onConfirm, onClose }: StatusConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre para otro cambio se parte sin error ni estado de envío.
  useEffect(() => {
    setError(null);
    setSubmitting(false);
  }, [change]);

  const confirm = async () => {
    if (!change) return;
    setSubmitting(true);
    const message = await onConfirm(change);
    setSubmitting(false);
    if (message) setError(message);
    else onClose();
  };

  return (
    <Dialog open={change !== null} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-w-[min(92vw,24rem)]">
        <DialogHeader>
          <DialogTitle>Confirmar cambio de estado</DialogTitle>
        </DialogHeader>
        {change && (
          <p className="text-sm">
            ¿Quieres cambiar la orden <b>{formatFolio(change.item.number)}</b> a <b>{getServiceStatusLabel(change.status)}</b>?
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={submitting}>
            {submitting ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
