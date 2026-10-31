"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJobDetail, JobsApiError, saveJob, type JobSavePatch } from "./api";
import type { JobDetail } from "./types";

/** Resultado de una edición: `conflict` indica que el servicio cambió y se recargó con lo vigente. */
export interface EditResult {
  ok: boolean;
  message?: string;
  conflict?: boolean;
  /** El detalle vigente que ya reemplazó al abierto: el recién guardado o, en un conflicto, el que cambió por fuera. */
  current?: JobDetail;
}

const NETWORK = "No se pudo guardar. Revisa tu conexión.";

/**
 * Detalle del trabajo abierto en el panel. El guardado manda el `updatedAt` que el mecánico tenía abierto: si el
 * dueño u otra pestaña cambió el servicio, la API responde 409 con lo vigente y aquí se reemplaza sin pisar nada.
 */
export function useJobDetail(token: string, jobId: number | null) {
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Descarta respuestas de un trabajo que ya no está abierto.
  const generation = useRef(0);

  const load = useCallback(
    async (id: number, keepCurrent = false) => {
      const gen = ++generation.current;
      if (!keepCurrent) setDetail(null);
      setLoading(true);
      setLoadError(null);
      setUnavailable(false);
      try {
        const data = await fetchJobDetail(token, id);
        if (gen === generation.current) setDetail(data);
      } catch (err) {
        if (gen !== generation.current) return;
        if (err instanceof JobsApiError && err.status === 404) setUnavailable(true);
        else setLoadError("No se pudo cargar el trabajo. Revisa tu conexión.");
      } finally {
        if (gen === generation.current) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (jobId === null) {
      generation.current += 1;
      setDetail(null);
      setLoading(false);
      setUnavailable(false);
      setLoadError(null);
      return;
    }
    void load(jobId);
  }, [jobId, load]);

  /** Vuelve a pedir el trabajo abierto (por ejemplo, tras cambiarle el estado), sin vaciar el panel. */
  const refresh = useCallback(() => {
    if (jobId !== null) void load(jobId, true);
  }, [jobId, load]);

  const run = async (op: (current: JobDetail) => Promise<JobDetail>): Promise<EditResult> => {
    if (!detail) return { ok: false, message: NETWORK };
    setSaving(true);
    try {
      const saved = await op(detail);
      setDetail(saved);
      return { ok: true, current: saved };
    } catch (err) {
      if (err instanceof JobsApiError) {
        if (err.status === 409 && err.current) {
          setDetail(err.current);
          return { ok: false, conflict: true, message: err.message, current: err.current };
        }
        return { ok: false, message: err.message };
      }
      return { ok: false, message: NETWORK };
    } finally {
      setSaving(false);
    }
  };

  return {
    detail,
    loading,
    unavailable,
    loadError,
    saving,
    refresh,
    /** Guarda de una vez todo lo que el mecánico cambió (campos y repuestos): un solo pedido a la API. */
    save: (patch: JobSavePatch) => run((d) => saveJob(token, d.id, patch, d.updatedAt)),
  };
}
