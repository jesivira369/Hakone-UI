"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJobs, JobsApiError, updateJobStatus } from "./api";
import type { JobItem, Section } from "./types";

interface SectionState {
  items: JobItem[];
  /** Última página cargada (0 = todavía no se pidió). */
  page: number;
  totalPages: number;
  loading: boolean;
}

const EMPTY: SectionState = { items: [], page: 0, totalPages: 0, loading: false };

/** Al volver a la pestaña solo se recarga si la lista tiene más de 30 s: evita pedidos repetidos sin necesidad. */
const STALE_AFTER_MS = 30_000;

/** Quita duplicados por id (un servicio puede moverse entre páginas mientras se recarga). */
function mergeById(current: JobItem[], incoming: JobItem[]): JobItem[] {
  const seen = new Set(current.map((i) => i.id));
  return [...current, ...incoming.filter((i) => !seen.has(i.id))];
}

/**
 * Estado de la vista del mecánico: dos secciones paginadas ("Para hacer" y "Listos"). Solo se carga la primera
 * página de "Para hacer"; "Listos" se pide cuando se abre, y cada sección crece con "Ver más". Así nunca se
 * traen todos los trabajos de golpe.
 */
export function useMechanicJobs(token: string) {
  const [sections, setSections] = useState<Record<Section, SectionState>>({ todo: EMPTY, ready: EMPTY });
  const [counts, setCounts] = useState<Record<Section, number>>({ todo: 0, ready: 0 });
  const [header, setHeader] = useState<{ mechanicName: string; shopName: string } | null>(null);
  const [readyOpen, setReadyOpen] = useState(false);
  // Espejo de `readyOpen` para que `reload` no cambie de identidad al abrir/cerrar la sección.
  const readyOpenRef = useRef(false);
  const [unavailable, setUnavailable] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Descarta respuestas de una recarga anterior (por ejemplo al volver a abrir la app mientras había una en curso).
  const generation = useRef(0);
  const lastLoadAt = useRef(0);

  const patchSection = useCallback(
    (section: Section, patch: Partial<SectionState>) =>
      setSections((s) => ({ ...s, [section]: { ...s[section], ...patch } })),
    [],
  );

  const loadPage = useCallback(
    async (section: Section, page: number) => {
      const gen = generation.current;
      patchSection(section, { loading: true });
      try {
        const data = await fetchJobs(token, section, page);
        if (gen !== generation.current) return;
        setHeader({ mechanicName: data.mechanicName, shopName: data.shopName });
        setCounts(data.counts);
        setUnavailable(false);
        setSections((s) => ({
          ...s,
          [section]: {
            items: page === 1 ? data.services : mergeById(s[section].items, data.services),
            page: data.page,
            totalPages: data.totalPages,
            loading: false,
          },
        }));
      } catch (err) {
        if (gen !== generation.current) return;
        patchSection(section, { loading: false });
        // Un enlace inválido o vencido responde 404; un fallo de red no debe mostrarse como "enlace vencido".
        if (err instanceof JobsApiError && err.status === 404) setUnavailable(true);
      }
    },
    [token, patchSection],
  );

  const reload = useCallback(() => {
    generation.current += 1;
    lastLoadAt.current = Date.now();
    setErrors({});
    void loadPage("todo", 1);
    if (readyOpenRef.current) void loadPage("ready", 1);
    else setSections((s) => ({ ...s, ready: EMPTY }));
  }, [loadPage]);

  useEffect(() => {
    reload();
    // Al volver a abrir la app desde el acceso directo se refresca la lista (y se renueva la vigencia del enlace).
    const onVisible = () =>
      document.visibilityState === "visible" && Date.now() - lastLoadAt.current > STALE_AFTER_MS && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const loadMore = (section: Section) => {
    const state = sections[section];
    if (!state.loading && state.page < state.totalPages) void loadPage(section, state.page + 1);
  };

  const toggleReady = () => {
    const next = !readyOpen;
    readyOpenRef.current = next;
    setReadyOpen(next);
    if (next && sections.ready.page === 0) void loadPage("ready", 1);
  };

  const changeStatus = async (item: JobItem, status: string) => {
    if (status === item.status) return;
    setBusyId(item.id);
    setErrors((e) => ({ ...e, [item.id]: "" }));
    try {
      await updateJobStatus(token, item.id, status);
      // El trabajo puede pasar de una sección a otra: se recarga para que listas y contadores queden consistentes.
      reload();
    } catch (err) {
      const message = err instanceof JobsApiError ? err.message : "No se pudo cambiar el estado. Revisa tu conexión.";
      setErrors((e) => ({ ...e, [item.id]: message }));
    } finally {
      setBusyId(null);
    }
  };

  return { sections, counts, header, readyOpen, unavailable, busyId, errors, reload, loadMore, toggleReady, changeStatus };
}
