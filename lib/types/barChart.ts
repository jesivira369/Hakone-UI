export interface BarChartProps {
  data: { name: string; value: number }[];
  title?: string;
  label?: string;
  /** Color de las barras. Por defecto el azul del dashboard. */
  color?: string;
}
