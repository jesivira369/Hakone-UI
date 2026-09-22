"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface NumericInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "onBlur" | "type" | "inputMode"> {
  /** Valor numérico actual; `null` = campo vacío. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Permite decimales (coma o punto). Por defecto solo enteros. */
  decimal?: boolean;
  /** Valor al salir del campo si quedó vacío (o no válido). `null` lo deja vacío. */
  emptyValue?: number | null;
  /** Mínimo al normalizar en blur (ej. cantidad >= 1). */
  min?: number;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

function format(value: number | null): string {
  return value === null || Number.isNaN(value) ? "" : String(value);
}

/**
 * Input numérico editable: guarda el texto que se escribe y permite dejarlo
 * vacío mientras se edita (borrar el "1" para escribir "2"). Recién al salir del
 * campo (onBlur) se normaliza: vacío → `emptyValue`, y se respeta `min`.
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  { value, onValueChange, decimal = false, emptyValue = null, min, onBlur, onFocus, ...props },
  ref,
) {
  const [text, setText] = React.useState(() => format(value));
  const lastEmitted = React.useRef<number | null>(value);

  // Sincroniza cuando el valor cambia desde afuera (reset del formulario, precarga al editar),
  // pero no pisa lo que el usuario está escribiendo.
  React.useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(format(value));
    }
  }, [value]);

  const emit = (n: number | null) => {
    lastEmitted.current = n;
    onValueChange(n);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let next = e.target.value;
    if (decimal) {
      next = next.replace(",", ".").replace(/[^\d.]/g, "");
      const firstDot = next.indexOf(".");
      if (firstDot !== -1) next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
    } else {
      next = next.replace(/[^\d]/g, "");
    }
    setText(next);

    if (next === "" || next === ".") {
      emit(null);
      return;
    }
    const n = Number(next);
    emit(Number.isFinite(n) ? n : null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let n = text === "" || text === "." ? emptyValue : Number(text);
    if (n !== null && min !== undefined && n < min) n = min;
    setText(format(n));
    if (n !== value) emit(n);
    onBlur?.(e);
  };

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      value={text}
      onChange={handleChange}
      onFocus={(e) => {
        e.target.select();
        onFocus?.(e);
      }}
      onBlur={handleBlur}
    />
  );
});
