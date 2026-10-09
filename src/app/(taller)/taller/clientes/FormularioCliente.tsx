"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { crearCliente, editarCliente, type Resultado } from "./acciones";

interface Valores {
  id?: string;
  nombre?: string;
  whatsapp?: string | null;
  email?: string | null;
  canal_preferido?: "whatsapp" | "email";
}

export function Aviso({ r }: { r: Resultado }) {
  if (r.error) {
    return (
      <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
        {r.error}
      </div>
    );
  }
  if (r.mensaje) {
    return (
      <div role="status" className="rounded-sm bg-ok-bg px-3 py-2 text-sm text-ok-t">
        {r.mensaje}
      </div>
    );
  }
  return null;
}

export function FormularioCliente({ valores = {} }: { valores?: Valores }) {
  const editando = Boolean(valores.id);
  const [r, accion, pendiente] = useActionState(editando ? editarCliente : crearCliente, {});
  return (
    <form action={accion} className="flex flex-col gap-[12px]">
      {valores.id ? <input type="hidden" name="id" value={valores.id} /> : null}
      <label className="field">
        Nombre y apellido
        <input name="nombre" defaultValue={valores.nombre ?? ""} required autoComplete="off" />
      </label>
      <label className="field">
        WhatsApp
        <input
          name="whatsapp"
          inputMode="tel"
          defaultValue={valores.whatsapp ?? ""}
          placeholder="299 123 4567"
        />
      </label>
      <label className="field">
        Email (opcional, sirve para que entre con Google)
        <input type="email" name="email" inputMode="email" defaultValue={valores.email ?? ""} />
      </label>
      <label className="field">
        Avisos por
        <select name="canal_preferido" defaultValue={valores.canal_preferido ?? "whatsapp"}>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </label>
      <Aviso r={r} />
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : editando ? "Guardar" : "Crear cliente"}
      </Boton>
    </form>
  );
}
