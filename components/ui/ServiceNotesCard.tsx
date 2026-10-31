"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import type { Service, ServiceActivity } from "@/lib/types";
import { invalidateServiceQueries } from "@/lib/invalidateServiceQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FIELD_LABELS: Record<string, string> = {
  description: "Descripción",
  notes: "Notas",
  scheduledAt: "Fecha programada",
  deliveryAt: "Fecha de entrega",
};

const DATE_FIELDS = new Set(["scheduledAt", "deliveryAt"]);

/** "2026-11-05" -> "05/11/2026"; el resto de los valores se muestran tal cual. */
function show(field: string | null, value: string | null): string {
  if (!value) return "vacío";
  if (field && DATE_FIELDS.has(field)) {
    const [y, m, d] = value.split("-");
    return y && m && d ? `${d}/${m}/${y}` : value;
  }
  return value;
}

function describe(a: ServiceActivity): string {
  switch (a.action) {
    case "FIELD_CHANGED":
      return `${FIELD_LABELS[a.field ?? ""] ?? a.field}: «${show(a.field, a.before)}» → «${show(a.field, a.after)}»`;
    case "PART_ADDED":
      return `Agregó el repuesto ${a.after}`;
    case "PART_CHANGED":
      return `Cambió el repuesto ${a.before} → ${a.after}`;
    case "PART_REMOVED":
      return `Borró el repuesto ${a.before}`;
  }
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Notas internas del taller (las editan el dueño y los mecánicos) y las ediciones que hicieron los mecánicos. */
export function ServiceNotesCard({ service }: { service: Service }) {
  const queryClient = useQueryClient();
  const saved = service.notes ?? "";
  const [text, setText] = useState(saved);
  // Si la nota cambia por fuera (un mecánico la editó), se actualiza lo que se muestra salvo que haya algo sin guardar.
  const [lastSaved, setLastSaved] = useState(saved);
  useEffect(() => {
    if (saved !== lastSaved) {
      if (text === lastSaved) setText(saved);
      setLastSaved(saved);
    }
  }, [saved, lastSaved, text]);

  const save = useMutation({
    mutationFn: async () => {
      await api.patch(`/services/${service.id}`, { notes: text.trim() || null });
    },
    onSuccess: () => {
      invalidateServiceQueries(queryClient);
      toast.success("Notas guardadas", { className: "bg-green-600 text-white border border-green-700" });
    },
    onError: (error) => {
      toast.error(error.message || "No se pudieron guardar las notas", {
        className: "bg-red-600 text-white border border-red-700",
      });
    },
  });

  const activity = service.activity ?? [];

  return (
    <Card className="overflow-hidden rounded-xl shadow-md">
      <CardHeader>
        <CardTitle>Notas del taller</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <textarea
            aria-label="Notas del taller"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={3}
            maxLength={2000}
            placeholder="Notas internas: no las ve el cliente. También las editan los mecánicos desde su enlace."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" disabled={save.isPending || text.trim() === saved.trim()} onClick={() => save.mutate()}>
              {save.isPending ? "Guardando..." : "Guardar notas"}
            </Button>
          </div>
        </div>

        {activity.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Ediciones del mecánico</p>
            <ul className="mt-2 divide-y rounded-lg border text-sm">
              {activity.map((a) => (
                <li key={a.id} className="px-3 py-2">
                  <p className="break-words">{describe(a)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.actorName ?? "Mecánico"} · {when(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
