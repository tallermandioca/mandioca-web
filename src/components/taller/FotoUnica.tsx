"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/imagenes";
import { BotonFoto } from "./CamaraFotos";

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

  async function elegir(archivos: File[]) {
    const f = archivos[0];
    if (!f) return;
    setProcesando(true);
    sincronizar(await comprimirImagen(f));
    setProcesando(false);
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
          <>
            <BotonFoto etiqueta={procesando ? "…" : "Sacar foto"} camara onElegir={elegir} />
            <BotonFoto etiqueta={procesando ? "…" : "Galería"} onElegir={elegir} />
          </>
        )}
      </div>
      <input ref={input} type="file" name={name} className="hidden" tabIndex={-1} aria-hidden />
    </div>
  );
}
