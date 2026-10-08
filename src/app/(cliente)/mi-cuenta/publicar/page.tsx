import { Contenido } from "@/components/layout/Marco";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Publicar en venta" };

export default async function Publicar() {
  await requerirRol("cliente", "/mi-cuenta/publicar");
  return (
    <Contenido>
      <div className="kicker">Muestrario</div>
      <h1 className="h1">Publicar mi instrumento</h1>
      <Nota>La publicación de instrumentos se habilita en la Fase 5.</Nota>
    </Contenido>
  );
}
