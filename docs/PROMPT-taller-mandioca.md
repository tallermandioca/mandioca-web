# Taller de Instrumentos Mandioca — web + portal de clientes + muestrario

> Prompt para Claude Code. Leelo completo antes de escribir código.
> En la misma carpeta hay un archivo `docs/prototipo.html`: es la maqueta navegable aprobada. Abrila en el navegador y usala como referencia de pantallas, textos, flujo y estilo. Cuando haya dudas de diseño, el prototipo manda.

## 1. Contexto

Sitio web para un luthier (Taller de Instrumentos Mandioca, Instagram @mandiocataller). Tres piezas que se alimentan entre sí:

1. **Sitio público**: portfolio de trabajos (antes/después), servicios, contacto, feed de Instagram.
2. **Portal de clientes**: cada cliente ve sus instrumentos, la ficha técnica, el historial de trabajos y cuándo vence la próxima revisión/calibración. Recibe avisos automáticos.
3. **Muestrario de venta**: clientes publican instrumentos a la venta; el taller puede ponerles el sello "Revisado por el taller". El contacto es directo entre vendedor y comprador, sin comisión.

Y una cuarta cara, la más importante para que todo viva: el **panel del taller**, pensado para el celular, donde el luthier crea órdenes de trabajo y las cierra en menos de un minuto.

Usuarios:
- **Visitante**: ve el sitio público y el muestrario.
- **Cliente** (rol `cliente`): además entra a su cuenta y publica en el muestrario.
- **Taller** (rol `admin`): el luthier. Un solo usuario al principio, pero diseñá para que puedan ser varios.

Idioma de toda la interfaz: español rioplatense (vos, "calibración", "cuerdas", "luthier"). Sin anglicismos innecesarios.

## 2. Stack (no cambiar sin consultar)

- **Next.js** (App Router, TypeScript, Server Components donde tenga sentido), **Tailwind CSS**.
- **Supabase**: Postgres, Auth, Storage (fotos), Row Level Security, Edge Functions o cron para tareas programadas.
- **Deploy en Vercel** (gratis al inicio). Variables de entorno en `.env.local`, nunca en el repo.
- Email transaccional con **Resend** (avisos, link de ingreso).
- WhatsApp en v1: links `wa.me` prearmados con el texto (no API). Dejar la capa de "notificaciones" abstracta para enchufar la WhatsApp Cloud API después.
- Instagram: lectura del feed con la Instagram API (Instagram Login), token de larga duración guardado en el servidor, refresco automático antes de los 60 días. Los posts se cachean en la base; el sitio nunca llama a Instagram en tiempo real.
- Generación de PDF (ficha del instrumento, certificado) con una librería server-side (p. ej. `@react-pdf/renderer`).
- Lectura de QR en el panel del taller con la cámara del celular (librería liviana en el cliente, p. ej. `html5-qrcode` o la BarcodeDetector API con fallback).

Mobile-first en todo. El panel del taller y el portal del cliente tienen que ser usables con una mano, botones de 44 px mínimo, y funcionar como PWA instalable (manifest + ícono, sin service worker complejo).

## 3. Modelo de datos (Postgres / Supabase)

Nombres en español, snake_case. Todas las tablas con `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at`.

```
perfiles           -- extiende auth.users
  user_id uuid fk auth.users, nombre, whatsapp, email, rol enum('cliente','admin'), avatar_url

instrumentos
  dueno_id fk perfiles, tipo enum('electrica','acustica','criolla','bajo','otro'),
  marca, modelo, anio, numero_serie, foto_url,
  calibre_cuerdas, afinacion, escala, trastes_cantidad, trastes_material,
  action_graves_mm numeric, action_agudos_mm numeric,
  calibracion_cada_meses int default 6,
  proxima_revision date,            -- se recalcula al cerrar una orden
  qr_token text unique,             -- lo que lleva el QR de la etiqueta
  en_venta bool default false

tipos_trabajo      -- plantillas que arma el taller
  nombre, detalle_sugerido text, meses_hasta_revision int, precio_base numeric, activo bool

ordenes
  numero serial unique,             -- #0231 visible
  instrumento_id fk, cliente_id fk perfiles,
  tipo_trabajo_id fk,
  pedido_cliente text,              -- qué pidió
  estado enum('recibido','presupuestado','aprobado','en_proceso','listo','entregado','cancelado'),
  presupuesto numeric, presupuesto_aprobado_at timestamptz,
  detalle_realizado text, importe numeric, cuerdas_puestas text,
  fecha_ingreso date, fecha_estimada date, fecha_cierre date,
  publicar_en_portfolio bool default true,
  avisar_cliente bool default true

fotos_orden
  orden_id fk, url, momento enum('antes','despues'), orden int

trabajos_portfolio -- lo público; se crea automáticamente al cerrar una orden con publicar_en_portfolio
  orden_id fk unique, titulo, descripcion, tipo_trabajo_id, instrumento_tipo, foto_antes_url, foto_despues_url,
  destacado bool, visible bool, fecha date
  -- NUNCA expone cliente_id, nombre del dueño ni número de serie

recordatorios
  instrumento_id fk, cliente_id fk, tipo enum('calibracion','cuerdas','otro'),
  fecha_programada date, canal enum('whatsapp','email'),
  estado enum('pendiente','enviado','pausado','cancelado'), enviado_at timestamptz

publicaciones_venta
  instrumento_id fk, vendedor_id fk perfiles,
  titulo, descripcion, precio numeric, moneda text default 'ARS',
  estado_instrumento enum('excelente','muy_bueno','bueno','regular'),
  con_estuche bool, acepta_permuta bool,
  revisado_por_taller bool default false, revision_orden_id fk ordenes null, revisado_at date,
  estado enum('borrador','publicada','pausada','vendida'), destacada bool

fotos_publicacion
  publicacion_id fk, url, orden int

instagram_posts    -- caché del feed
  ig_id text unique, tipo enum('imagen','video','carrusel'), media_url, thumbnail_url, permalink, caption, fecha timestamptz

configuracion      -- una sola fila
  nombre_taller, direccion, horario, whatsapp, email, instagram_user,
  texto_aviso_calibracion, texto_aviso_listo, ig_token_encriptado, ig_token_vence_at
```

**RLS**: un `cliente` solo lee/escribe sus propios `instrumentos`, `ordenes`, `publicaciones_venta`, `recordatorios`. `admin` todo. `trabajos_portfolio`, `publicaciones_venta` (estado `publicada`) e `instagram_posts` son de lectura pública. Storage: bucket `fotos` con políticas equivalentes; las fotos del portfolio y del muestrario son públicas, las de órdenes solo para dueño y admin.

## 4. Pantallas

Seguir el prototipo. Resumen por rol.

### Público
- **Inicio**: hero, servicios (4), últimos trabajos (3), banda "Portal del cliente", teaser del muestrario (3), franja "Lo último en Instagram" (6 posts desde caché, link al perfil), contacto con `wa.me`.
- **Trabajos**: galería antes/después con filtros por tipo de trabajo y por tipo de instrumento, paginada.
- **En venta**: listado con filtros (tipo, precio mín/máx, revisado, estuche, permuta), orden por fecha/precio. Detalle de publicación con fotos, ficha resumida del instrumento, sello de revisión con fecha y botón "Contactar al vendedor" (`wa.me` del vendedor). Si el instrumento tiene historial en el taller y el vendedor lo autoriza, mostrar el historial sin datos personales.
- **Ingreso**: email o WhatsApp + contraseña, y "Entrar con link" (magic link por email). La cuenta la crea el taller al recibir el primer instrumento; el cliente completa su contraseña desde el link de invitación.

### Cliente (`/mi-cuenta`)
- Resumen: saludo, alerta de revisiones vencidas, lista de instrumentos con semáforo (vencida / próxima dentro de 30 días / al día), orden en curso con barra de estados.
- Ficha de instrumento: datos técnicos editables parcialmente (el cliente puede cambiar foto y calibre; el resto lo carga el taller), historial de trabajos con fotos e importe, próxima revisión, botones "Descargar PDF" y "Poner en venta".
- Órdenes: lista e historial; en estado `presupuestado` muestra el presupuesto y botón "Aprobar".
- Publicar en venta: elige instrumento, precio, estado, fotos, opciones; pedir o no la revisión del taller.
- Mis datos: nombre, WhatsApp, email, preferencias de aviso (canal).

### Taller (`/taller`, solo `admin`)
- **Panel del día**: botón grande "Nueva orden", acceso al escáner QR, contadores (abiertas / para retirar / avisos de la semana), lista de órdenes abiertas ordenadas por antigüedad con chip de estado, avisos programados de la semana.
- **Nueva orden** (una sola pantalla): escanear QR → trae cliente e instrumento; o buscar cliente; elegir instrumento entre los suyos o "+ Nuevo" (mínimo: tipo, marca/modelo, foto del número de serie); elegir tipo de trabajo (plantilla); "qué pide el cliente" con dictado por voz (Web Speech API, con fallback a tipeo); fotos del antes desde la cámara. Al crear: estado `recibido`, se genera el link `wa.me` con el mensaje al cliente (número de orden + link a su cuenta). Si el cliente es nuevo: crear perfil con invitación.
- **Orden** (detalle): cambiar estado, cargar presupuesto, fotos, notas internas.
- **Cerrar trabajo**: detalle prellenado con la plantilla (editable, con dictado), importe (opcional), cuerdas puestas, próxima revisión calculada (`meses_hasta_revision` del tipo) y editable, foto del después, switches "Mostrar en Trabajos" y "Avisar al cliente". Al cerrar: estado `listo`, se crea `trabajos_portfolio` si corresponde, se actualiza `proxima_revision` del instrumento, se programa el `recordatorio`, se genera el `wa.me` de "listo para retirar".
- **Clientes**: buscador por nombre, instrumento o número de serie; ficha del cliente con sus instrumentos y órdenes.
- **Avisos**: lista de recordatorios programados, pausar/reanudar/enviar ahora.
- **Muestrario**: moderar publicaciones (aprobar, pausar), marcar "Revisado por el taller" vinculando una orden de revisión.
- **Configuración**: datos del taller, textos de los avisos, plantillas de tipos de trabajo, conexión con Instagram, imprimir etiquetas QR (hoja A4 con N códigos + logo).
- **Cierre del día**: lista de órdenes en proceso para cerrar varias seguidas.

## 5. Reglas de negocio

- Una orden recorre: `recibido → presupuestado → aprobado → en_proceso → listo → entregado`. Puede ir a `cancelado` desde cualquier estado anterior a `listo`. Las plantillas de calibración pueden saltar presupuesto (`recibido → en_proceso`).
- Al cerrar una orden (`listo`): `instrumentos.proxima_revision = fecha_cierre + meses_hasta_revision`, se cancelan recordatorios pendientes de ese instrumento y se crea uno nuevo para 7 días antes de la fecha.
- Recordatorios: un job diario (cron de Vercel o Supabase) toma los `pendiente` con `fecha_programada <= hoy` y los envía por el canal elegido. Para WhatsApp en v1 no envía solo: deja el aviso en "Avisos" del taller con el `wa.me` listo para tocar. Para email envía con Resend. Marca `enviado`.
- Semáforo del cliente: vencida si `proxima_revision < hoy`; próxima si faltan ≤ 30 días; al día en otro caso.
- Portfolio: solo con fotos de antes y después, nunca datos del dueño. El taller puede editar título/descripción y ocultarlo.
- Muestrario: publica el cliente, modera el taller (o modo automático si se configura). "Revisado por el taller" solo se puede marcar con una orden de revisión cerrada en los últimos 6 meses. Sin pagos ni comisión en v1; dejar `destacada` para monetizar después.
- QR: cada instrumento tiene un `qr_token`; la URL es `https://<dominio>/i/<qr_token>`. Si la abre el admin → nueva orden con el instrumento precargado; si la abre el dueño → su ficha; cualquier otro → página pública mínima ("Instrumento registrado en Taller Mandioca", sin datos).
- Importes: visibles para el cliente solo si el taller lo cargó; nunca obligatorios.
- Todo lo que el taller carga tiene que poder editarse después. Nada bloquea el cierre salvo tipo de trabajo e instrumento.

## 6. Diseño

Reproducir exactamente el sistema del prototipo:

- Fondo papel `#F3EEE4`, tarjetas `#FFFFFF`, tinta `#161412`, texto secundario `#4A443D`, apagado `#6B645C`, líneas `#D9D2C5`.
- Acento rojo `#C4302B` (solo botones primarios, kicker y tags). Semáforo: rojo `#C4302B`, naranja `#D98A2B`, verde `#3E8E53`.
- Bandas oscuras `#161412` con texto `#F3EEE4`.
- Tipografía: **Barlow Condensed** 700/800 para títulos en mayúsculas; **Barlow** 400/500/600 para el resto. Cargar desde Google Fonts con `next/font`.
- Logo: usar el archivo `public/logo-mandioca.png` (circular). Fondo blanco detrás del logo cuando va sobre oscuro.
- Bordes 4–6 px, sin sombras, sin degradados. Íconos de trazo (Lucide).
- Fotos sin cargar: bloque `#2A2622` con texto `[FOTO]` como en el prototipo.
- Modo oscuro: respetar `prefers-color-scheme` con los tokens invertidos (ver CSS del prototipo).

## 7. Cómo quiero que trabajes

1. Antes de escribir código, mostrame un plan corto: estructura de carpetas, lista de rutas, y el SQL de migraciones. Esperá mi OK.
2. Avanzá por fases y hacé commit al final de cada una con un mensaje claro:
   - **Fase 1**: proyecto base, Supabase (migraciones + RLS + seeds de demo con los mismos datos del prototipo), auth con roles, layout y design system, sitio público con datos reales de la base.
   - **Fase 2**: panel del taller completo (nueva orden, cerrar trabajo, clientes, QR, plantillas).
   - **Fase 3**: portal del cliente (resumen, ficha, historial, PDF, aprobar presupuesto).
   - **Fase 4**: recordatorios (cron + email + `wa.me`), avisos en el panel.
   - **Fase 5**: muestrario (publicar, moderar, sello de revisión, filtros).
   - **Fase 6**: Instagram (OAuth, caché, refresco de token), PWA, pulido, Lighthouse móvil ≥ 90.
3. Cada fase termina con: `npm run build` sin errores, `npm run lint` limpio, y un `docs/FASE-N.md` con qué se hizo, cómo probarlo y qué queda pendiente.
4. Cuando necesites una clave, URL o decisión mía, preguntá en una lista corta y seguí con lo que no dependa de eso.
5. Si algo del prototipo es inviable o contradice una buena práctica, decímelo y proponé la alternativa; no lo cambies en silencio.
6. Siempre que me pases un archivo para pegar o reemplazar, dámelo completo, nunca un fragmento.
7. Código y comentarios en inglés; todo lo que ve el usuario en español. Tipado estricto, nada de `any`.
8. Tests mínimos: las reglas de negocio de la sección 5 (transición de estados, cálculo de próxima revisión, semáforo, condición del sello) con Vitest.

## 8. Entregables de la Fase 1 (para arrancar ya)

- `README.md` con pasos para levantar local (Supabase CLI o proyecto en la nube), variables de entorno necesarias y cómo cargar los seeds.
- `supabase/migrations/*.sql` con el modelo de la sección 3, políticas RLS y la función/trigger que recalcula `proxima_revision`.
- `supabase/seed.sql` con el taller, 3 clientes, 6 instrumentos, 6 trabajos de portfolio, 4 órdenes abiertas, 6 publicaciones de venta y 6 posts de Instagram de ejemplo (usar los mismos nombres y textos del prototipo).
- App Next.js con el sitio público funcionando contra esa base y el ingreso con roles.

Datos a completar por mí cuando los tenga (dejá placeholders claros en configuración, no inventes): WhatsApp del taller, dirección, horarios, email, dominio.
