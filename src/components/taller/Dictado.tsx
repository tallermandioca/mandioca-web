"use client";

import { Mic, MicOff } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

interface Props {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  etiqueta: string;
}

interface ReconocimientoVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type ConstructorVoz = new () => ReconocimientoVoz;

function obtenerConstructor(): ConstructorVoz | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorVoz;
    webkitSpeechRecognition?: ConstructorVoz;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Textarea with voice dictation (Web Speech API). Falls back to plain typing. */
export function Dictado({ name, defaultValue = "", placeholder, rows = 3, required, etiqueta }: Props) {
  const [texto, setTexto] = useState(defaultValue);
  const [grabando, setGrabando] = useState(false);
  const soportado = useSyncExternalStore(
    () => () => undefined,
    () => obtenerConstructor() !== null,
    () => false,
  );
  const reconocimiento = useRef<ReconocimientoVoz | null>(null);
  const base = useRef(defaultValue);

  function alternar() {
    if (grabando) {
      reconocimiento.current?.stop();
      return;
    }
    const Ctor = obtenerConstructor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "es-AR";
    r.continuous = true;
    r.interimResults = true;
    base.current = texto;
    r.onresult = (event) => {
      let parcial = "";
      for (let i = 0; i < event.results.length; i += 1) {
        parcial += event.results[i][0].transcript;
      }
      const separador = base.current && !base.current.endsWith(" ") ? " " : "";
      setTexto(base.current + separador + parcial.trim());
    };
    r.onend = () => setGrabando(false);
    r.onerror = () => setGrabando(false);
    reconocimiento.current = r;
    r.start();
    setGrabando(true);
  }

  return (
    <label className="field">
      {etiqueta}
      <div className="relative">
        <textarea
          name={name}
          rows={rows}
          value={texto}
          required={required}
          placeholder={placeholder}
          onChange={(e) => setTexto(e.target.value)}
          className={soportado ? "pr-12" : ""}
        />
        {soportado ? (
          <button
            type="button"
            onClick={alternar}
            aria-label={grabando ? "Parar el dictado" : "Dictar por voz"}
            aria-pressed={grabando}
            className={`absolute top-1 right-1 flex size-11 items-center justify-center rounded-sm ${
              grabando ? "bg-red text-white" : "text-ink2"
            }`}
          >
            {grabando ? <MicOff className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
          </button>
        ) : null}
      </div>
    </label>
  );
}
