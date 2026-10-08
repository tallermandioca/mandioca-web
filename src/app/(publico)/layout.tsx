import Link from "next/link";
import { BarraSuperior } from "@/components/layout/BarraSuperior";
import { Marco } from "@/components/layout/Marco";
import { NAV_PUBLICO, NavInferior } from "@/components/layout/NavInferior";
import { destinoPorRol, obtenerSesion } from "@/lib/auth";

export default async function LayoutPublico({ children }: LayoutProps<"/">) {
  const sesion = await obtenerSesion();
  const derecha = sesion ? (
    <Link
      href={destinoPorRol(sesion.perfil?.rol)}
      className="rounded-sm border border-[#4A443D] px-[10px] py-2 text-[13px] font-semibold text-[#C9C0B2] no-underline"
    >
      {sesion.perfil?.rol === "admin" ? "Taller" : "Mi cuenta"}
    </Link>
  ) : null;

  return (
    <Marco>
      <BarraSuperior subtitulo="Luthería · reparación · calibración" derecha={derecha} />
      {children}
      <NavInferior items={NAV_PUBLICO} />
    </Marco>
  );
}
