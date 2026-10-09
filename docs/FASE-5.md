# Fase 5 — Muestrario de venta

Fecha: 2026-10-09

## Qué se hizo

- **Migración 0010**: columna `solicita_publicacion` (el cliente pide publicar; el taller aprueba) y trigger que la limpia al publicar.
- **Cliente**:
  - `/mi-cuenta/publicar`: elige uno de sus instrumentos (los que no tienen publicación activa), título sugerido, descripción, precio, estado, estuche, permuta, mostrar historial, pedir revisión, fotos (comprimidas, bucket público bajo `perfiles/<id>/publicaciones/`). "Publicar" crea la publicación y la envía al taller; "Guardar como borrador" la deja para después. Si `moderacion_automatica` está activa en Configuración, se publica directo.
  - `/mi-cuenta/publicaciones`: sus publicaciones con estado (Borrador, Esperando al taller, Publicada, Pausada, Vendida).
  - `/mi-cuenta/publicaciones/[id]`: editar datos, agregar o quitar fotos, publicar, pausar, retirar el pedido, marcar vendida, ver cómo se ve en el muestrario.
- **Taller** (`/taller/muestrario`): filtros "Para aprobar" (con contador también en el panel), "Publicadas", "Borradores y pausadas", "Vendidas". Por publicación: aprobar y publicar, pausar, destacar (va primero en el muestrario), y **sello "Revisado por el taller"** eligiendo una orden cerrada del mismo instrumento en los últimos 6 meses (la regla `puedeMarcarSello` ya tenía tests; la acción además verifica que la orden sea de ese instrumento). Quitar sello.
- **Público**: el muestrario de la Fase 1 ya tenía filtros, orden, sello con fecha, ficha resumida, historial autorizado y contacto por WhatsApp. No cambió.
- Reglas que la base hace cumplir (verificado contra Supabase): el cliente no puede pasar a `publicada` sin aprobación ni volver a publicar una pausada; no puede ponerse el sello ni destacarse; al publicar o despublicar se sincroniza `instrumentos.en_venta`.

## Cómo probarlo

1. Como Martín: `/mi-cuenta/publicar`, elegir el Jazz Bass, completar y "Publicar". Queda "Esperando al taller".
2. Como taller: el panel muestra "1 publicación esperando aprobación". En `/taller/muestrario` → "Aprobar y publicar". Aparece en `/en-venta`.
3. En la misma tarjeta, "Poner el sello" eligiendo la orden #0205 (electrónica, cerrada en agosto). En `/en-venta` aparece "Revisado por el taller · 08/2026".
4. Como Martín: pausar y volver a publicar → vuelve a pedir aprobación. Marcar vendida → desaparece del muestrario.
5. `npm run build`, `npm run lint`, `npm run test` sin errores.

## Decisiones

- La solicitud de publicación es una columna aparte, no un estado nuevo: así el enum de estados del prompt queda igual y una publicación pausada por el taller puede volver a pedir aprobación.
- Una sola publicación activa por instrumento (borrador, publicada o pausada); si ya existe, "Publicar" lleva a esa.
- Las fotos de publicaciones son públicas desde que se suben (es lo que se va a mostrar); se borran del bucket al quitarlas.
- Sin pagos ni comisión; `destacada` queda como palanca para monetizar después, como pedía el prompt.

## Pendiente / próxima fase

- Fase 6: Instagram (OAuth, caché, refresco de token), PWA (manifest e íconos), página de privacidad, pulido de accesibilidad y Lighthouse móvil, documento de traspaso de cuentas.
