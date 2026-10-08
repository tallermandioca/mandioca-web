import { SITIO } from "@/config/sitio";
import type { ConfiguracionPublica } from "@/lib/datos/publico";
import { linkWhatsapp } from "@/lib/notificaciones/whatsapp";

function oPlaceholder(valor: string | null | undefined, texto: string): string {
  if (!valor || valor.startsWith("COMPLETAR")) return texto;
  return valor;
}

export function Contacto({ config }: { config: ConfiguracionPublica | null }) {
  const wa = linkWhatsapp(config?.whatsapp, "Hola! Quiero pedir un turno en el taller.");
  return (
    <div className="card flex flex-col gap-1.5 p-4">
      <h3 className="h3">Contacto</h3>
      <div>
        WhatsApp:{" "}
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold">
            {config?.whatsapp}
          </a>
        ) : (
          <span className="text-mute">[NÚMERO]</span>
        )}
      </div>
      <div>
        Instagram:{" "}
        <a href={SITIO.instagramUrl} target="_blank" rel="noopener noreferrer" className="font-semibold">
          @{config?.instagram_user ?? SITIO.instagramUser}
        </a>
      </div>
      <div className="mute">
        {oPlaceholder(config?.direccion, "[DIRECCIÓN DEL TALLER]")} ·{" "}
        {oPlaceholder(config?.horario, "lunes a viernes [HORARIO] · sábados con turno")}
      </div>
    </div>
  );
}
