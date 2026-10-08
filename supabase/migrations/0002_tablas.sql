-- Tables. Spanish names, snake_case. Every table has id, created_at, updated_at.

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
  proxima_revision date,
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

-- Public portfolio. Never exposes owner, client or serial number.
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

-- Cached Instagram feed. The site never calls Instagram at request time.
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

-- Single-row settings table (id is always true).
create table configuracion (
  id boolean primary key default true check (id),
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
