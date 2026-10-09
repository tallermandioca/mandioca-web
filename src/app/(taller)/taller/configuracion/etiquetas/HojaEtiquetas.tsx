"use client";

import Image from "next/image";
import { Printer } from "lucide-react";
import { Boton } from "@/components/ui/Boton";

export interface Etiqueta {
  token: string;
  titulo: string;
  subtitulo: string;
  /** Inline SVG markup produced by the `qrcode` library (no user input inside). */
  svg: string;
}

/** Label grid: 3 columns, prints on A4 with the app chrome hidden. */
export function HojaEtiquetas({ etiquetas }: { etiquetas: Etiqueta[] }) {
  if (etiquetas.length === 0) return null;
  return (
    <div className="mx-auto w-full max-w-[480px] px-[18px] pb-6 print:max-w-none print:px-0 print:pb-0">
      <div className="mb-3 print:hidden">
        <Boton type="button" variante="oscuro" className="w-full" onClick={() => window.print()}>
          <Printer className="size-5" aria-hidden /> Imprimir hoja A4
        </Boton>
      </div>
      <div className="grid grid-cols-3 gap-2 print:grid-cols-3 print:gap-[4mm]">
        {etiquetas.map((e, i) => (
          <div
            key={`${e.token}-${i}`}
            className="flex flex-col items-center gap-1 rounded-sm border border-line bg-white p-2 text-center text-ink print:break-inside-avoid print:rounded-none print:border-dashed print:border-black"
          >
            <div className="flex items-center gap-1">
              <Image src="/logo-mandioca.png" alt="" width={20} height={20} className="size-5 rounded-full" />
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.06em]">
                Taller Mandioca
              </span>
            </div>
            <div
              className="w-full [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: e.svg }}
            />
            <div className="text-[10px] leading-tight">
              {e.titulo ? <div className="font-semibold">{e.titulo}</div> : null}
              {e.subtitulo ? <div className="text-mute">{e.subtitulo}</div> : null}
              <div className="font-mono text-[9px] text-mute">{e.token}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@media print { body { background: #fff !important; } @page { size: A4; margin: 10mm; } }`}</style>
    </div>
  );
}
