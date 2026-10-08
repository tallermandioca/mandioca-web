"use client";

import { useActionState, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { enviarLinkDeIngreso, ingresarConContrasena, type EstadoIngreso } from "./acciones";

const inicial: EstadoIngreso = {};

export function FormularioIngreso({ volver }: { volver: string | null }) {
  const [modo, setModo] = useState<"password" | "link">("password");
  const [estadoPass, accionPass, pendientePass] = useActionState(ingresarConContrasena, inicial);
  const [estadoLink, accionLink, pendienteLink] = useActionState(enviarLinkDeIngreso, inicial);

  const estado = modo === "password" ? estadoPass : estadoLink;

  return (
    <form action={modo === "password" ? accionPass : accionLink} className="flex flex-col gap-[14px]">
      {volver ? <input type="hidden" name="volver" value={volver} /> : null}
      <label className="field">
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="vos@email.com"
        />
      </label>
      {modo === "password" ? (
        <label className="field">
          Contraseña
          <input type="password" name="password" autoComplete="current-password" required minLength={6} />
        </label>
      ) : null}

      {estado.error ? (
        <div
          role="alert"
          className="rounded-sm border border-red-line border-l-[5px] border-l-red bg-red-bg px-[14px] py-3 text-sm"
        >
          {estado.error}
        </div>
      ) : null}
      {estado.mensaje ? (
        <div role="status" className="rounded-sm bg-ok-bg px-[14px] py-3 text-sm text-ok-t">
          {estado.mensaje}
        </div>
      ) : null}

      {modo === "password" ? (
        <>
          <Boton type="submit" disabled={pendientePass}>
            {pendientePass ? "Ingresando…" : "Ingresar"}
          </Boton>
          <Boton type="button" variante="borde" onClick={() => setModo("link")}>
            Entrar con link por email
          </Boton>
        </>
      ) : (
        <>
          <Boton type="submit" disabled={pendienteLink}>
            {pendienteLink ? "Enviando…" : "Mandarme el link"}
          </Boton>
          <Boton type="button" variante="borde" onClick={() => setModo("password")}>
            Usar contraseña
          </Boton>
        </>
      )}
    </form>
  );
}
