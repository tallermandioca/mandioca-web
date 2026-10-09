import type { EstadoOrden } from "@/lib/domain/ordenes";

const PASOS: { estado: EstadoOrden; etiqueta: string }[] = [
  { estado: "recibido", etiqueta: "Recibido" },
  { estado: "presupuestado", etiqueta: "Presupuestado" },
  { estado: "en_proceso", etiqueta: "En proceso" },
  { estado: "listo", etiqueta: "Listo para retirar" },
];

function indice(estado: EstadoOrden): number {
  switch (estado) {
    case "recibido":
      return 0;
    case "presupuestado":
    case "aprobado":
      return 1;
    case "en_proceso":
      return 2;
    case "listo":
    case "entregado":
      return 3;
    default:
      return -1;
  }
}

/** Four-step progress bar for an order, as in the prototype's dark band. */
export function BarraEstados({ estado, oscuro = false }: { estado: EstadoOrden; oscuro?: boolean }) {
  const actual = indice(estado);
  if (estado === "cancelado") {
    return <div className={oscuro ? "text-[13px] text-[#C9C0B2]" : "mute"}>Orden cancelada</div>;
  }
  const pendiente = oscuro ? "bg-[#4A443D]" : "bg-line";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1" aria-hidden>
        {PASOS.map((p, i) => (
          <div
            key={p.estado}
            className={`h-[5px] flex-1 rounded-[3px] ${i < actual ? "bg-ok" : i === actual ? "bg-red" : pendiente}`}
          />
        ))}
      </div>
      <div className={oscuro ? "text-[13px] text-[#C9C0B2]" : "mute"}>
        {PASOS.map((p, i) => (
          <span key={p.estado}>
            {i > 0 ? " → " : ""}
            {i === actual ? (
              <b className={oscuro ? "text-white" : "text-ink"}>{p.etiqueta}</b>
            ) : (
              <>
                {p.etiqueta}
                {p.estado === "presupuestado" && estado !== "recibido" && estado !== "presupuestado"
                  ? " (aprobado)"
                  : ""}
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
