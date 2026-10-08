import Image from "next/image";
import Link from "next/link";
import { SITIO } from "@/config/sitio";
import type { ReactNode } from "react";

interface Props {
  subtitulo?: string;
  derecha?: ReactNode;
}

/** Dark sticky header with the circular logo, as in the prototype. */
export function BarraSuperior({ subtitulo, derecha }: Props) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-[10px] bg-dark px-[14px] py-[10px] text-dark-t">
      <Link href="/" className="flex items-center gap-[10px] no-underline" aria-label="Ir al inicio">
        <Image
          src="/logo-mandioca.png"
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full bg-white"
          priority
        />
        <span>
          <span className="block font-display text-lg font-bold uppercase leading-none tracking-[0.04em]">
            {SITIO.nombreCorto}
          </span>
          {subtitulo ? <span className="block text-xs text-[#C9C0B2]">{subtitulo}</span> : null}
        </span>
      </Link>
      {derecha ? <div className="ml-auto flex items-center">{derecha}</div> : null}
    </header>
  );
}
