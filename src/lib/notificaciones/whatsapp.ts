/**
 * WhatsApp v1: pre-built wa.me links. No API calls.
 * The notification layer (index.ts) is the only place that should decide
 * between this and a future WhatsApp Cloud API adapter.
 */

/** Keeps digits only and adds Argentina's country code when missing. */
export function normalizarWhatsapp(numero: string | null | undefined): string | null {
  if (!numero) return null;
  let digitos = numero.replace(/\D/g, "");
  if (digitos.length < 8) return null;
  if (digitos.startsWith("0")) digitos = digitos.slice(1);
  if (digitos.startsWith("54")) return digitos;
  if (digitos.length <= 10) {
    // Local number without country code: 299 123 4567 -> 54 9 299 123 4567
    return `549${digitos}`;
  }
  return digitos;
}

export function linkWhatsapp(numero: string | null | undefined, texto?: string): string | null {
  const normalizado = normalizarWhatsapp(numero);
  if (!normalizado) return null;
  const url = new URL(`https://wa.me/${normalizado}`);
  if (texto) url.searchParams.set("text", texto);
  return url.toString();
}

/** Replaces {nombre}, {instrumento}, {fecha}, {numero}, {link} in a template. */
export function rellenarPlantilla(
  plantilla: string,
  valores: Record<string, string | number | null | undefined>,
): string {
  return plantilla.replace(/\{(\w+)\}/g, (_, clave: string) => {
    const valor = valores[clave];
    return valor === null || valor === undefined ? "" : String(valor);
  });
}
