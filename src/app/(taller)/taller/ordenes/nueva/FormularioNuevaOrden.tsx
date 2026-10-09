"use client";

import Link from "next/link";
import { QrCode, Search } from "lucide-react";
import { useActionState, useState } from "react";
import { CamaraFotos } from "@/components/taller/CamaraFotos";
import { Dictado } from "@/components/taller/Dictado";
import { Boton } from "@/components/ui/Boton";
import type { ClienteResumen } from "@/lib/datos/taller";
import { ETIQUETA_TIPO_INSTRUMENTO, nombreInstrumento } from "@/lib/formato";
import { crearOrden } from "./acciones";

interface Tipo {
  id: string;
  nombre: string;
  requiere_presupuesto: boolean;
}

interface Props {
  q: string;
  resultados: ClienteResumen[];
  seleccionado: ClienteResumen | null;
  instrumentoInicial: string | null;
  tipos: Tipo[];
}

const TIPOS_INSTRUMENTO = ["electrica", "acustica", "criolla", "bajo", "otro"];

export function FormularioNuevaOrden({ q, resultados, seleccionado, instrumentoInicial, tipos }: Props) {
  const [clienteNuevo, setClienteNuevo] = useState(false);
  const [instrumento, setInstrumento] = useState<string | "nuevo" | null>(
    instrumentoInicial ??
      (seleccionado && seleccionado.instrumentos.length === 1 ? seleccionado.instrumentos[0].id : null),
  );
  const [tipo, setTipo] = useState<string | null>(tipos[0]?.id ?? null);
  const [r, accion, pendiente] = useActionState(crearOrden, {});

  const mostrarBusqueda = !seleccionado && !clienteNuevo;

  return (
    <form action={accion} className="flex flex-col gap-[14px]">
      {mostrarBusqueda ? (
        <>
          <Link
            href="/taller/escanear"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink font-bold no-underline text-ink"
          >
            <QrCode className="size-5" aria-hidden /> Escanear QR del instrumento
          </Link>
          <div className="flex items-end gap-2">
            <label className="field flex-1">
              O buscar cliente / instrumento
              <input
                name="q"
                form="buscar"
                defaultValue={q}
                placeholder="Nombre, WhatsApp, modelo o serie"
                autoFocus
              />
            </label>
            <button
              type="submit"
              form="buscar"
              aria-label="Buscar"
              className="flex size-[46px] items-center justify-center rounded-md bg-ink text-paper"
            >
              <Search className="size-5" aria-hidden />
            </button>
          </div>
          {q && resultados.length === 0 ? (
            <div className="mute">No encontramos clientes con ese dato.</div>
          ) : null}
          <div className="flex flex-col gap-2">
            {resultados.map((c) => (
              <Link
                key={c.id}
                href={`/taller/ordenes/nueva?cliente=${c.id}`}
                className="card flex items-center gap-3 px-3 py-[10px] no-underline text-ink"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-paper">
                  {c.nombre.trim().charAt(0).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="mute truncate">
                    {c.whatsapp ?? "sin WhatsApp"} · {c.instrumentos.length} instrumento
                    {c.instrumentos.length === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <Boton type="button" variante="borde" onClick={() => setClienteNuevo(true)}>
            + Cliente nuevo
          </Boton>
        </>
      ) : null}

      {seleccionado ? (
        <div className="card flex items-center gap-3 border-2 border-ink px-3 py-[10px]">
          <input type="hidden" name="cliente_id" value={seleccionado.id} />
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-paper">
            {seleccionado.nombre.trim().charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">{seleccionado.nombre}</span>
            <span className="mute">
              {seleccionado.whatsapp ?? "sin WhatsApp"} · {seleccionado.instrumentos.length} instrumento
              {seleccionado.instrumentos.length === 1 ? "" : "s"}
            </span>
          </span>
          <Link href="/taller/ordenes/nueva" className="text-[13px] font-semibold text-red no-underline">
            Cambiar
          </Link>
        </div>
      ) : null}

      {clienteNuevo ? (
        <div className="card flex flex-col gap-[10px] border-2 border-ink p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Cliente nuevo</span>
            <button
              type="button"
              onClick={() => setClienteNuevo(false)}
              className="text-[13px] font-semibold text-red"
            >
              Cancelar
            </button>
          </div>
          <label className="field">
            Nombre y apellido
            <input name="nombre" required autoComplete="off" />
          </label>
          <label className="field">
            WhatsApp
            <input name="whatsapp" inputMode="tel" placeholder="299 123 4567" required />
          </label>
          <label className="field">
            Email (opcional)
            <input type="email" name="email" inputMode="email" />
          </label>
        </div>
      ) : null}

      {seleccionado || clienteNuevo ? (
        <>
          <div className="mute">Instrumento</div>
          <div className="chips">
            {(seleccionado?.instrumentos ?? []).map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setInstrumento(i.id)}
                className={`min-h-10 shrink-0 rounded-full border px-[14px] py-[9px] text-sm font-medium ${
                  instrumento === i.id ? "border-ink bg-ink text-paper" : "border-line bg-card"
                }`}
              >
                {nombreInstrumento(i)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setInstrumento("nuevo")}
              className={`min-h-10 shrink-0 rounded-full border border-dashed px-[14px] py-[9px] text-sm font-medium ${
                instrumento === "nuevo" ? "border-ink bg-ink text-paper" : "border-ink bg-card"
              }`}
            >
              + Nuevo
            </button>
          </div>
          {instrumento && instrumento !== "nuevo" ? (
            <input type="hidden" name="instrumento_id" value={instrumento} />
          ) : null}
          {instrumento === "nuevo" ? (
            <div className="card flex flex-col gap-[10px] p-3">
              <label className="field">
                Tipo
                <select name="tipo" defaultValue="electrica">
                  {TIPOS_INSTRUMENTO.map((t) => (
                    <option key={t} value={t}>
                      {ETIQUETA_TIPO_INSTRUMENTO[t]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-[10px]">
                <label className="field">
                  Marca
                  <input name="marca" placeholder="Fender" />
                </label>
                <label className="field">
                  Modelo
                  <input name="modelo" placeholder="Telecaster" />
                </label>
              </div>
              <label className="field">
                Foto del número de serie
                <input
                  type="file"
                  name="foto_serie"
                  accept="image/*"
                  capture="environment"
                  className="!min-h-0 !p-2"
                />
              </label>
            </div>
          ) : null}

          <div className="mute">Tipo de trabajo (carga la plantilla)</div>
          <div className="flex flex-wrap gap-2">
            {tipos.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className={`min-h-10 rounded-full border px-[14px] py-[9px] text-sm font-medium ${
                  tipo === t.id ? "border-red bg-red text-white" : "border-line bg-card"
                }`}
              >
                {t.nombre}
              </button>
            ))}
          </div>
          {tipo ? <input type="hidden" name="tipo_trabajo_id" value={tipo} /> : null}
          {tipos.find((t) => t.id === tipo)?.requiere_presupuesto === false ? (
            <div className="mute">
              Este tipo no necesita presupuesto: la orden puede pasar directo a &quot;en proceso&quot;.
            </div>
          ) : null}

          <Dictado
            name="pedido_cliente"
            etiqueta="Qué pide el cliente"
            placeholder="Tocá el micrófono y dictalo"
            rows={2}
          />
          <label className="field">
            Fecha estimada (opcional)
            <input type="date" name="fecha_estimada" />
          </label>
          <CamaraFotos name="fotos_antes" etiqueta="Fotos del antes (opcional)" />
          <label className="card flex min-h-12 items-center gap-3 p-3">
            <input type="checkbox" name="avisar_cliente" defaultChecked className="size-[22px] accent-red" />
            <span className="flex flex-col">
              <span className="font-semibold">Avisar al cliente</span>
              <span className="mute">Te armamos el WhatsApp con el n° de orden y el link a su cuenta</span>
            </span>
          </label>

          {r.error ? (
            <div role="alert" className="rounded-sm bg-red-bg px-3 py-2 text-sm text-red-d">
              {r.error}
            </div>
          ) : null}
          <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-10 mx-auto flex w-full max-w-[480px] flex-col gap-1.5 border-t border-line bg-card px-[18px] py-3">
            <Boton type="submit" disabled={pendiente || !instrumento || !tipo}>
              {pendiente ? "Creando…" : "Crear orden y avisar al cliente"}
            </Boton>
          </div>
        </>
      ) : null}
    </form>
  );
}
