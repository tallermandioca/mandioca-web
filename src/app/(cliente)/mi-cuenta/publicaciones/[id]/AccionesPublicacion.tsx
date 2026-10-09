"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import {
  marcarVendida,
  pausarPublicacion,
  solicitarPublicacion,
  type Resultado,
} from "../../publicar/acciones";
import { Aviso } from "../../publicar/FormularioPublicacion";

interface Props {
  id: string;
  estado: string;
  solicitada: boolean;
}

export function AccionesPublicacion({ id, estado, solicitada }: Props) {
  const [rPub, accionPub, pPub] = useActionState(solicitarPublicacion, {} as Resultado);
  const [rPausa, accionPausa, pPausa] = useActionState(pausarPublicacion, {} as Resultado);
  const [rVend, accionVend, pVend] = useActionState(marcarVendida, {} as Resultado);
  const hidden = <input type="hidden" name="id" value={id} />;

  return (
    <div className="card flex flex-col gap-2 p-3">
      <h2 className="h3">Estado</h2>
      <Aviso r={rPub.mensaje || rPub.error ? rPub : rPausa.mensaje || rPausa.error ? rPausa : rVend} />
      <div className="flex flex-wrap gap-2">
        {estado !== "publicada" && estado !== "vendida" && !solicitada ? (
          <form action={accionPub}>
            {hidden}
            <Boton type="submit" tamano="chico" disabled={pPub}>
              {pPub ? "Enviando…" : "Publicar"}
            </Boton>
          </form>
        ) : null}
        {solicitada && estado !== "publicada" ? (
          <span className="self-center text-sm text-warn-t">Esperando que el taller la apruebe.</span>
        ) : null}
        {estado === "publicada" || (estado === "borrador" && solicitada) ? (
          <form action={accionPausa}>
            {hidden}
            <Boton type="submit" variante="borde" tamano="chico" disabled={pPausa}>
              {estado === "publicada" ? "Pausar" : "Retirar pedido"}
            </Boton>
          </form>
        ) : null}
        {estado !== "vendida" ? (
          <form action={accionVend}>
            {hidden}
            <Boton type="submit" variante="oscuro" tamano="chico" disabled={pVend}>
              {pVend ? "…" : "Marcar como vendida"}
            </Boton>
          </form>
        ) : null}
      </div>
    </div>
  );
}
