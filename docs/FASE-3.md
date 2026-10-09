# Fase 3 — Portal del cliente

Fecha: 2026-10-09

## Qué se hizo

- **Resumen** (`/mi-cuenta`): saludo, alerta por cada instrumento con calibración vencida (con botón "Agendar revisión" por WhatsApp al taller), lista de instrumentos con foto, último trabajo y semáforo (vencida / próxima en N días / al día), banda oscura por cada orden en curso con la barra de estados, accesos a órdenes y datos.
- **Ficha del instrumento** (`/mi-cuenta/instrumentos/[id]`): datos técnicos, semáforo, historial de trabajos cerrados con detalle, importe (solo si el taller lo cargó), cuerdas y fotos (URLs firmadas del bucket privado), botones "Descargar PDF" y "Poner en venta" (la publicación es de la Fase 5), y el formulario con lo único que el cliente puede cambiar: foto y calibre. La base rechaza cualquier otro cambio (trigger de la Fase 1).
- **Órdenes** (`/mi-cuenta/ordenes` y `/mi-cuenta/ordenes/[id]`): en curso e historial; detalle con barra de estados, pedido, presupuesto con botón **Aprobar** cuando está `presupuestado` (la única transición que RLS y el trigger permiten al cliente), qué se hizo, importe, próxima revisión y fotos.
- **Mis datos** (`/mi-cuenta/datos`): nombre, WhatsApp y canal de avisos. El email no se edita porque es la identidad de ingreso.
- **PDF de la ficha** (`/api/pdf/instrumento/[id]`): generado en el servidor con `@react-pdf/renderer`; datos técnicos, historial y el link del QR. Solo lo descarga el dueño o el taller (RLS).
- Componentes nuevos: `BarraEstados` (progreso de la orden), `FotoUnica` reutilizado para la foto del instrumento (comprimida en el celular y subida al bucket público bajo `perfiles/<id>/`, que es lo que permite la política de storage).

## Cómo probarlo

1. Entrar como `martin@demo.mandioca.ar` / `mandioca123` → `/mi-cuenta`: alerta de la Telecaster vencida, Jazz Bass "Revisión en N días", Fonseca "Al día", y la orden #0231 en proceso.
2. Tocar la Telecaster: historial con refrete, calibración y electrónica. "Descargar PDF" abre la ficha. Cambiar la foto o el calibre y guardar.
3. Como taller, cargar un presupuesto en una orden en `recibido` y pasarla a `presupuestado`. Como cliente, abrir la orden y "Aprobar presupuesto": pasa a `aprobado` y el taller la ve lista para empezar.
4. Probar que un cliente no ve lo de otro: con la sesión de Martín, `/mi-cuenta/instrumentos/<id de la Strato de Sofía>` da 404.
5. `npm run build`, `npm run lint`, `npm run test` sin errores.

## Decisiones

- La foto que sube el cliente va al **bucket público** (es la foto "de portada" del instrumento, la misma que usaría una publicación). Las fotos de los trabajos siguen privadas.
- El PDF no incluye fotos para mantenerlo liviano y rápido; se puede sumar después.
- "Poner en venta" lleva a `/mi-cuenta/publicar?instrumento=…`, que sigue siendo un placeholder hasta la Fase 5.

## Pendiente / próximas fases

- Fase 4: cron de recordatorios, email con Resend, SMTP de Auth.
- Fase 5: publicar y moderar en el muestrario, sello.
- Fase 6: Instagram, PWA, pulido, Lighthouse, página de privacidad (necesaria para publicar la app de Google), documento de traspaso.
