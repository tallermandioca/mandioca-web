# Fase 2 — Panel del taller y cuentas autogestionadas

Fecha: 2026-10-09

## Cambio de modelo de cuentas (acordado con el dueño del proyecto)

El prompt original decía que el taller creaba la cuenta del cliente. Se reemplazó por:

- El cliente entra solo desde `/ingreso` con **"Continuar con Google"** o con un **link por email** (sin contraseña).
- Al entrar por primera vez queda **pendiente** (`perfiles.estado = 'pendiente'`): ve `/cuenta-pendiente` con un botón para avisarle al taller por WhatsApp. Mientras está pendiente no ve nada (las funciones `fn_perfil_id()` y `fn_es_admin()` solo reconocen perfiles activos).
- En `/taller/cuentas` el luthier **vincula** la cuenta a un cliente que ya tenía (el sistema sugiere por email), la **aprueba como cliente nuevo**, o la **bloquea**. El panel muestra un aviso cuando hay cuentas esperando.
- Si el taller cargó el email del cliente en su ficha, el vínculo es automático al confirmar el email (trigger `fn_auth_user_creado`).
- La contraseña queda solo para el taller ("Soy el taller" en `/ingreso`).

Google se muestra solo cuando `NEXT_PUBLIC_GOOGLE_AUTH=1`; hasta configurarlo, el ingreso es por link de email.

## Qué se hizo

- **Migración 0008**: `estado_perfil`, `fn_hoy()` (fecha en hora argentina para `fecha_ingreso`, `fecha_cierre`, portfolio), trigger que propaga la edición de `proxima_revision` de una orden cerrada al instrumento y a su recordatorio.
- **Panel del día** (`/taller`): botón grande "Nueva orden", acceso al escáner, contadores (abiertas, para retirar, avisos de la semana), aviso de cuentas pendientes, lista de órdenes abiertas por antigüedad con chip de estado, avisos de la semana, accesos a cierre del día y configuración.
- **Nueva orden** (`/taller/ordenes/nueva`), una sola pantalla: escanear QR o buscar por nombre, WhatsApp, modelo o serie; elegir instrumento del cliente o "+ Nuevo" (tipo, marca/modelo, foto del número de serie); cliente nuevo inline; tipo de trabajo (plantilla); "qué pide el cliente" con **dictado por voz** (Web Speech API, fallback a tipeo); fotos del antes desde la cámara; fecha estimada. Al crear: estado `recibido`, redirige al detalle con el **`wa.me` prearmado** (n° de orden + link a la cuenta).
- **Detalle de orden** (`/taller/ordenes/[id]`): cambio de estado respetando la máquina (`siguientesEstados`), presupuesto, fecha estimada, pedido, notas internas (tabla aparte, solo admin), fotos antes/después con URLs firmadas (bucket privado), botón de WhatsApp según el estado (recibido / presupuesto / listo).
- **Cerrar trabajo** (`/taller/ordenes/[id]/cerrar`): detalle prellenado con la plantilla (editable, con dictado), importe (opcional, precargado con presupuesto o precio base), cuerdas puestas (actualiza el calibre del instrumento), próxima revisión calculada y editable, foto del después, switches "Mostrar en Trabajos" (con título) y "Avisar al cliente". Al cerrar: recorre los estados hasta `listo` (saltando presupuesto si la plantilla lo permite), el trigger recalcula `proxima_revision` y programa el recordatorio, se copia la foto al bucket público y se crea la fila de `trabajos_portfolio`.
- **Órdenes** (`/taller/ordenes`): listado con filtro por estado. **Cierre del día** (`/taller/cierre`): trabajos en proceso para cerrar varios seguidos.
- **Clientes**: buscador (nombre, WhatsApp, email, marca, modelo, serie), ficha con instrumentos (semáforo de revisión), órdenes y edición de datos; alta de cliente; alta y edición completa de instrumento (datos técnicos, próxima revisión, foto de serie); link a imprimir su etiqueta.
- **Escáner QR** (`/taller/escanear`): `BarcodeDetector` cuando existe, `jsQR` sobre canvas si no, y entrada manual del código. Lleva a `/i/<token>`, que para el admin abre la nueva orden con el instrumento cargado.
- **Avisos** (`/taller/avisos`): recordatorios pendientes y pausados con el mensaje armado desde el texto configurable, botón `wa.me`, marcar enviado, pausar, reanudar, cancelar. (El cron que los dispara solo es de la Fase 4.)
- **Configuración**: datos del taller (WhatsApp, dirección, horario, email, Instagram), textos de avisos con variables, publicación automática del muestrario; **tipos de trabajo** (alta y edición de plantillas); **etiquetas QR** en hoja A4 imprimible (una por instrumento o seis de un mismo instrumento), generadas en el servidor con `qrcode`.
- **Muestrario** del taller: listado de publicaciones (moderación y sello en la Fase 5).

## Cómo probarlo

1. Entrar como taller: `/ingreso` → "Soy el taller" → `tallermandioca.dev@gmail.com` y la contraseña que te dio `seed:usuarios`.
2. Panel: tocar "Nueva orden", buscar "mart", elegir Martín, elegir "Jazz Bass", tipo "Calibración", dictar o escribir el pedido, sacar una foto, crear. Aparece el botón de WhatsApp con el mensaje.
3. En la orden: "Pasar a en proceso" (Calibración no requiere presupuesto), subir una foto del después, "Cerrar trabajo", revisar la fecha sugerida, cerrar. Volver al panel: la orden figura "Para retirar", `/taller/avisos` tiene el recordatorio nuevo, y `/trabajos` muestra la pieza en la galería.
4. Clientes: buscar por "S812345" (número de serie) → Martín. Entrar a la Telecaster, editar el calibre, guardar.
5. Configuración → Etiquetas QR → Imprimir. Escanear una etiqueta desde `/taller/escanear` (o escribir `demo-tele-78`): abre la nueva orden con el instrumento cargado.
6. Cuentas: entrar en otra pestaña como cliente nuevo por link de email (requiere que Supabase mande emails) → `/cuenta-pendiente`. Como taller, `/taller/cuentas` → vincular o aprobar.
7. `npm run build`, `npm run lint`, `npm run test` sin errores.

## Decisiones

- **Cuentas autogestionadas** en lugar de invitaciones: menos trabajo para el luthier y para quien compre el proyecto. Sin Auth0 ni otro proveedor: Supabase Auth cubre Google y magic link.
- **Fotos privadas** se guardan como `fotos-privadas:<ruta>` y se muestran con URLs firmadas por una hora. Solo al publicar en el portfolio se copia la foto al bucket público.
- **Cerrar desde cualquier estado abierto**: la acción recorre la máquina de estados hasta `listo` en vez de obligar a pasar por cada pantalla. La base sigue validando cada transición.
- **Etiquetas solo para instrumentos existentes** (no "en blanco"): el flujo es cargar el instrumento y después imprimir. Es más simple y no deja códigos huérfanos.
- **Avisos**: se implementó la pantalla de gestión ya en esta fase porque el panel la necesita; el job diario y el email quedan para la Fase 4.
- **Zona horaria**: la base calcula "hoy" en `America/Argentina/Buenos_Aires` con `fn_hoy()`; la app usa `hoyArgentina()`.

## Pendiente / próximas fases

- Fase 3: portal del cliente (resumen con semáforo, ficha, historial con fotos, PDF, aprobar presupuesto, datos, poner en venta).
- Fase 4: cron diario de recordatorios (Vercel Cron), email con Resend, Resend como SMTP de Auth.
- Fase 5: muestrario (publicar, moderar, sello vinculado a orden, filtros).
- Fase 6: Instagram, PWA, pulido, Lighthouse, documento de traspaso.
- Configurar el proveedor Google en Supabase (ver README) y poner `NEXT_PUBLIC_GOOGLE_AUTH=1`.
- Desactivar "Allow new users to sign up" ya **no** corresponde: ahora los clientes se registran solos. Dejarlo activado.
