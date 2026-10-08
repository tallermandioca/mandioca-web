import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import type { Semaforo } from "@/lib/domain/revision";

/** Small uppercase red tag ("Refrete"). */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="self-start rounded-[3px] border border-red px-[7px] py-[2px] font-display text-xs font-bold uppercase tracking-[0.1em] text-red">
      {children}
    </span>
  );
}

/** Scrollable chip row for filters. Chips are links so the pages stay server-rendered. */
export function Chip({ href, activo, children }: { href: string; activo: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`min-h-10 shrink-0 rounded-full border px-[14px] py-[9px] text-sm font-medium no-underline ${
        activo ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/** "Revisado por el taller · 09/2026" or "Sin revisión del taller". */
export function Sello({ revisadoAt }: { revisadoAt: string | null }) {
  if (!revisadoAt) {
    return <div className="text-[13px] font-semibold text-mute">Sin revisión del taller</div>;
  }
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ok-t">
      <Check className="size-4" aria-hidden />
      Revisado por el taller · {revisadoAt}
    </div>
  );
}

const coloresSemaforo: Record<Semaforo, { punto: string; texto: string }> = {
  vencida: { punto: "bg-red", texto: "text-red-d" },
  proxima: { punto: "bg-warn", texto: "text-warn-t" },
  al_dia: { punto: "bg-ok", texto: "text-ok-t" },
  sin_fecha: { punto: "bg-mute", texto: "text-mute" },
};

export function PuntoSemaforo({ estado, children }: { estado: Semaforo; children: ReactNode }) {
  const c = coloresSemaforo[estado];
  return (
    <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${c.texto}`}>
      <span className={`size-[9px] rounded-full ${c.punto}`} aria-hidden />
      {children}
    </div>
  );
}

type TonoPill = "ok" | "warn" | "info" | "mute" | "red";

const tonosPill: Record<TonoPill, string> = {
  ok: "bg-ok-bg text-ok-t",
  warn: "bg-warn-bg text-warn-t",
  info: "bg-info-bg text-info-t",
  mute: "bg-line2 text-mute",
  red: "bg-red-bg text-red-d",
};

export function Pill({ tono, children }: { tono: TonoPill; children: ReactNode }) {
  return (
    <span className={`whitespace-nowrap rounded-[3px] px-2 py-1 text-xs font-semibold ${tonosPill[tono]}`}>
      {children}
    </span>
  );
}

/** Dashed info box used for empty states and notes. */
export function Nota({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-card px-3 py-[10px] text-[13px] text-mute">
      {children}
    </div>
  );
}
