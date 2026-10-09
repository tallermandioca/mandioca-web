# Fase 4 — Recordatorios, email y avisos

Fecha: 2026-10-09

## Qué se hizo

- **Job diario** `GET /api/cron/recordatorios`, programado en `vercel.json` a las 12:00 UTC (9:00 en Argentina). Protegido con `CRON_SECRET` (Vercel lo manda como `Authorization: Bearer …`). Toma los recordatorios `pendiente` con `fecha_programada <= hoy`:
  - canal **email**: manda el aviso con Resend y lo marca `enviado`;
  - canal **WhatsApp**: no manda nada solo (v1 sin API); queda `pendiente` y aparece como "Para mandar" en `/taller/avisos` con el `wa.me` listo.
- **Email con Resend** (`src/lib/notificaciones/email.ts`): texto plano + HTML simple con los colores del sitio. Sin `RESEND_API_KEY` no envía: deja un log y devuelve `enviado: false`, así todo funciona en local.
- **Capa de notificaciones** (`src/lib/notificaciones/index.ts`): `enviarAviso({canal, destinatario, asunto, texto})` arma el link si es WhatsApp o envía si es email. Es el único punto a tocar para enchufar la WhatsApp Cloud API después.
- **Plantillas compartidas** (`src/lib/notificaciones/avisos.ts`): calibración, listo, recibido y presupuesto, con `{nombre}`, `{instrumento}`, `{numero}`, `{fecha}`, `{importe}`, `{link}`. Las de calibración y "listo" se editan en Configuración. Con tests.
- **Avisos automáticos por email** para clientes que eligieron ese canal, sin que el taller haga nada: al crear la orden ("recibimos tu instrumento"), al pasarla a `presupuestado` ("presupuesto listo, aprobalo desde tu cuenta") y al cerrarla ("listo para retirar"). Para clientes de WhatsApp, el taller sigue tocando el botón `wa.me` en la orden.
- La pantalla de avisos del taller (ya hecha en la Fase 2) explica qué sale solo y qué hay que mandar a mano.

## Cómo probarlo

1. En local, sin clave de Resend: `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/recordatorios` → JSON con `revisados`, `enviados`, `esperanWhatsapp`, `fallidos`. Sin el header → 401.
2. Con `RESEND_API_KEY` en `.env.local`: poner a un cliente de demo con canal "email" y un email real tuyo, crear una orden para él desde el taller: llega el email "Recibimos tu instrumento".
3. Cambiar la `fecha_programada` de un recordatorio con canal email a hoy y correr el cron: llega el aviso y queda `enviado`.
4. `npm run build`, `npm run lint`, `npm run test` (33) sin errores.

## Qué hace falta de parte del dueño del proyecto

- Cuenta en https://resend.com (gratis hasta 3.000 emails/mes) con el email de Mandioca. Crear una API key y ponerla en `RESEND_API_KEY` (local y Vercel).
- Para mandar desde `@tallermandioca.com.ar` (o el dominio que sea) hay que verificar el dominio en Resend (dos registros DNS). Hasta entonces se puede usar `onboarding@resend.dev`, que solo entrega al email de la cuenta de Resend.
- Opcional pero recomendado: usar Resend también como SMTP de Supabase Auth (Authentication → SMTP Settings) para que los links de ingreso no dependan del SMTP de prueba de Supabase, que tiene un límite bajo por hora.
- En Vercel: cargar `CRON_SECRET` (cualquier texto largo al azar); Vercel lo manda solo al cron.

## Decisiones

- WhatsApp sigue siendo manual en v1 (lo pedía el prompt). La capa está lista para la Cloud API: solo cambia `enviarAviso`.
- El cron no reintenta: si un email falla, el recordatorio queda `pendiente` y vuelve a intentarse al día siguiente; el detalle aparece en `fallidos` de la respuesta (visible en los logs de Vercel).
- Los avisos de orden por email son silenciosos para el taller: un fallo de envío no bloquea la operación (se registra en consola).

## Pendiente / próximas fases

- Fase 5: muestrario (publicar, moderar, sello, filtros).
- Fase 6: Instagram, PWA, pulido, Lighthouse, página de privacidad, documento de traspaso.
