# Taller de Instrumentos Mandioca

Sitio público, portal de clientes, muestrario de venta y panel del taller para un luthier.
Next.js (App Router, TypeScript) + Tailwind + Supabase. Deploy en Vercel.

La especificación completa está en [docs/PROMPT-taller-mandioca.md](docs/PROMPT-taller-mandioca.md) y la maqueta aprobada en [docs/prototipo.html](docs/prototipo.html).

## Requisitos

- Node 20 o superior (desarrollado con Node 24) y npm.
- Un proyecto en [Supabase](https://supabase.com) (el plan gratuito alcanza).
- No hace falta Docker ni la CLI de Supabase: las migraciones se aplican con un script propio.

## Levantar en local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env.local` a partir de `.env.example` y completar:

   | Variable | Dónde se obtiene |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → Publishable key (`sb_publishable_...`) |
   | `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API → Secret key (`sb_secret_...`). Solo servidor. |
   | `SUPABASE_DB_HOST`, `SUPABASE_DB_USER`, `SUPABASE_DB_PORT`, `SUPABASE_DB_NAME` | Supabase → Connect → Session pooler. El host es `aws-X-<región>.pooler.supabase.com`, el usuario `postgres.<ref>`, puerto 5432 |
   | `SUPABASE_DB_PASSWORD` | La contraseña de la base elegida al crear el proyecto (se puede resetear en Project Settings → Database) |
   | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local, el dominio real en producción |

3. Aplicar las migraciones y cargar los datos de demo:

   ```bash
   npm run db:migrate      # crea tablas, funciones, RLS y buckets
   npm run db:seed         # datos de ejemplo (los del prototipo)
   npm run seed:usuarios   # crea los usuarios de Auth de la demo
   ```

4. Levantar la app:

   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000.

## Usuarios de demo

Los clientes de demo usan la contraseña `mandioca123`. La del admin la define `SEED_ADMIN_PASSWORD` en `.env.local` o, si no está, `seed:usuarios` genera una al azar y la muestra una sola vez.

| Rol | Email | Entra a |
|---|---|---|
| Taller (admin) | `tallermandioca.dev@gmail.com` | `/taller` |
| Cliente | `martin@demo.mandioca.ar` | `/mi-cuenta` (3 instrumentos, 1 orden en curso) |
| Cliente | `lucia@demo.mandioca.ar`, `jorge@demo.mandioca.ar`, `sofia@demo.mandioca.ar`, `ana@demo.mandioca.ar`, `lucas@demo.mandioca.ar` | `/mi-cuenta` |

Para el "link por email" hace falta que Supabase pueda mandar emails. En el plan gratuito usa su SMTP de prueba (pocos por hora); en producción se configura Resend como SMTP en Authentication → SMTP Settings.

## Configuración de Auth en Supabase

En Authentication → Sign In / Providers → Email: **desactivar "Allow new users to sign up"**. Las cuentas las crea el taller; un registro libre permitiría crear perfiles sueltos. Dejar "Confirm email" activado: el perfil se vincula recién cuando el email está confirmado.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm run start` | Build y servidor de producción |
| `npm run lint` | ESLint |
| `npm run test` | Tests de reglas de negocio (Vitest) |
| `npm run format` | Prettier |
| `npm run db:migrate` | Aplica las migraciones pendientes de `supabase/migrations` (lleva registro en la tabla `_migraciones`) |
| `npm run db:seed` | Ejecuta `supabase/seed.sql` (borra y recarga los datos de dominio) |
| `npm run db:reset` | Solo desarrollo: borra todo, migra y vuelve a sembrar |
| `npm run seed:usuarios` | Crea o vincula los usuarios de Auth de la demo |
| `npm run db:types` | Regenera `src/lib/supabase/types.ts` desde la base (requiere `npx supabase` y la URL de conexión) |

## Estructura

```
supabase/migrations   SQL versionado (enums, tablas, funciones y triggers, RLS, storage)
supabase/seed.sql     datos de demo
scripts/              db.ts (migraciones) y seed-usuarios.ts
src/app/(publico)     sitio público: inicio, trabajos, en venta, ingreso, QR
src/app/(cliente)     portal del cliente (/mi-cuenta)
src/app/(taller)      panel del taller (/taller, solo admin)
src/app/auth          callback del magic link y cierre de sesión
src/components        ui/ (botones, etiquetas, fotos), layout/, publico/
src/lib/domain        reglas de negocio puras con tests
src/lib/datos         consultas a Supabase
src/lib/notificaciones capa de avisos (wa.me hoy, API después)
src/lib/supabase      clientes (navegador, servidor, admin) y tipos generados
src/proxy.ts          refresco de sesión y guard de /taller y /mi-cuenta
```

## Deploy en Vercel

1. Importar el repo en Vercel.
2. Cargar las mismas variables de `.env.local` (las `SUPABASE_DB_*` no hacen falta en Vercel, solo sirven para migrar desde una PC).
3. En Supabase → Authentication → URL Configuration, poner el dominio de Vercel como Site URL y agregar `https://<dominio>/auth/callback` a los Redirect URLs.
4. El plan Hobby de Vercel es solo para uso no comercial. Para el taller en producción corresponde el plan Pro o alojar en otro proveedor.

## Fases

El avance por fases está documentado en `docs/FASE-N.md`.
