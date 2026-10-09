# Documento de traspaso — Taller Mandioca

Para quien reciba el proyecto. Todo lo que hace falta para operarlo sin depender de quien lo construyó.

## 1. Cuentas (todas abiertas con el email del proyecto)

| Servicio | Para qué | Cómo se traspasa |
|---|---|---|
| Gmail del proyecto | Dueño de las demás cuentas | Entregar el acceso (cambiar contraseña y 2FA al recibirlo) |
| GitHub `tallermandioca` | Código (`mandioca-web`) | Entregar la cuenta o transferir el repo |
| Supabase | Base de datos, usuarios, fotos | Entregar la cuenta (entró con GitHub) o transferir el proyecto a otra organización |
| Vercel | Hosting y cron | Entregar la cuenta (entró con GitHub) o transferir el proyecto |
| Google Cloud | "Continuar con Google" | Entregar la cuenta; el Client ID y secreto viven en Supabase |
| Resend | Emails de avisos | Entregar la cuenta; la API key vive en Vercel |
| Meta for Developers | Feed de Instagram | Debe ser del dueño del Instagram; ver sección 5 |
| Dominio | `tallermandioca.com.ar` (o el que sea) | A nombre del taller |

Guardar en un lugar seguro: contraseña del Gmail, códigos de recuperación de 2FA de GitHub, y la contraseña de la base de Supabase.

## 2. Variables de entorno

Las mismas en `.env.local` (desarrollo) y en Vercel → Settings → Environment Variables:

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API → Publishable key |
| `SUPABASE_SECRET_KEY` | Supabase → API → Secret key. Solo servidor |
| `NEXT_PUBLIC_SITE_URL` | `https://<dominio>` en producción |
| `NEXT_PUBLIC_GOOGLE_AUTH` | `1` si Google está activo en Supabase |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend |
| `CRON_SECRET` | Texto largo al azar. Vercel lo manda a los crons |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | Meta for Developers (sección 5) |
| `APP_SECRET_KEY` | 32 bytes en base64 (`openssl rand -base64 32`). Cifra el token de Instagram. Si cambia, hay que reconectar Instagram |
| `SUPABASE_DB_*` | Solo para correr migraciones desde una PC (Supabase → Connect → Session pooler) |

## 3. Operación diaria

- **Deploy**: cada `git push` a `main` despliega en Vercel.
- **Migraciones**: `npm run db:migrate` desde una PC con `.env.local`. Nunca se editan migraciones ya aplicadas; se agrega una nueva.
- **Crons** (`vercel.json`): `/api/cron/recordatorios` 9:00 ART (avisos por email; los de WhatsApp quedan en Avisos para mandar a mano) y `/api/cron/instagram` 9:30 ART (refresca el token y la caché de posts). Se ven en Vercel → Cron Jobs, con los logs.
- **Supabase gratuito** pausa el proyecto tras 7 días sin uso: se reactiva desde el panel. El plan Pro evita eso.
- **Vercel Hobby** es solo para uso no comercial: para un negocio corresponde Pro (USD 20/mes) u otro hosting.
- **Backups**: Supabase Pro hace backups diarios. En el plan gratuito, exportar la base de vez en cuando desde el panel (Database → Backups) o con `pg_dump` usando la conexión del pooler.

## 4. Supabase: configuración que no está en el código

- Authentication → Providers → Email: sign-ups permitidos, confirmación de email activada.
- Authentication → Providers → Google: Client ID y secreto de Google Cloud.
- Authentication → URL Configuration: Site URL = dominio, Redirect URLs con `/auth/callback`.
- Authentication → SMTP Settings: Resend como SMTP (recomendado) para los links de ingreso.
- Storage: buckets `fotos-publicas` (público) y `fotos-privadas` (privado). Los crea la migración 0005.

## 5. Instagram (feed en la portada)

1. Con la cuenta del dueño del Instagram, entrar a https://developers.facebook.com y crear una app de tipo **Business**.
2. Agregar el producto **Instagram** → "API setup with Instagram login".
3. En "Business login settings", poner como Redirect URI `https://<dominio>/api/instagram/callback`.
4. Copiar **Instagram app ID** y **Instagram app secret** a `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET` en Vercel.
5. El Instagram tiene que ser cuenta Profesional (Business o Creator). Agregarlo como "Instagram tester" mientras la app está en modo desarrollo, o publicar la app.
6. En el sitio, como taller: Configuración → Instagram → **Conectar**. Pide permiso y vuelve con el token guardado (cifrado). El cron lo refresca solo; en Configuración se ve hasta cuándo vale.

Si el token vence sin refrescarse (por ejemplo, la app estuvo caída más de 60 días), alcanza con volver a tocar "Conectar".

## 6. Google (botón "Continuar con Google")

Ya configurado (ver README, sección Auth). Para que entre cualquier usuario y no solo los "de prueba", en Google Cloud → Google Auth Platform → Público → **Publicar app**. Pide una URL de inicio y una de política de privacidad: `https://<dominio>` y `https://<dominio>/privacidad`.

## 7. Datos del taller

Todo lo editable está en el sitio, como taller: Configuración (datos, textos de avisos, moderación), Tipos de trabajo (plantillas), Etiquetas QR, Cuentas nuevas. Los usuarios de demo (`*@demo.mandioca.ar`) se pueden borrar desde Supabase → Authentication → Users y Table Editor → perfiles antes de salir a producción; o correr `npm run db:seed` sobre una base limpia solo en desarrollo.

## 8. Dónde está cada cosa en el código

Ver `README.md` (estructura) y `docs/FASE-1.md` a `docs/FASE-6.md` (qué se hizo en cada fase, decisiones y pendientes).
