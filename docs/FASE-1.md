# Fase 1 — Proyecto base, Supabase, auth y sitio público

Fecha: 2026-10-08

## Qué se hizo

- **Proyecto**: Next.js 16 (App Router, TypeScript estricto, Turbopack), Tailwind 4, ESLint, Prettier, Vitest. Repo git inicializado con la identidad de Mandioca (`git config` local).
- **Supabase**: 6 migraciones en `supabase/migrations` (enums, tablas, funciones y triggers, RLS, storage, tipos de trabajo públicos). Se aplican con `npm run db:migrate` desde cualquier PC con `.env.local`, sin Docker ni CLI. Tabla `_migraciones` lleva el registro.
  - Trigger `fn_ordenes_before_update`: valida la máquina de estados y limita lo que un cliente puede tocar (solo aprobar presupuesto).
  - Trigger `fn_ordenes_cerrada`: al pasar a `listo` recalcula `proxima_revision` del instrumento (fecha de cierre + meses del tipo de trabajo, o la fecha que el taller fije), cancela recordatorios pendientes y crea uno 7 días antes.
  - Trigger `fn_instrumentos_before_update`: el cliente solo puede cambiar foto, calibre y `en_venta`.
  - Trigger `fn_publicaciones_before_write`: el cliente no puede darse el sello ni `destacada`.
  - Trigger `fn_auth_user_creado`: vincula el usuario de Auth al perfil que creó el taller (por email) o crea un perfil nuevo.
  - Vistas públicas sin datos personales: `configuracion_publica`, `vendedores_publicos`, `instrumentos_publicos`, `historial_publico`.
  - Buckets `fotos-publicas` (lectura pública) y `fotos-privadas` (dueño + admin).
- **Seeds** (`supabase/seed.sql` + `npm run seed:usuarios`): 1 admin, 6 clientes, 11 instrumentos, 7 tipos de trabajo, 14 órdenes cerradas, 4 abiertas, 6 trabajos de portfolio, 5 recordatorios, 6 publicaciones, 6 posts de Instagram, configuración con placeholders `COMPLETAR:`. Nombres y textos del prototipo.
- **Auth**: ingreso por email + contraseña y "link por email" (magic link), callback en `/auth/callback`, salida por POST en `/auth/salir`, `proxy.ts` que refresca la sesión y protege `/mi-cuenta` y `/taller`, `requerirRol()` en los layouts.
- **Design system**: tokens del prototipo en `globals.css` (claro/oscuro), Barlow + Barlow Condensed con `next/font`, componentes `Boton`, `Foto` (con marcador `[FOTO]`), `Tag`, `Chip`, `Sello`, `PuntoSemaforo`, `Pill`, `Nota`, `BarraSuperior`, `NavInferior`, `Marco`.
- **Sitio público** contra la base real: inicio (servicios, 3 trabajos, banda portal, 3 publicaciones, 6 posts IG, contacto con `wa.me`), `/trabajos` con filtros por tipo e instrumento y paginación, `/en-venta` con filtros (tipo, precio, revisado, estuche, permuta) y orden, `/en-venta/[id]` con ficha, sello, historial y botón de WhatsApp al vendedor, `/i/[token]` del QR con redirección por rol, `/ingreso`, 404.
- **Layouts de cliente y taller** con guard de rol y pantalla provisoria (las pantallas llegan en fases 2 y 3). El panel del taller ya muestra contadores reales.
- **Tests** (`npm run test`, 27 en verde): transiciones de estado, próxima revisión y semáforo, condición del sello, links `wa.me` y formato.

## Cómo probarlo

```bash
npm install
cp .env.example .env.local   # completar con los datos del proyecto Supabase
npm run db:migrate && npm run db:seed && npm run seed:usuarios
npm run dev
```

1. Abrir http://localhost:3000. Inicio, Trabajos y En venta muestran los datos de la base.
2. Filtrar trabajos por tipo o instrumento; filtrar el muestrario por "Solo revisados" y ordenar por precio.
3. Entrar a una publicación: el botón "Contactar al vendedor" abre `wa.me` con el número del vendedor.
4. Ir a http://localhost:3000/i/demo-tele-78 sin sesión: página mínima "Instrumento registrado".
5. Ingresar con `martin@demo.mandioca.ar` / `mandioca123`: cae en `/mi-cuenta`. Volver a `/i/demo-tele-78`: redirige a la ficha (Fase 3).
6. Ingresar con `tallermandioca.dev@gmail.com` / `mandioca123`: cae en `/taller` con contadores. `/i/demo-tele-78` redirige a nueva orden (Fase 2).
7. `npm run build`, `npm run lint` y `npm run test` sin errores.

Verificado además contra la base: un cliente ve solo sus instrumentos y órdenes, no puede cambiar la marca de su instrumento (sí el calibre), anónimo no lee perfiles ni órdenes, y una transición inválida (`recibido → listo`) es rechazada por Postgres.

## Decisiones tomadas en esta fase

- **Ingreso por email, no por WhatsApp**: el login por teléfono en Supabase requiere un proveedor de SMS pago. El WhatsApp queda como contacto y canal de avisos.
- **Proyecto Supabase en `us-west-2` (Oregon)**: se creó en esa región; funciona bien, pero São Paulo sería más cercano. Cambiar de región implica crear otro proyecto y migrar.
- **`cacheComponents: false`** en Next 16: la app es dinámica (sesión en cada página), el modelo clásico es más simple.
- **Los tipos de trabajo activos son públicos** (nombre y precio base) porque el portfolio los muestra como tags y filtros.
- **La fila de `trabajos_portfolio` la crea la app al cerrar la orden** (Fase 2), porque necesita las fotos de antes y después; el trigger solo recalcula revisión y recordatorio.
- **Los seeds siguen al prototipo, no a los números del prompt**: para que las pantallas coincidan hubo que crear 6 clientes y 11 instrumentos en vez de 3 y 6.
- **Sello "Revisado por el taller"**: vale cualquier orden cerrada (`listo` o `entregado`) en los últimos 6 meses, no solo calibraciones.
- **Ícono de Instagram**: Lucide ya no incluye marcas; se usa un ícono de cámara.

## Pendiente / para las próximas fases

- Fase 2: panel del taller (nueva orden, cerrar trabajo, clientes, QR, plantillas, invitación de clientes nuevos).
- Fase 3: portal del cliente (resumen con semáforo, ficha, historial, PDF, aprobar presupuesto, datos).
- Fase 4: cron de recordatorios, Resend como SMTP de Auth y de avisos.
- Fase 5: publicar y moderar en el muestrario, sello vinculado a una orden.
- Fase 6: Instagram OAuth y caché, PWA, pulido, Lighthouse, documento de traspaso de cuentas.
- Datos reales a completar por el taller en `configuracion`: WhatsApp, dirección, horarios, email, dominio.
- Supabase gratuito pausa el proyecto tras 7 días sin uso: se reactiva desde el panel.
