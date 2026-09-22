import type { QueryClient } from "@tanstack/react-query";

/**
 * Un cambio en un servicio (estado, cobro, edición) toca su detalle, los listados,
 * el calendario, los próximos servicios/recordatorios y todas las estadísticas
 * (`stats-*`). Se invalida todo junto para que nada quede desfasado.
 */
export function invalidateServiceQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (q) => {
      const key = String(q.queryKey[0]);
      return key === "service" || key === "services" || key.startsWith("services-") || key.startsWith("stats-");
    },
  });
}
