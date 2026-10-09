"use client";

import { useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface Props {
  url: string;
  alt: string;
  className?: string;
  sizes: string;
  prioridad?: boolean;
  contener?: boolean;
}

/** Photo that opens full screen (native <dialog>) when tapped. */
export function FotoAmpliable({ url, alt, className = "", sizes, prioridad, contener }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        aria-label={`Ampliar: ${alt}`}
        className={`relative block cursor-zoom-in overflow-hidden rounded-sm bg-photo p-0 ${className}`}
      >
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          className={contener ? "object-contain" : "object-cover"}
          priority={prioridad}
        />
      </button>
      <dialog
        ref={dialogo}
        onClick={() => dialogo.current?.close()}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 backdrop:bg-black/80"
      >
        <div className="relative h-full w-full">
          <Image src={url} alt={alt} fill sizes="100vw" quality={90} className="object-contain" />
        </div>
        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          aria-label="Cerrar"
          className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <X className="size-6" aria-hidden />
        </button>
      </dialog>
    </>
  );
}
