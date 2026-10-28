export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  /** Sin link la tarjeta es solo informativa (ej. estadísticas de la ficha del cliente). */
  link?: string;
}
