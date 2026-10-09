"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { guardarMisDatos } from "./acciones";

interface Props {
  nombre: string;
  whatsapp: string | null;
  email: string | null;
  canal: "whatsapp" | "email";
}

export function FormularioDatos({ nombre, whatsapp, email, canal }: Props) {
  const [r, accion, pendiente] = useActionState(guardarMisDatos, {});
  return (
    <form action={accion} className="flex flex-col gap-[12px]">
      <label className="field">
        Nombre y apellido
        <input name="nombre" defaultValue={nombre} required />
      </label>
      <label className="field">
        WhatsApp
        <input name="whatsapp" inputMode="tel" defaultValue={whatsapp ?? ""} placeholder="299 123 4567" />
      </label>
      <label className="field">
        Email (es tu usuario, no se cambia desde acá)
        <input value={email ?? "—"} readOnly className="!bg-line2" />
      </label>
      <label className="field">
        Quiero los avisos por
        <select name="canal_preferido" defaultValue={canal}>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </label>
      {r.error ? (
        <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
          {r.error}
        </div>
      ) : null}
      {r.mensaje ? (
        <div role="status" className="rounded-sm bg-ok-bg px-3 py-2 text-sm text-ok-t">
          {r.mensaje}
        </div>
      ) : null}
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar"}
      </Boton>
    </form>
  );
}
