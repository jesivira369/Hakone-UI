export interface BarChartProps {
  data: { name: string; value: number }[];
  title?: string;
  label?: string;
  /** Color de todas las barras. Por defecto, el azul de marca según el tema. */
  color?: string;
  /** Un color por barra; si hay menos colores que barras, se repiten. Tiene prioridad sobre `color`. */
  colors?: string[];
  /** Radio de las esquinas de las barras, en px. */
  barRadius?: number;
  /** Formato de los valores del eje Y y del tooltip (ej. moneda). */
  formatValue?: (value: number) => string;
}
