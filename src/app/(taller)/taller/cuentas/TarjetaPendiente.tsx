"use client";

import { useActionState, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { aprobarComoNuevo, bloquearCuenta, vincularAExistente, type ResultadoCuenta } from "./acciones";

export interface Pendiente {
  id: string;
  nombre: string;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
}

export interface ClienteExistente {
  id: string;
  nombre: string;
  email: string | null;
  whatsapp: string | null;
  instrumentos: number;
}

const inicial: ResultadoCuenta = {};

function Aviso({ r }: { r: ResultadoCuenta }) {
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

export function TarjetaPendiente({
  pendiente,
  clientes,
}: {
  pendiente: Pendiente;
  clientes: ClienteExistente[];
}) {
  const [modo, setModo] = useState<"elegir" | "nuevo" | "vincular">("elegir");
  const [rNuevo, accionNuevo, pNuevo] = useActionState(aprobarComoNuevo, inicial);
  const [rVinc, accionVinc, pVinc] = useActionState(vincularAExistente, inicial);
  const [rBloq, accionBloq, pBloq] = useActionState(bloquearCuenta, inicial);
  const [busqueda, setBusqueda] = useState("");

  const hecho = rNuevo.mensaje ? rNuevo : rVinc.mensaje ? rVinc : rBloq.mensaje ? rBloq : null;
  if (hecho) {
    return (
      <div className="card p-3">
        <Aviso r={hecho} />
      </div>
    );
  }

  const q = busqueda.trim().toLowerCase();
  const porEmail = clientes.filter(
    (c) => pendiente.email && c.email && c.email.toLowerCase() === pendiente.email.toLowerCase(),
  );
  const lista = q
    ? clientes.filter((c) => c.nombre.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q))
    : porEmail.length > 0
      ? porEmail
      : clientes.slice(0, 8);

  return (
    <article className="card flex flex-col gap-[10px] p-3">
      <div>
        <div className="font-semibold">{pendiente.nombre}</div>
        <div className="mute">
          {pendiente.email ?? "sin email"} · se registró el{" "}
          {new Date(pendiente.created_at).toLocaleDateString("es-AR")}
        </div>
      </div>

      {modo === "elegir" ? (
        <div className="flex flex-col gap-2">
          <Boton type="button" variante="oscuro" tamano="chico" onClick={() => setModo("vincular")}>
            Es un cliente que ya tengo
          </Boton>
          <Boton type="button" variante="borde" tamano="chico" onClick={() => setModo("nuevo")}>
            Es un cliente nuevo
          </Boton>
          <form action={accionBloq} className="flex">
            <input type="hidden" name="perfil_id" value={pendiente.id} />
            <button type="submit" disabled={pBloq} className="min-h-10 text-[13px] font-semibold text-mute">
              No lo conozco, bloquear
            </button>
          </form>
          <Aviso r={rBloq} />
        </div>
      ) : null}

      {modo === "nuevo" ? (
        <form action={accionNuevo} className="flex flex-col gap-[10px]">
          <input type="hidden" name="perfil_id" value={pendiente.id} />
          <label className="field">
            Nombre
            <input name="nombre" defaultValue={pendiente.nombre} required />
          </label>
          <label className="field">
            WhatsApp
            <input
              name="whatsapp"
              inputMode="tel"
              defaultValue={pendiente.whatsapp ?? ""}
              placeholder="299 123 4567"
            />
          </label>
          <Aviso r={rNuevo} />
          <div className="flex gap-2">
            <Boton type="submit" tamano="chico" className="flex-1" disabled={pNuevo}>
              {pNuevo ? "Guardando…" : "Aprobar"}
            </Boton>
            <Boton type="button" variante="borde" tamano="chico" onClick={() => setModo("elegir")}>
              Volver
            </Boton>
          </div>
        </form>
      ) : null}

      {modo === "vincular" ? (
        <form action={accionVinc} className="flex flex-col gap-[10px]">
          <input type="hidden" name="perfil_id" value={pendiente.id} />
          <label className="field">
            Buscar cliente
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o email"
            />
          </label>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {lista.length === 0 ? <div className="mute">Sin resultados.</div> : null}
            {lista.map((c) => (
              <label
                key={c.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-line px-3 py-2"
              >
                <input type="radio" name="existente_id" value={c.id} required className="size-5 accent-red" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="mute">
                    {c.whatsapp ?? "sin WhatsApp"} · {c.instrumentos} instrumento
                    {c.instrumentos === 1 ? "" : "s"}
                    {c.email ? ` · ${c.email}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Aviso r={rVinc} />
          <div className="flex gap-2">
            <Boton type="submit" tamano="chico" className="flex-1" disabled={pVinc}>
              {pVinc ? "Vinculando…" : "Vincular"}
            </Boton>
            <Boton type="button" variante="borde" tamano="chico" onClick={() => setModo("elegir")}>
              Volver
            </Boton>
          </div>
        </form>
      ) : null}
    </article>
  );
}
