/** Public constants that never come from the database. */
export const SITIO = {
  nombre: "Taller de Instrumentos Mandioca",
  nombreCorto: "Taller Mandioca",
  instagramUser: "mandiocataller",
  instagramUrl: "https://www.instagram.com/mandiocataller/",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const SERVICIOS = [
  { titulo: "Calibración", detalle: "Action, alma, octavación. Cada 6 meses." },
  { titulo: "Reparación", detalle: "Refrete, clavijeros, puentes, electrónica." },
  { titulo: "Restauración", detalle: "Recuperar lo que se pueda, respetar lo original." },
  { titulo: "Construcción", detalle: "A medida: maderas, escala, electrónica." },
] as const;
