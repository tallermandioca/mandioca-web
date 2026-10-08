import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "oscuro" | "borde";
type Tamano = "normal" | "chico";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-bold no-underline cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const variantes: Record<Variante, string> = {
  primario: "bg-red text-white hover:bg-red-d",
  oscuro: "bg-ink text-paper hover:opacity-90",
  borde: "bg-transparent border-2 border-ink text-ink hover:bg-ink/5",
};

const tamanos: Record<Tamano, string> = {
  normal: "min-h-12 px-[18px] py-[10px] text-base",
  chico: "min-h-10 px-[14px] py-2 text-sm",
};

export function clasesBoton(variante: Variante = "primario", tamano: Tamano = "normal", extra = ""): string {
  return `${base} ${variantes[variante]} ${tamanos[tamano]} ${extra}`.trim();
}

interface PropsBase {
  variante?: Variante;
  tamano?: Tamano;
  className?: string;
  children: ReactNode;
}

type PropsBoton = PropsBase & ButtonHTMLAttributes<HTMLButtonElement>;

export function Boton({
  variante = "primario",
  tamano = "normal",
  className = "",
  children,
  ...rest
}: PropsBoton) {
  return (
    <button className={clasesBoton(variante, tamano, className)} {...rest}>
      {children}
    </button>
  );
}

type PropsEnlace = PropsBase & { href: string; externo?: boolean };

export function BotonEnlace({
  variante = "primario",
  tamano = "normal",
  className = "",
  href,
  externo,
  children,
}: PropsEnlace) {
  const clases = clasesBoton(variante, tamano, className);
  if (externo) {
    return (
      <a className={clases} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={clases} href={href}>
      {children}
    </Link>
  );
}
