import Image from "next/image";
import { FotoAmpliable } from "./FotoAmpliable";

interface Props {
  url: string | null | undefined;
  alt: string;
  /** Text shown inside the dark block when there is no real photo. */
  marcador?: string;
  alterna?: boolean;
  className?: string;
  sizes?: string;
  prioridad?: boolean;
  /** Tap opens the photo full screen. */
  ampliable?: boolean;
  /** Show the whole photo (letterboxed) instead of cropping it to fill the box. */
  contener?: boolean;
}

export const PREFIJO_MARCADOR = "placeholder:";

export function esMarcador(url: string | null | undefined): boolean {
  return !url || url.startsWith(PREFIJO_MARCADOR);
}

/**
 * Photo block. Real URLs render with next/image; missing photos and seed
 * placeholders ("placeholder:[FOTO · ...]") render the dark [FOTO] block
 * from the prototype.
 */
export function Foto({
  url,
  alt,
  marcador,
  alterna,
  className = "",
  sizes = "(max-width: 520px) 100vw, 480px",
  prioridad,
  ampliable,
  contener,
}: Props) {
  if (esMarcador(url)) {
    const texto = url ? url.slice(PREFIJO_MARCADOR.length) : (marcador ?? "[FOTO]");
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center rounded-sm p-2 text-center text-xs text-photo-t ${alterna ? "bg-photo2" : "bg-photo"} ${className}`}
      >
        {texto}
      </div>
    );
  }
  if (ampliable) {
    return (
      <FotoAmpliable
        url={url as string}
        alt={alt}
        className={className}
        sizes={sizes}
        prioridad={prioridad}
        contener={contener}
      />
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-sm bg-photo ${className}`}>
      <Image
        src={url as string}
        alt={alt}
        fill
        sizes={sizes}
        className={contener ? "object-contain" : "object-cover"}
        priority={prioridad}
      />
    </div>
  );
}
