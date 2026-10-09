import { BarraSuperior } from "@/components/layout/BarraSuperior";
import { Marco } from "@/components/layout/Marco";
import { NAV_PUBLICO, NavInferior } from "@/components/layout/NavInferior";
import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/auth";
import { BotonSalir } from "@/components/layout/BotonSalir";

export default async function LayoutCliente({ children }: LayoutProps<"/mi-cuenta">) {
  const sesion = await requerirRol("cliente", "/mi-cuenta");
  if (sesion.perfil.rol === "admin") redirect("/taller");
  return (
    <Marco>
      <BarraSuperior subtitulo={`Hola, ${sesion.perfil.nombre.split(" ")[0]}`} derecha={<BotonSalir />} />
      {children}
      <NavInferior items={NAV_PUBLICO} />
    </Marco>
  );
}
