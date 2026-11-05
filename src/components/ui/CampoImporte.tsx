"use client";

import type { InputHTMLAttributes } from "react";
import { formatearImporteEscrito } from "@/lib/formato";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "type"> & {
  defaultValue?: number | string | null;
};

/**
 * Money input that shows "$ 105.000" while typing. Uncontrolled on purpose, so React's
 * form reset after a server action clears it; the server reads it with parsearImporte.
 */
export function CampoImporte({ defaultValue, onInput, ...rest }: Props) {
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      defaultValue={formatearImporteEscrito(defaultValue)}
      onInput={(e) => {
        e.currentTarget.value = formatearImporteEscrito(e.currentTarget.value);
        onInput?.(e);
      }}
      {...rest}
    />
  );
}
