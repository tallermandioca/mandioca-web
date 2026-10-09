import { rellenarPlantilla } from "./whatsapp";

/** Message templates for the automatic notices. The workshop can override the first two in Configuración. */

export const PLANTILLA_CALIBRACION =
  "Hola {nombre}! Te escribimos del Taller Mandioca. A tu {instrumento} le toca la revisión (vence el {fecha}). ¿Coordinamos un turno?";
export const PLANTILLA_LISTO =
  "Hola {nombre}! Tu {instrumento} está listo para retirar. Orden #{numero}. Te esperamos en el taller.";
export const PLANTILLA_RECIBIDO =
  "Hola {nombre}! Recibimos tu {instrumento} en el Taller Mandioca. Orden #{numero}. Podés seguirla desde tu cuenta: {link}";
export const PLANTILLA_PRESUPUESTO =
  "Hola {nombre}! Ya tenemos el presupuesto de tu {instrumento} (orden #{numero}): {importe}. Podés aprobarlo desde tu cuenta: {link}";

export interface DatosAviso {
  nombre: string;
  instrumento: string;
  numero?: string;
  fecha?: string;
  importe?: string;
  link?: string;
}

export function textoAviso(
  plantilla: string | null | undefined,
  porDefecto: string,
  datos: DatosAviso,
): string {
  const base = plantilla?.trim() || porDefecto;
  return rellenarPlantilla(base, { ...datos, nombre: datos.nombre.split(" ")[0] });
}

export const ASUNTO = {
  calibracion: (instrumento: string) => `Le toca la revisión a tu ${instrumento}`,
  cuerdas: (instrumento: string) => `Cambio de cuerdas para tu ${instrumento}`,
  listo: (instrumento: string) => `Tu ${instrumento} está listo para retirar`,
  recibido: (numero: string) => `Recibimos tu instrumento · Orden #${numero}`,
  presupuesto: (numero: string) => `Presupuesto listo · Orden #${numero}`,
} as const;
