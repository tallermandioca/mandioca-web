"use client";

import { useActionState, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import {
  enviarLinkDeIngreso,
  ingresarConContrasena,
  ingresarConGoogle,
  type EstadoIngreso,
} from "./acciones";

const inicial: EstadoIngreso = {};

function Aviso({ estado }: { estado: EstadoIngreso }) {
  if (estado.error) {
    return (
      <div
        role="alert"
        className="rounded-sm border border-red-line border-l-[5px] border-l-red bg-red-bg px-[14px] py-3 text-sm"
      >
        {estado.error}
      </div>
    );
  }
  if (estado.mensaje) {
    return (
      <div role="status" className="rounded-sm bg-ok-bg px-[14px] py-3 text-sm text-ok-t">
        {estado.mensaje}
      </div>
    );
  }
  return null;
}

export function FormularioIngreso({
  volver,
  googleHabilitado,
}: {
  volver: string | null;
  googleHabilitado: boolean;
}) {
  const [modo, setModo] = useState<"cliente" | "taller">("cliente");
  const [estadoLink, accionLink, pendienteLink] = useActionState(enviarLinkDeIngreso, inicial);
  const [estadoPass, accionPass, pendientePass] = useActionState(ingresarConContrasena, inicial);
  const campoVolver = volver ? <input type="hidden" name="volver" value={volver} /> : null;

  if (modo === "taller") {
    return (
      <form action={accionPass} className="flex flex-col gap-[14px]">
        {campoVolver}
        <label className="field">
          Email del taller
          <input type="email" name="email" autoComplete="username" inputMode="email" required />
        </label>
        <label className="field">
          Contraseña
          <input type="password" name="password" autoComplete="current-password" required minLength={6} />
        </label>
        <Aviso estado={estadoPass} />
        <Boton type="submit" disabled={pendientePass}>
          {pendientePass ? "Ingresando…" : "Ingresar"}
        </Boton>
        <Boton type="button" variante="borde" onClick={() => setModo("cliente")}>
          Soy cliente
        </Boton>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-[14px]">
      {googleHabilitado ? (
        <form action={ingresarConGoogle}>
          {campoVolver}
          <Boton type="submit" variante="oscuro" className="w-full">
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.2 14.7 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12S6.6 21.8 12 21.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
            </svg>
            Continuar con Google
          </Boton>
        </form>
      ) : null}
      <form action={accionLink} className="flex flex-col gap-[14px]">
        {campoVolver}
        <label className="field">
          Tu email
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="vos@email.com"
          />
        </label>
        <Aviso estado={estadoLink} />
        <Boton type="submit" variante={googleHabilitado ? "borde" : "primario"} disabled={pendienteLink}>
          {pendienteLink ? "Enviando…" : "Mandarme un link por email"}
        </Boton>
      </form>
      <button
        type="button"
        onClick={() => setModo("taller")}
        className="min-h-11 text-[13px] font-semibold text-mute"
      >
        Soy el taller
      </button>
    </div>
  );
}
