import { Camera } from "lucide-react";
import { Contenido } from "@/components/layout/Marco";
import { Contacto } from "@/components/publico/Contacto";
import { TarjetaPublicacion, TarjetaTrabajo } from "@/components/publico/Tarjetas";
import { BotonEnlace } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { SERVICIOS, SITIO } from "@/config/sitio";
import {
  listarPublicaciones,
  obtenerConfiguracionPublica,
  ultimosPostsInstagram,
  ultimosTrabajos,
} from "@/lib/datos/publico";
import { linkWhatsapp } from "@/lib/notificaciones/whatsapp";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [config, trabajos, publicaciones, posts] = await Promise.all([
    obtenerConfiguracionPublica(),
    ultimosTrabajos(3),
    listarPublicaciones(),
    ultimosPostsInstagram(6),
  ]);
  const turno = linkWhatsapp(config?.whatsapp, "Hola! Quiero pedir un turno en el taller.");

  return (
    <Contenido>
      <div className="kicker">Luthería · reparación · calibración</div>
      <h1 className="h1">
        Tu instrumento,
        <br />
        en buenas manos
      </h1>
      <p className="lead">
        Cada instrumento que entra sale con su ficha, su historial y la próxima revisión agendada.
      </p>
      <Foto
        url={null}
        alt="El luthier en el banco del taller"
        marcador="[FOTO · luthier en el banco del taller]"
        className="h-[220px]"
      />
      <div className="flex gap-3">
        <BotonEnlace href="/trabajos" variante="oscuro" className="flex-1">
          Ver trabajos
        </BotonEnlace>
        {turno ? (
          <BotonEnlace href={turno} variante="borde" className="flex-1" externo>
            Pedir turno
          </BotonEnlace>
        ) : (
          <BotonEnlace href="/ingreso" variante="borde" className="flex-1">
            Pedir turno
          </BotonEnlace>
        )}
      </div>

      <h2 className="h2">Servicios</h2>
      <div className="grid grid-cols-2 gap-[10px]">
        {SERVICIOS.map((s) => (
          <div key={s.titulo} className="card p-[14px]">
            <h3 className="h3">{s.titulo}</h3>
            <div className="mute mt-1">{s.detalle}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="h2">Últimos trabajos</h2>
        <BotonEnlace href="/trabajos" variante="borde" tamano="chico" className="border">
          Ver todos
        </BotonEnlace>
      </div>
      {trabajos.map((t) => (
        <TarjetaTrabajo key={t.id} trabajo={t} />
      ))}

      <div className="flex flex-col gap-[10px] rounded-md bg-dark px-4 py-[18px] text-dark-t">
        <div className="kicker">Portal del cliente</div>
        <div className="h1 text-[30px]">Tu instrumento, con historial</div>
        <div className="text-[13px] text-[#C9C0B2]">
          Ficha técnica, cada trabajo con fecha y fotos, y aviso cuando vence la calibración.
        </div>
        <BotonEnlace href="/mi-cuenta">Ingresar a mi cuenta</BotonEnlace>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="h2">En venta</h2>
        <BotonEnlace href="/en-venta" variante="borde" tamano="chico" className="border">
          Ver muestrario
        </BotonEnlace>
      </div>
      {publicaciones.slice(0, 3).map((p) => (
        <TarjetaPublicacion key={p.id} publicacion={p} />
      ))}

      <div className="mt-1.5 flex items-center gap-[10px]">
        <Camera className="size-6 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="h2">Lo último en Instagram</h2>
          <div className="mute">@{config?.instagram_user ?? SITIO.instagramUser} · se actualiza solo</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {posts.map((post, i) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            aria-label={post.caption ?? "Post de Instagram"}
          >
            <Foto
              url={post.thumbnail_url ?? post.media_url}
              alt=""
              alterna={i % 2 === 1}
              className="aspect-square text-[11px]"
              sizes="160px"
            />
          </a>
        ))}
      </div>
      <BotonEnlace href={SITIO.instagramUrl} variante="borde" externo>
        Seguir en Instagram
      </BotonEnlace>

      <Contacto config={config} />
    </Contenido>
  );
}
