"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/ui/Boton";

/** Extracts the qr_token from a label URL (…/i/<token>) or accepts a bare token. */
export function tokenDesdeTexto(texto: string): string | null {
  const limpio = texto.trim();
  const m = limpio.match(/\/i\/([a-z0-9-]{4,64})/i);
  if (m) return m[1];
  if (/^[a-z0-9-]{4,64}$/i.test(limpio)) return limpio;
  return null;
}

interface DetectorCodigos {
  detect(fuente: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type ConstructorDetector = new (opciones: { formats: string[] }) => DetectorCodigos;

/** Camera QR scanner: BarcodeDetector when available, jsQR on a canvas otherwise, manual entry as fallback. */
export function EscanerQr({ alLeer }: { alLeer?: (token: string) => void }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<"iniciando" | "escaneando" | "sin_camara" | "leido">("iniciando");
  const [manual, setManual] = useState("");

  useEffect(() => {
    let activo = true;
    let stream: MediaStream | null = null;
    let timer: number | undefined;

    function terminar(token: string) {
      if (!activo) return;
      activo = false;
      setEstado("leido");
      stream?.getTracks().forEach((t) => t.stop());
      if (alLeer) alLeer(token);
      else router.push(`/i/${token}`);
    }

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("sin_camara");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        setEstado("sin_camara");
        return;
      }
      if (!activo || !video.current) return;
      video.current.srcObject = stream;
      await video.current.play();
      setEstado("escaneando");

      const w = window as unknown as { BarcodeDetector?: ConstructorDetector };
      const detector = w.BarcodeDetector ? new w.BarcodeDetector({ formats: ["qr_code"] }) : null;

      const tick = async () => {
        if (!activo || !video.current) return;
        const v = video.current;
        if (v.readyState >= 2) {
          if (detector) {
            try {
              const codigos = await detector.detect(v);
              const token = codigos.map((c) => tokenDesdeTexto(c.rawValue)).find(Boolean);
              if (token) return terminar(token);
            } catch {
              /* fall through to jsQR */
            }
          }
          const c = canvas.current;
          if (c) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            if (ctx && c.width > 0) {
              ctx.drawImage(v, 0, 0, c.width, c.height);
              const img = ctx.getImageData(0, 0, c.width, c.height);
              const codigo = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
              const token = codigo ? tokenDesdeTexto(codigo.data) : null;
              if (token) return terminar(token);
            }
          }
        }
        timer = window.setTimeout(tick, 250);
      };
      void tick();
    }

    void iniciar();
    return () => {
      activo = false;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [alLeer, router]);

  function enviarManual() {
    const token = tokenDesdeTexto(manual);
    if (!token) return;
    if (alLeer) alLeer(token);
    else router.push(`/i/${token}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-photo">
        <video ref={video} muted playsInline className="size-full object-cover" />
        <canvas ref={canvas} className="hidden" />
        {estado === "escaneando" ? (
          <div
            className="pointer-events-none absolute inset-8 rounded-md border-4 border-red/80"
            aria-hidden
          />
        ) : null}
        {estado === "iniciando" ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-photo-t">
            Abriendo la cámara…
          </div>
        ) : null}
        {estado === "sin_camara" ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-photo-t">
            No pudimos usar la cámara. Escribí el código de la etiqueta abajo.
          </div>
        ) : null}
      </div>
      <div className="flex items-end gap-2">
        <label className="field flex-1">
          Código de la etiqueta
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="demo-tele-78"
            autoCapitalize="off"
          />
        </label>
        <Boton type="button" variante="oscuro" onClick={enviarManual} disabled={!tokenDesdeTexto(manual)}>
          Ir
        </Boton>
      </div>
    </div>
  );
}
