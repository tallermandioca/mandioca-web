import { Contenido } from "@/components/layout/Marco";
import { Nota } from "@/components/ui/Etiquetas";
import { requerirRol } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mi cuenta" };

export default async function MiCuenta() {
  const sesion = await requerirRol("cliente", "/mi-cuenta");
  return (
    <Contenido>
      <h1 className="h1">Hola, {sesion.perfil.nombre.split(" ")[0]}</h1>
      <p className="lead">Tus instrumentos, sus trabajos y cuándo toca la próxima revisión.</p>
      <Nota>El portal del cliente se construye en la Fase 3. El ingreso con tu cuenta ya funciona.</Nota>
    </Contenido>
  );
}
