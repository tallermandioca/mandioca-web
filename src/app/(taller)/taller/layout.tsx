import { BarraSuperior } from "@/components/layout/BarraSuperior";
import { BotonSalir } from "@/components/layout/BotonSalir";
import { Marco } from "@/components/layout/Marco";
import { NAV_TALLER, NavInferior } from "@/components/layout/NavInferior";
import { requerirRol } from "@/lib/auth";

export default async function LayoutTaller({ children }: LayoutProps<"/taller">) {
  await requerirRol("admin", "/taller");
  return (
    <Marco>
      <BarraSuperior subtitulo="Panel del taller" derecha={<BotonSalir />} />
      {children}
      <NavInferior items={NAV_TALLER} />
    </Marco>
  );
}
