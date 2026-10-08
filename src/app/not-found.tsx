import { Contenido, Marco } from "@/components/layout/Marco";
import { BarraSuperior } from "@/components/layout/BarraSuperior";
import { BotonEnlace } from "@/components/ui/Boton";

export default function NoEncontrado() {
  return (
    <Marco>
      <BarraSuperior />
      <Contenido>
        <div className="h-[30px]" />
        <div className="kicker">Error 404</div>
        <h1 className="h1">No encontramos esa página</h1>
        <p className="lead">Puede que el link esté mal escrito o que la publicación ya no esté.</p>
        <BotonEnlace href="/">Volver al inicio</BotonEnlace>
      </Contenido>
    </Marco>
  );
}
