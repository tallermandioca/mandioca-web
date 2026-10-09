"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/imagenes";

interface Props {
  name: string;
  etiqueta: string;
}

/** Single-photo picker (e.g. serial number). Compresses before the form is submitted. */
export function FotoUnica({ name, etiqueta }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const previa = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);

  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  function sincronizar(file: File | null) {
    setArchivo(file);
    if (input.current) {
      const dt = new DataTransfer();
      if (file) dt.items.add(file);
      input.current.files = dt.files;
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="mute">{etiqueta}</div>
      <div className="flex items-center gap-2">
        {previa ? (
          <div className="relative size-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previa} alt="Foto elegida" className="size-16 rounded-sm object-cover" />
            <button
              type="button"
              aria-label="Quitar foto"
              onClick={() => sincronizar(null)}
              className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-ink text-paper"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <label className="flex size-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink text-[10px] font-semibold">
            <Camera className="size-5" aria-hidden />
            {procesando ? "…" : "Sacar foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = "";
                if (!f) return;
                setProcesando(true);
                sincronizar(await comprimirImagen(f));
                setProcesando(false);
              }}
            />
          </label>
        )}
      </div>
      <input ref={input} type="file" name={name} className="hidden" tabIndex={-1} aria-hidden />
    </div>
  );
}
