# Plan de la Fase 1 — Taller Mandioca

> Para revisar y aprobar antes de escribir código (punto 7.1 del prompt).

## 0. Entorno que encontré

| Herramienta | Estado |
|---|---|
| Node 24 / npm 11 | OK |
| git | OK, pero la carpeta todavía no es un repo |
| Supabase CLI | no instalado |
| Docker | no instalado |

Sin Docker no se puede correr Supabase local (`supabase start`). Propuesta: **proyecto Supabase en la nube (plan gratuito)** y aplicar migraciones con `npx supabase db push` (la CLI corre vía `npx`, no necesita Docker para eso). El README documenta las dos vías.

## 1. Estructura de carpetas

```
Mandioca/
├── docs/                      # prompt, prototipo, PLAN, FASE-N.md
├── public/
│   ├── logo-mandioca.png      # viene de docs/logo.png
│   ├── manifest.webmanifest   # PWA (Fase 6, se deja el esqueleto)
│   └── icons/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_enums.sql
│   │   ├── 0002_tablas.sql
│   │   ├── 0003_funciones_y_triggers.sql
│   │   ├── 0004_rls.sql
│   │   └── 0005_storage.sql
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # fuentes (next/font), tokens, tema
│   │   ├── globals.css                # variables del prototipo, modo oscuro
│   │   ├── (publico)/                 # sitio público, header/footer propios
│   │   │   ├── page.tsx               # Inicio
│   │   │   ├── trabajos/page.tsx
│   │   │   ├── en-venta/page.tsx
│   │   │   ├── en-venta/[id]/page.tsx
│   │   │   ├── ingreso/page.tsx
│   │   │   └── i/[token]/page.tsx     # destino del QR
│   │   ├── (cliente)/mi-cuenta/...    # Fase 3 (en Fase 1 solo el layout + guard)
│   │   ├── (taller)/taller/...        # Fase 2 (en Fase 1 solo el layout + guard)
│   │   ├── auth/callback/route.ts     # magic link / invitación
│   │   ├── auth/salir/route.ts
│   │   └── api/                       # cron, instagram, pdf (fases 4 y 6)
│   ├── components/
│   │   ├── ui/                        # Boton, Tarjeta, Chip, Semaforo, Foto, Campo...
│   │   ├── publico/                   # Hero, Servicios, GaleriaTrabajos, FeedInstagram...
│   │   └── layout/                    # BarraSuperior, NavInferior, Pie
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # browser
│   │   │   ├── server.ts              # server components / actions (cookies)
│   │   │   ├── admin.ts               # service role, solo en servidor
│   │   │   └── types.ts               # generado con `supabase gen types`
│   │   ├── domain/                    # reglas de negocio puras + tests Vitest
│   │   │   ├── ordenes.ts             # transiciones de estado
│   │   │   ├── revision.ts            # próxima revisión, semáforo
│   │   │   └── sello.ts               # condición "Revisado por el taller"
│   │   ├── notificaciones/            # capa abstracta
│   │   │   ├── index.ts               # enviar(aviso) → elige canal
│   │   │   ├── whatsapp.ts            # v1: arma links wa.me
│   │   │   └── email.ts               # Resend
│   │   ├── auth.ts                    # getSesion(), requerirRol('admin')
│   │   └── formato.ts                 # fechas, importes en ARS
│   ├── middleware.ts                  # refresca sesión, protege /taller y /mi-cuenta
│   └── config/
│       └── sitio.ts                   # constantes públicas (nombre, IG)
├── .env.example
├── .env.local                         # no se commitea
├── README.md
├── vitest.config.ts
└── package.json
```

Stack concreto: Next.js 15 (App Router, TS estricto), Tailwind 4, `@supabase/ssr` + `@supabase/supabase-js`, `lucide-react`, `vitest`, `eslint` (config de Next) y `prettier`.

## 2. Rutas

### Público
| Ruta | Qué muestra |
|---|---|
| `/` | Inicio: hero, 4 servicios, 3 últimos trabajos, banda portal, 3 publicaciones, 6 posts IG, contacto |
| `/trabajos` | Galería antes/después, filtros `?tipo=` y `?instrumento=`, paginada `?pagina=` |
| `/en-venta` | Listado con filtros y orden por query string |
| `/en-venta/[id]` | Detalle de publicación, sello, botón `wa.me` al vendedor |
| `/ingreso` | Email + contraseña y "Entrar con link" |
| `/i/[token]` | QR: redirige según rol (admin → nueva orden, dueño → ficha, otro → página mínima) |
| `/auth/callback` | Intercambia el código del magic link / invitación por sesión |
| `/auth/salir` | Cierra sesión |

### Cliente (`/mi-cuenta`, rol `cliente` o `admin`) — Fase 3
`/mi-cuenta`, `/mi-cuenta/instrumentos/[id]`, `/mi-cuenta/ordenes`, `/mi-cuenta/ordenes/[id]`, `/mi-cuenta/publicar`, `/mi-cuenta/datos`

### Taller (`/taller`, solo `admin`) — Fase 2
`/taller`, `/taller/ordenes/nueva`, `/taller/ordenes/[id]`, `/taller/ordenes/[id]/cerrar`, `/taller/escanear`, `/taller/clientes`, `/taller/clientes/[id]`, `/taller/avisos`, `/taller/muestrario`, `/taller/configuracion`, `/taller/configuracion/plantillas`, `/taller/configuracion/etiquetas`, `/taller/cierre`

### API (fases 4 y 6)
`/api/cron/recordatorios` (Vercel Cron, protegido con `CRON_SECRET`), `/api/instagram/callback`, `/api/instagram/refresh`, `/api/pdf/instrumento/[id]`

En Fase 1 se dejan creados los layouts de `(cliente)` y `(taller)` con el guard de rol y una pantalla "en construcción", para que el login ya aterrice donde corresponde.

## 3. Decisiones que tomé (avisame si no van)

1. **Ingreso por WhatsApp + contraseña**: Supabase soporta login por teléfono solo con un proveedor de SMS (Twilio, etc.), que cuesta plata y hay que configurar. Propongo que en v1 el ingreso sea **por email** (contraseña o magic link). El WhatsApp queda como dato de contacto y canal de avisos. Si un cliente no tiene email, el taller igual le crea la cuenta y la ficha; el cliente entra cuando cargue un email. Lo dejo preparado para sumar teléfono después.
2. **`perfiles.id` propio, `user_id` nullable**: así el taller puede crear el perfil del cliente al recibir el instrumento sin que exista todavía el usuario de Auth. Al enviar la invitación se vincula el `user_id`.
3. **Qué hace la base y qué hace la app al cerrar una orden**: el trigger de Postgres recalcula `proxima_revision`, cancela recordatorios pendientes y crea el nuevo (7 días antes). La fila de `trabajos_portfolio` la crea la server action, porque necesita las fotos de antes/después que se suben en ese mismo paso.
4. **Transiciones de estado validadas en la base** con un trigger, además de en TS (que es lo que testea Vitest). Así no hay forma de saltearse el flujo aunque se use el cliente de Supabase directo.
5. **Dos buckets de Storage** en vez de uno con políticas por carpeta: `fotos-privadas` (fotos de órdenes y números de serie; dueño + admin) y `fotos-publicas` (portfolio, muestrario, avatares). Al publicar un trabajo la app copia la foto al bucket público. Es más simple de razonar y de auditar.
6. **`configuracion.ig_token_encriptado`** se guarda cifrado con `pgsodium`/Vault de Supabase o, si el plan gratuito no lo permite, con AES en la app usando una clave en `.env`. Se define en Fase 6.
7. **Importes y precios en `numeric(12,2)`**, moneda por defecto `ARS`.

## 4. SQL de migraciones

### 0001_enums.sql

```sql
create extension if not exists pgcrypto;

create type rol_perfil as enum ('cliente', 'admin');
create type tipo_instrumento as enum ('electrica', 'acustica', 'criolla', 'bajo', 'otro');
create type estado_orden as enum ('recibido', 'presupuestado', 'aprobado', 'en_proceso', 'listo', 'entregado', 'cancelado');
create type momento_foto as enum ('antes', 'despues');
create type tipo_recordatorio as enum ('calibracion', 'cuerdas', 'otro');
create type canal_aviso as enum ('whatsapp', 'email');
create type estado_recordatorio as enum ('pendiente', 'enviado', 'pausado', 'cancelado');
create type estado_instrumento_venta as enum ('excelente', 'muy_bueno', 'bueno', 'regular');
create type estado_publicacion as enum ('borrador', 'publicada', 'pausada', 'vendida');
create type tipo_ig_post as enum ('imagen', 'video', 'carrusel');
```

### 0002_tablas.sql

```sql
create table perfiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  nombre text not null,
  whatsapp text,
  email text,
  rol rol_perfil not null default 'cliente',
  avatar_url text,
  canal_preferido canal_aviso not null default 'whatsapp',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint perfiles_contacto check (whatsapp is not null or email is not null)
);
create unique index perfiles_email_idx on perfiles (lower(email)) where email is not null;

create table tipos_trabajo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  detalle_sugerido text,
  meses_hasta_revision int not null default 6 check (meses_hasta_revision >= 0),
  precio_base numeric(12,2),
  requiere_presupuesto boolean not null default true,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table instrumentos (
  id uuid primary key default gen_random_uuid(),
  dueno_id uuid not null references perfiles (id) on delete restrict,
  tipo tipo_instrumento not null,
  marca text,
  modelo text,
  anio int,
  numero_serie text,
  foto_url text,
  foto_serie_url text,
  calibre_cuerdas text,
  afinacion text,
  escala text,
  trastes_cantidad int,
  trastes_material text,
  action_graves_mm numeric(4,2),
  action_agudos_mm numeric(4,2),
  calibracion_cada_meses int not null default 6,
  proxima_revision date,
  qr_token text not null unique default encode(gen_random_bytes(8), 'hex'),
  en_venta boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index instrumentos_dueno_idx on instrumentos (dueno_id);
create index instrumentos_serie_idx on instrumentos (numero_serie);

create table ordenes (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  instrumento_id uuid not null references instrumentos (id) on delete restrict,
  cliente_id uuid not null references perfiles (id) on delete restrict,
  tipo_trabajo_id uuid not null references tipos_trabajo (id) on delete restrict,
  pedido_cliente text,
  estado estado_orden not null default 'recibido',
  presupuesto numeric(12,2),
  presupuesto_aprobado_at timestamptz,
  detalle_realizado text,
  importe numeric(12,2),
  cuerdas_puestas text,
  notas_internas text,
  fecha_ingreso date not null default current_date,
  fecha_estimada date,
  fecha_cierre date,
  proxima_revision date,                 -- la que el taller fijó al cerrar (editable)
  publicar_en_portfolio boolean not null default true,
  avisar_cliente boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ordenes_instrumento_idx on ordenes (instrumento_id);
create index ordenes_cliente_idx on ordenes (cliente_id);
create index ordenes_estado_idx on ordenes (estado);

create table fotos_orden (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes (id) on delete cascade,
  url text not null,
  momento momento_foto not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fotos_orden_orden_idx on fotos_orden (orden_id);

create table trabajos_portfolio (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null unique references ordenes (id) on delete cascade,
  titulo text not null,
  descripcion text,
  tipo_trabajo_id uuid references tipos_trabajo (id) on delete set null,
  instrumento_tipo tipo_instrumento not null,
  foto_antes_url text,
  foto_despues_url text,
  destacado boolean not null default false,
  visible boolean not null default true,
  fecha date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table recordatorios (
  id uuid primary key default gen_random_uuid(),
  instrumento_id uuid not null references instrumentos (id) on delete cascade,
  cliente_id uuid not null references perfiles (id) on delete cascade,
  tipo tipo_recordatorio not null default 'calibracion',
  fecha_programada date not null,
  canal canal_aviso not null,
  estado estado_recordatorio not null default 'pendiente',
  enviado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recordatorios_pendientes_idx on recordatorios (fecha_programada) where estado = 'pendiente';

create table publicaciones_venta (
  id uuid primary key default gen_random_uuid(),
  instrumento_id uuid not null references instrumentos (id) on delete cascade,
  vendedor_id uuid not null references perfiles (id) on delete cascade,
  titulo text not null,
  descripcion text,
  precio numeric(12,2) not null check (precio >= 0),
  moneda text not null default 'ARS',
  estado_instrumento estado_instrumento_venta not null,
  con_estuche boolean not null default false,
  acepta_permuta boolean not null default false,
  mostrar_historial boolean not null default false,
  pide_revision boolean not null default false,
  revisado_por_taller boolean not null default false,
  revision_orden_id uuid references ordenes (id) on delete set null,
  revisado_at date,
  estado estado_publicacion not null default 'borrador',
  destacada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index publicaciones_publicadas_idx on publicaciones_venta (created_at desc) where estado = 'publicada';

create table fotos_publicacion (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones_venta (id) on delete cascade,
  url text not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table instagram_posts (
  id uuid primary key default gen_random_uuid(),
  ig_id text not null unique,
  tipo tipo_ig_post not null,
  media_url text not null,
  thumbnail_url text,
  permalink text not null,
  caption text,
  fecha timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table configuracion (
  id boolean primary key default true check (id),   -- fuerza una sola fila
  nombre_taller text not null default 'Taller de Instrumentos Mandioca',
  direccion text,
  horario text,
  whatsapp text,
  email text,
  instagram_user text default 'mandiocataller',
  texto_aviso_calibracion text,
  texto_aviso_listo text,
  moderacion_automatica boolean not null default false,
  ig_token_encriptado text,
  ig_token_vence_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 0003_funciones_y_triggers.sql

```sql
-- updated_at automático en todas las tablas
create or replace function fn_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['perfiles','tipos_trabajo','instrumentos','ordenes','fotos_orden',
    'trabajos_portfolio','recordatorios','publicaciones_venta','fotos_publicacion',
    'instagram_posts','configuracion']
  loop
    execute format('create trigger trg_%s_updated_at before update on %I
                    for each row execute function fn_set_updated_at()', t, t);
  end loop;
end $$;

-- helpers para RLS (security definer para no entrar en recursión sobre perfiles)
create or replace function fn_perfil_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from perfiles where user_id = auth.uid()
$$;

create or replace function fn_es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where user_id = auth.uid() and rol = 'admin')
$$;

-- transición de estados válida
create or replace function fn_transicion_valida(desde estado_orden, hacia estado_orden, salta_presupuesto boolean)
returns boolean language sql immutable as $$
  select case
    when desde = hacia then true
    when hacia = 'cancelado' then desde not in ('listo', 'entregado', 'cancelado')
    when desde = 'recibido' then hacia = 'presupuestado' or (salta_presupuesto and hacia = 'en_proceso')
    when desde = 'presupuestado' then hacia = 'aprobado'
    when desde = 'aprobado' then hacia = 'en_proceso'
    when desde = 'en_proceso' then hacia = 'listo'
    when desde = 'listo' then hacia = 'entregado'
    else false
  end
$$;

create or replace function fn_ordenes_before_update() returns trigger
language plpgsql as $$
declare salta boolean;
begin
  if new.estado <> old.estado then
    select not requiere_presupuesto into salta from tipos_trabajo where id = new.tipo_trabajo_id;
    if not fn_transicion_valida(old.estado, new.estado, coalesce(salta, false)) then
      raise exception 'Transición de estado no permitida: % → %', old.estado, new.estado
        using errcode = 'check_violation';
    end if;
    if new.estado = 'aprobado' and new.presupuesto_aprobado_at is null then
      new.presupuesto_aprobado_at = now();
    end if;
    if new.estado = 'listo' then
      new.fecha_cierre = coalesce(new.fecha_cierre, current_date);
    end if;
  end if;
  return new;
end $$;

create trigger trg_ordenes_before_update before update on ordenes
for each row execute function fn_ordenes_before_update();

-- al cerrar (→ listo): próxima revisión del instrumento + recordatorio
create or replace function fn_ordenes_cerrada() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meses int;
  proxima date;
  canal canal_aviso;
begin
  if new.estado = 'listo' and old.estado <> 'listo' then
    select meses_hasta_revision into meses from tipos_trabajo where id = new.tipo_trabajo_id;
    proxima := coalesce(new.proxima_revision, new.fecha_cierre + (coalesce(meses, 6) || ' months')::interval)::date;

    update ordenes set proxima_revision = proxima where id = new.id and proxima_revision is distinct from proxima;
    update instrumentos set proxima_revision = proxima where id = new.instrumento_id;

    update recordatorios set estado = 'cancelado'
      where instrumento_id = new.instrumento_id and estado = 'pendiente';

    select canal_preferido into canal from perfiles where id = new.cliente_id;
    insert into recordatorios (instrumento_id, cliente_id, tipo, fecha_programada, canal)
      values (new.instrumento_id, new.cliente_id, 'calibracion', proxima - 7, coalesce(canal, 'whatsapp'));
  end if;
  return new;
end $$;

create trigger trg_ordenes_cerrada after update of estado on ordenes
for each row execute function fn_ordenes_cerrada();

-- crea el perfil cuando un usuario de Auth se registra y no fue invitado por el taller
create or replace function fn_auth_user_creado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update perfiles set user_id = new.id where user_id is null and lower(email) = lower(new.email);
  if not found then
    insert into perfiles (user_id, nombre, email)
      values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)), new.email);
  end if;
  return new;
end $$;

create trigger trg_auth_user_creado after insert on auth.users
for each row execute function fn_auth_user_creado();
```

### 0004_rls.sql

```sql
alter table perfiles enable row level security;
alter table tipos_trabajo enable row level security;
alter table instrumentos enable row level security;
alter table ordenes enable row level security;
alter table fotos_orden enable row level security;
alter table trabajos_portfolio enable row level security;
alter table recordatorios enable row level security;
alter table publicaciones_venta enable row level security;
alter table fotos_publicacion enable row level security;
alter table instagram_posts enable row level security;
alter table configuracion enable row level security;

-- admin: todo en todas las tablas
create policy admin_todo on perfiles for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on tipos_trabajo for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on instrumentos for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on ordenes for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on fotos_orden for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on trabajos_portfolio for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on recordatorios for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on publicaciones_venta for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on fotos_publicacion for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on instagram_posts for all using (fn_es_admin()) with check (fn_es_admin());
create policy admin_todo on configuracion for all using (fn_es_admin()) with check (fn_es_admin());

-- cliente: lo suyo
create policy cliente_lee_su_perfil on perfiles for select using (user_id = auth.uid());
create policy cliente_edita_su_perfil on perfiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and rol = 'cliente');

create policy cliente_lee_tipos on tipos_trabajo for select using (auth.uid() is not null and activo);

create policy cliente_lee_instrumentos on instrumentos for select using (dueno_id = fn_perfil_id());
create policy cliente_edita_instrumentos on instrumentos for update
  using (dueno_id = fn_perfil_id()) with check (dueno_id = fn_perfil_id());
  -- qué columnas puede tocar (foto, calibre, en_venta) se limita con grants por columna:
revoke update on instrumentos from authenticated;
grant update (foto_url, calibre_cuerdas, en_venta) on instrumentos to authenticated;

create policy cliente_lee_ordenes on ordenes for select using (cliente_id = fn_perfil_id());
create policy cliente_aprueba_presupuesto on ordenes for update
  using (cliente_id = fn_perfil_id() and estado = 'presupuestado')
  with check (cliente_id = fn_perfil_id() and estado = 'aprobado');
revoke update on ordenes from authenticated;
grant update (estado) on ordenes to authenticated;

create policy cliente_lee_fotos_orden on fotos_orden for select
  using (exists (select 1 from ordenes o where o.id = orden_id and o.cliente_id = fn_perfil_id()));

create policy cliente_lee_recordatorios on recordatorios for select using (cliente_id = fn_perfil_id());

create policy cliente_publicaciones on publicaciones_venta for all
  using (vendedor_id = fn_perfil_id())
  with check (vendedor_id = fn_perfil_id() and revisado_por_taller = false and destacada = false);
revoke update on publicaciones_venta from authenticated;
grant update (titulo, descripcion, precio, moneda, estado_instrumento, con_estuche, acepta_permuta,
  mostrar_historial, pide_revision, estado) on publicaciones_venta to authenticated;

create policy cliente_fotos_publicacion on fotos_publicacion for all
  using (exists (select 1 from publicaciones_venta p where p.id = publicacion_id and p.vendedor_id = fn_perfil_id()))
  with check (exists (select 1 from publicaciones_venta p where p.id = publicacion_id and p.vendedor_id = fn_perfil_id()));

-- público (anon y authenticated)
create policy publico_portfolio on trabajos_portfolio for select using (visible);
create policy publico_publicaciones on publicaciones_venta for select using (estado = 'publicada');
create policy publico_fotos_publicacion on fotos_publicacion for select
  using (exists (select 1 from publicaciones_venta p where p.id = publicacion_id and p.estado = 'publicada'));
create policy publico_instagram on instagram_posts for select using (true);

-- la config pública se expone con una vista sin columnas sensibles
create view configuracion_publica with (security_invoker = false) as
  select nombre_taller, direccion, horario, whatsapp, email, instagram_user from configuracion;
grant select on configuracion_publica to anon, authenticated;

-- el vendedor expone su whatsapp y el historial sin datos personales por vistas
create view vendedores_publicos with (security_invoker = false) as
  select p.id as publicacion_id, pe.nombre, pe.whatsapp
  from publicaciones_venta p join perfiles pe on pe.id = p.vendedor_id
  where p.estado = 'publicada';
grant select on vendedores_publicos to anon, authenticated;

create view historial_publico with (security_invoker = false) as
  select p.id as publicacion_id, o.fecha_cierre, t.nombre as tipo_trabajo, o.detalle_realizado
  from publicaciones_venta p
  join ordenes o on o.instrumento_id = p.instrumento_id and o.estado in ('listo', 'entregado')
  join tipos_trabajo t on t.id = o.tipo_trabajo_id
  where p.estado = 'publicada' and p.mostrar_historial;
grant select on historial_publico to anon, authenticated;
```

### 0005_storage.sql

```sql
insert into storage.buckets (id, name, public) values
  ('fotos-publicas', 'fotos-publicas', true),
  ('fotos-privadas', 'fotos-privadas', false);

-- públicas: cualquiera lee; sube admin, o el cliente dentro de su carpeta perfiles/<perfil_id>/...
create policy publicas_lee on storage.objects for select using (bucket_id = 'fotos-publicas');
create policy publicas_admin on storage.objects for all
  using (bucket_id = 'fotos-publicas' and fn_es_admin())
  with check (bucket_id = 'fotos-publicas' and fn_es_admin());
create policy publicas_cliente on storage.objects for all
  using (bucket_id = 'fotos-publicas' and (storage.foldername(name))[1] = fn_perfil_id()::text)
  with check (bucket_id = 'fotos-publicas' and (storage.foldername(name))[1] = fn_perfil_id()::text);

-- privadas: carpeta ordenes/<orden_id>/...; admin todo, cliente solo lee lo de sus órdenes
create policy privadas_admin on storage.objects for all
  using (bucket_id = 'fotos-privadas' and fn_es_admin())
  with check (bucket_id = 'fotos-privadas' and fn_es_admin());
create policy privadas_cliente_lee on storage.objects for select
  using (bucket_id = 'fotos-privadas' and exists (
    select 1 from ordenes o
    where o.id::text = (storage.foldername(name))[2] and o.cliente_id = fn_perfil_id()));
```

## 5. Seeds (resumen, se escriben al implementar)

Con los nombres y textos del prototipo: 1 admin, 3 clientes, 6 instrumentos, 7 tipos de trabajo (calibración, cambio de cuerdas, trasteado, electrónica, encolado, pintura, otro), 6 trabajos de portfolio con sus órdenes cerradas, 4 órdenes abiertas en distintos estados, 6 publicaciones, 6 posts de Instagram con imágenes placeholder, y la fila de configuración con placeholders `COMPLETAR:` donde faltan datos tuyos.

Los usuarios de Auth de demo (admin y 3 clientes) se crean con un script `npm run seed:usuarios` que usa la service role key, porque `auth.users` no se puede sembrar bien por SQL plano.

## 6. Orden de trabajo de la Fase 1

1. `git init`, `.gitignore`, Next.js + Tailwind + ESLint + Prettier + Vitest.
2. `supabase/` con migraciones y seed; aplicar al proyecto en la nube; generar tipos.
3. Design system: tokens de `globals.css`, fuentes, componentes `ui/`.
4. Auth: clientes de Supabase, middleware, `/ingreso`, callback, guards por rol.
5. Sitio público contra la base: inicio, trabajos, en venta, detalle, QR.
6. Tests de dominio (transiciones, próxima revisión, semáforo, sello).
7. `npm run build`, `npm run lint`, `docs/FASE-1.md`, commit.

## 7. Lo que necesito de vos

1. **OK a este plan** (o cambios).
2. **Proyecto en Supabase**: crealo en supabase.com (gratis) y pasame `Project URL`, `anon key`, `service_role key` y la contraseña de la base. Los pego en `.env.local`, nunca en el repo.
3. **Resend**: no hace falta hasta la Fase 4. Lo mismo con Instagram (Fase 6).
4. Confirmá la decisión 1 (ingreso por email en v1).
