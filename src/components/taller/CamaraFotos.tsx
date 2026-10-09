"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/imagenes";

interface Props {
  name: string;
  etiqueta: string;
  maximo?: number;
}

/**
 * Photo picker for forms. On phones `capture` opens the camera directly.
 * Photos are compressed on the device before they reach the form.
 * Keeps a DataTransfer so removed photos are not submitted.
 */
export function CamaraFotos({ name, etiqueta, maximo = 6 }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [procesando, setProcesando] = useState(false);
  const previas = useMemo(() => archivos.map((f) => URL.createObjectURL(f)), [archivos]);

  useEffect(() => {
    return () => previas.forEach((u) => URL.revokeObjectURL(u));
  }, [previas]);

  function sincronizar(lista: File[]) {
    setArchivos(lista);
    if (input.current) {
      const dt = new DataTransfer();
      lista.forEach((f) => dt.items.add(f));
      input.current.files = dt.files;
    }
  }

  async function agregar(nuevos: File[]) {
    if (nuevos.length === 0) return;
    setProcesando(true);
    const comprimidos = await Promise.all(nuevos.map((f) => comprimirImagen(f)));
    sincronizar([...archivos, ...comprimidos].slice(0, maximo));
    setProcesando(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="mute">{etiqueta}</div>
      <div className="flex flex-wrap gap-2">
        {previas.map((src, i) => (
          <div key={src} className="relative size-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto ${i + 1}`} className="size-16 rounded-sm object-cover" />
            <button
              type="button"
              aria-label={`Quitar foto ${i + 1}`}
              onClick={() => sincronizar(archivos.filter((_, j) => j !== i))}
              className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-ink text-paper"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
        {archivos.length < maximo ? (
          <label className="flex size-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink text-[10px] font-semibold">
            <Camera className="size-5" aria-hidden />
            {procesando ? "…" : "Sacar foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(e) => {
                const lista = Array.from(e.target.files ?? []);
                e.target.value = "";
                void agregar(lista);
              }}
            />
          </label>
        ) : null}
      </div>
      <input ref={input} type="file" name={name} multiple className="hidden" tabIndex={-1} aria-hidden />
    </div>
  );
}
