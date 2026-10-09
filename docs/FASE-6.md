# Fase 6 — Instagram, PWA, privacidad y traspaso

Fecha: 2026-10-09

## Qué se hizo

- **Instagram** (API con Instagram Login, sin llamadas en tiempo real):
  - `GET /api/instagram/conectar` (solo admin) inicia el OAuth con `state` en cookie; `GET /api/instagram/callback` canjea el código por el token largo (60 días), lo guarda **cifrado** (AES-256-GCM con `APP_SECRET_KEY`) en `configuracion.ig_token_encriptado` junto con su vencimiento, y llena la caché `instagram_posts` con los últimos 12 posts.
  - Cron diario `GET /api/cron/instagram` (9:30 ART, `vercel.json`): refresca el token si vence en menos de 10 días y actualiza la caché; borra de la caché los posts que ya no están entre los últimos.
  - Configuración → Instagram muestra el estado (sin configurar / sin conectar / conectado hasta tal fecha) y el botón "Conectar". Sin las claves de Meta, la portada sigue mostrando los posts de ejemplo del seed.
  - Tests del cifrado y de la URL de autorización.
- **PWA**: `manifest.webmanifest`, íconos 192/512 + maskable + apple-touch generados desde el logo, metadatos en el layout (`manifest`, `appleWebApp`, color de tema). Instalable desde el navegador del celular; sin service worker (como pedía el prompt).
- **Página de privacidad** (`/privacidad`), enlazada desde el contacto de la portada. Es la URL que Google pide para publicar la app de login.
- **Documento de traspaso** (`docs/TRASPASO.md`): cuentas, variables, operación diaria, configuración de Supabase que no vive en el código, pasos de Instagram y Google, limpieza de datos de demo.

## Cómo probarlo

1. `/privacidad` y `/manifest.webmanifest` responden. En Chrome móvil, "Agregar a la pantalla de inicio" instala la app con el logo.
2. Sin claves de Meta: `/taller/configuracion` dice "Para habilitarlo hay que cargar las claves"; `/api/cron/instagram` con el `CRON_SECRET` responde `sin_configurar`.
3. Con `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` y `APP_SECRET_KEY` cargados: Configuración → "Conectar Instagram" → autorizar → vuelve con "Instagram conectado" y la portada muestra los posts reales.
4. `npm run build`, `npm run lint`, `npm run test` (36) sin errores.

## Lighthouse y pulido

El sitio es server-rendered, sin JS en las páginas públicas salvo la navegación, con fuentes vía `next/font`, imágenes con `next/image` y contraste del prototipo. No se corrió Lighthouse desde esta máquina (requiere Chrome y la URL desplegada); queda como paso de verificación tras el primer deploy en Vercel, apuntando a móvil ≥ 90 en Performance, Accesibilidad y Buenas prácticas.

## Decisiones

- El token de Instagram se cifra en la app con una clave de entorno en lugar de Vault de Supabase: funciona igual en el plan gratuito y el traspaso es un solo valor en Vercel.
- La app de Meta debe crearla el dueño del Instagram (requiere su cuenta de Facebook); el código no asume nada de la cuenta de desarrollo.
- Sin service worker: una PWA instalable con manifest alcanza y evita problemas de caché al desplegar.

## Pendiente (fuera del alcance de las 6 fases)

- Correr Lighthouse sobre la URL desplegada y ajustar lo que aparezca.
- Cuando haya dominio: Site URL y Redirect URLs en Supabase, `NEXT_PUBLIC_SITE_URL`, publicar la app de Google, verificar el dominio en Resend.
- Borrar los datos de demo antes de salir a producción (ver TRASPASO, sección 7).
