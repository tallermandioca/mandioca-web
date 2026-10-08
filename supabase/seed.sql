-- Demo data mirroring docs/prototipo.html. Safe to re-run: clears the domain tables first.
-- Auth users for these profiles are created by `npm run seed:usuarios` (see scripts/seed-usuarios.ts).

begin;

truncate table fotos_publicacion, publicaciones_venta, recordatorios, trabajos_portfolio, fotos_orden,
  ordenes, instrumentos, tipos_trabajo, instagram_posts, configuracion, perfiles restart identity cascade;

-- Perfiles -------------------------------------------------------------------
insert into perfiles (id, nombre, whatsapp, email, rol, canal_preferido) values
  ('00000000-0000-4000-8000-00000000a001', 'Taller Mandioca', null, 'tallermandioca.dev@gmail.com', 'admin', 'email'),
  ('00000000-0000-4000-8000-00000000c001', 'Martín Suárez',   '5492991111111', 'martin@demo.mandioca.ar', 'cliente', 'whatsapp'),
  ('00000000-0000-4000-8000-00000000c002', 'Lucía Pérez',     '5492992222222', 'lucia@demo.mandioca.ar',  'cliente', 'whatsapp'),
  ('00000000-0000-4000-8000-00000000c003', 'Jorge Ramírez',   '5492993333333', 'jorge@demo.mandioca.ar',  'cliente', 'email'),
  ('00000000-0000-4000-8000-00000000c004', 'Sofía Martínez',  '5492994444444', 'sofia@demo.mandioca.ar',  'cliente', 'whatsapp'),
  ('00000000-0000-4000-8000-00000000c005', 'Ana García',      '5492995555555', 'ana@demo.mandioca.ar',    'cliente', 'whatsapp'),
  ('00000000-0000-4000-8000-00000000c006', 'Lucas Díaz',      '5492996666666', 'lucas@demo.mandioca.ar',  'cliente', 'whatsapp');

-- Tipos de trabajo -----------------------------------------------------------
insert into tipos_trabajo (id, nombre, detalle_sugerido, meses_hasta_revision, precio_base, requiere_presupuesto, orden) values
  ('00000000-0000-4000-8000-0000000000a1', 'Calibración',       'Alma, action, octavación y limpieza de trastes.', 6, 35000, false, 1),
  ('00000000-0000-4000-8000-0000000000a2', 'Cambio de cuerdas', 'Cambio de cuerdas y limpieza general.', 4, 12000, false, 2),
  ('00000000-0000-4000-8000-0000000000a3', 'Refrete',           'Refrete completo, nivelado y cejilla nueva.', 12, null, true, 3),
  ('00000000-0000-4000-8000-0000000000a4', 'Reparación',        'Reparación estructural o de herrajes.', 6, null, true, 4),
  ('00000000-0000-4000-8000-0000000000a5', 'Restauración',      'Recuperar lo que se pueda, respetar lo original.', 6, null, true, 5),
  ('00000000-0000-4000-8000-0000000000a6', 'Electrónica',       'Revisión de cableado, potes, selector y jack.', 6, null, true, 6),
  ('00000000-0000-4000-8000-0000000000a7', 'Construcción',      'Instrumento a medida.', 6, null, true, 7);

-- Instrumentos ----------------------------------------------------------------
insert into instrumentos (id, dueno_id, tipo, marca, modelo, anio, numero_serie, calibre_cuerdas, afinacion, escala,
  action_graves_mm, action_agudos_mm, calibracion_cada_meses, proxima_revision, qr_token) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000c001', 'electrica', 'Fender', 'Telecaster ''78', 1978, 'S812345',
    'D''Addario 010–046', 'Estándar E', '25.5"', 1.6, 2.0, 6, '2026-09-15', 'demo-tele-78'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-00000000c001', 'bajo', 'Fender', 'Jazz Bass MIJ', 1994, 'MIJ-U0459',
    '045–105', 'Estándar', '34"', 2.0, 2.4, 6, '2026-10-31', 'demo-jazz-bass'),
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-00000000c001', 'criolla', 'Fonseca', '40', null, null,
    'Nylon tensión media', 'Estándar', '650 mm', 3.0, 4.0, 6, '2027-01-05', 'demo-fonseca-40'),
  ('00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-00000000c002', 'electrica', 'Epiphone', 'Les Paul Studio', 2012, 'EE120455',
    '010–046', 'Estándar E', '24.75"', 1.8, 2.2, 6, '2027-02-10', 'demo-lp-studio'),
  ('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-00000000c003', 'criolla', 'Alpujarra', '80', null, null,
    'Nylon tensión alta', 'Estándar', '650 mm', 3.2, 4.0, 6, '2027-03-05', 'demo-alpujarra'),
  ('00000000-0000-4000-8000-0000000000b6', '00000000-0000-4000-8000-00000000c004', 'electrica', 'Fender', 'Stratocaster MIM', 2015, 'MX15123456',
    '009–042', 'Estándar E', '25.5"', 1.6, 2.0, 6, '2027-03-10', 'demo-strato-mim'),
  ('00000000-0000-4000-8000-0000000000b7', '00000000-0000-4000-8000-00000000c005', 'acustica', 'Yamaha', 'FG800', 2019, 'HQ0123',
    '012–053', 'Estándar E', '25.6"', 2.2, 2.8, 6, '2027-01-15', 'demo-yamaha-fg'),
  ('00000000-0000-4000-8000-0000000000b8', '00000000-0000-4000-8000-00000000c006', 'electrica', 'Mandioca', 'Tipo T, cuerpo de lenga', 2026, 'MND-0001',
    '010–046', 'Estándar E', '25.5"', 1.6, 2.0, 6, '2026-12-20', 'demo-mandioca-t'),
  ('00000000-0000-4000-8000-0000000000b9', '00000000-0000-4000-8000-00000000c005', 'acustica', 'Takamine', 'EG340', 2008, 'TK08345',
    '012–053', 'Estándar E', '25.4"', 2.2, 2.8, 6, '2027-02-15', 'demo-takamine'),
  ('00000000-0000-4000-8000-0000000000ba', '00000000-0000-4000-8000-00000000c006', 'bajo', 'Ibanez', 'SR300', 2017, 'I170555',
    '045–105', 'Estándar', '34"', 2.0, 2.5, 6, '2027-03-20', 'demo-ibanez-sr300'),
  ('00000000-0000-4000-8000-0000000000bb', '00000000-0000-4000-8000-00000000c003', 'electrica', 'Squier', 'Classic Vibe Jazzmaster', 2020, 'CV20789',
    '010–046', 'Estándar E', '25.5"', 1.8, 2.2, 6, '2026-12-25', 'demo-squier-jm');

-- Órdenes cerradas (historial + portfolio) ------------------------------------
insert into ordenes (id, numero, instrumento_id, cliente_id, tipo_trabajo_id, pedido_cliente, estado, detalle_realizado, importe,
  cuerdas_puestas, fecha_ingreso, fecha_cierre, proxima_revision, publicar_en_portfolio) values
  ('00000000-0000-4000-8000-000000000160', 160, '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a6',
    'Selector que falla y jack con ruido', 'entregado', 'Cambio de selector y jack', 28000, null, '2025-10-28', '2025-11-02', '2026-05-02', false),
  ('00000000-0000-4000-8000-000000000175', 175, '00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a1',
    'Calibración', 'entregado', 'Alma, action, octavación', 30000, '045–105', '2026-02-08', '2026-02-10', '2026-08-10', false),
  ('00000000-0000-4000-8000-000000000180', 180, '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a1',
    'Calibración de temporada', 'entregado', 'Alma, action, octavación, limpieza', 30000, 'D''Addario 010–046', '2026-03-13', '2026-03-15', '2026-09-15', false),
  ('00000000-0000-4000-8000-000000000190', 190, '00000000-0000-4000-8000-0000000000b8', '00000000-0000-4000-8000-00000000c006', '00000000-0000-4000-8000-0000000000a7',
    'Guitarra a medida tipo T', 'entregado', 'Mástil de arce, escala 25.5", pastillas bobinadas a mano.', null, '010–046', '2026-03-01', '2026-06-20', '2026-12-20', true),
  ('00000000-0000-4000-8000-000000000192', 192, '00000000-0000-4000-8000-0000000000bb', '00000000-0000-4000-8000-00000000c003', '00000000-0000-4000-8000-0000000000a1',
    'Calibración y revisión de puente', 'entregado', 'Puente mejorado, calibración completa', 35000, '010–046', '2026-06-22', '2026-06-25', '2026-12-25', false),
  ('00000000-0000-4000-8000-000000000195', 195, '00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a1',
    'Calibración', 'entregado', 'Cejilla y selleta ajustadas, cambio de cuerdas', 25000, 'Nylon tensión media', '2026-07-03', '2026-07-05', '2027-01-05', false),
  ('00000000-0000-4000-8000-000000000199', 199, '00000000-0000-4000-8000-0000000000b7', '00000000-0000-4000-8000-00000000c005', '00000000-0000-4000-8000-0000000000a4',
    'Clavijero quebrado', 'entregado', 'Encolado estructural y refuerzo interno, sin repintar.', 60000, '012–053', '2026-07-01', '2026-07-15', '2027-01-15', true),
  ('00000000-0000-4000-8000-000000000205', 205, '00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a6',
    'Ruido de masa y potes que saltan', 'entregado', 'Blindaje de cavidades, potes y jack nuevos', 55000, null, '2026-08-12', '2026-08-20', '2027-02-20', true),
  ('00000000-0000-4000-8000-000000000208', 208, '00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-00000000c002', '00000000-0000-4000-8000-0000000000a1',
    'Calibración completa', 'entregado', 'Alma, action, octavación y limpieza de trastes.', 35000, '010–046', '2026-08-08', '2026-08-10', '2027-02-10', true),
  ('00000000-0000-4000-8000-000000000210', 210, '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a3',
    'Trastes gastados, quiere acero inoxidable', 'entregado', 'Refrete completo, nivelado y cejilla de hueso nueva.', 180000, 'D''Addario 010–046', '2026-08-25', '2026-09-12', '2027-09-12', true),
  ('00000000-0000-4000-8000-000000000215', 215, '00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-00000000c003', '00000000-0000-4000-8000-0000000000a5',
    'Tapa rajada y puente despegado', 'entregado', 'Encolado de tapa, puente recolocado y barniz retocado a mano.', 90000, 'Nylon tensión alta', '2026-08-15', '2026-09-05', '2027-03-05', true),
  ('00000000-0000-4000-8000-000000000218', 218, '00000000-0000-4000-8000-0000000000b9', '00000000-0000-4000-8000-00000000c005', '00000000-0000-4000-8000-0000000000a1',
    'Revisión para venta', 'entregado', 'Calibración, cuerdas nuevas, ecualizador probado', 35000, '012–053', '2026-08-14', '2026-08-15', '2027-02-15', false),
  ('00000000-0000-4000-8000-000000000220', 220, '00000000-0000-4000-8000-0000000000b6', '00000000-0000-4000-8000-00000000c004', '00000000-0000-4000-8000-0000000000a1',
    'Revisión para venta', 'entregado', 'Calibración completa, trastes pulidos', 35000, '009–042', '2026-09-09', '2026-09-10', '2027-03-10', false),
  ('00000000-0000-4000-8000-000000000222', 222, '00000000-0000-4000-8000-0000000000ba', '00000000-0000-4000-8000-00000000c006', '00000000-0000-4000-8000-0000000000a1',
    'Revisión para venta', 'entregado', 'Electrónica activa revisada, calibración', 35000, '045–105', '2026-09-19', '2026-09-20', '2027-03-20', false);

-- Órdenes abiertas ------------------------------------------------------------
insert into ordenes (id, numero, instrumento_id, cliente_id, tipo_trabajo_id, pedido_cliente, estado, presupuesto, presupuesto_aprobado_at,
  fecha_ingreso, fecha_estimada, fecha_cierre) values
  ('00000000-0000-4000-8000-000000000229', 229, '00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-00000000c003', '00000000-0000-4000-8000-0000000000a4',
    'Puente despegado', 'listo', 40000, '2026-09-30', '2026-09-29', '2026-10-06', '2026-10-06'),
  ('00000000-0000-4000-8000-000000000231', 231, '00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a4',
    'Cambiar puente por uno de alta masa, revisar octavación.', 'en_proceso', 65000, '2026-10-03', '2026-10-02', '2026-10-14', null),
  ('00000000-0000-4000-8000-000000000232', 232, '00000000-0000-4000-8000-0000000000b6', '00000000-0000-4000-8000-00000000c004', '00000000-0000-4000-8000-0000000000a6',
    'Pastilla del medio no suena', 'presupuestado', 45000, null, '2026-10-03', null, null),
  ('00000000-0000-4000-8000-000000000234', 234, '00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-00000000c002', '00000000-0000-4000-8000-0000000000a1',
    'Calibración', 'recibido', null, null, '2026-10-07', '2026-10-10', null);

select setval('ordenes_numero_seq', 240);

update ordenes set detalle_realizado = 'Puente encolado y prensado 48 h, cuerdas nuevas.', importe = 40000, proxima_revision = '2027-04-06'
  where numero = 229;

-- Fotos de órdenes (placeholders) ---------------------------------------------
insert into fotos_orden (orden_id, url, momento, orden)
select o.id, 'placeholder:[FOTO · antes]', 'antes', 0 from ordenes o where o.numero in (190, 199, 205, 208, 210, 215, 231);
insert into fotos_orden (orden_id, url, momento, orden)
select o.id, 'placeholder:[FOTO · después]', 'despues', 0 from ordenes o where o.numero in (190, 199, 205, 208, 210, 215);

-- Portfolio -------------------------------------------------------------------
insert into trabajos_portfolio (orden_id, titulo, descripcion, tipo_trabajo_id, instrumento_tipo, foto_antes_url, foto_despues_url, destacado, fecha) values
  ('00000000-0000-4000-8000-000000000210', 'Telecaster ''78 — trastes de acero inoxidable', 'Refrete completo, nivelado y cejilla de hueso nueva.',
    '00000000-0000-4000-8000-0000000000a3', 'electrica', 'placeholder:[FOTO · antes]', 'placeholder:[FOTO · después]', true, '2026-09-12'),
  ('00000000-0000-4000-8000-000000000215', 'Criolla — tapa rajada y puente despegado', 'Encolado de tapa, puente recolocado y barniz retocado a mano.',
    '00000000-0000-4000-8000-0000000000a5', 'criolla', 'placeholder:[FOTO · antes]', 'placeholder:[FOTO · después]', false, '2026-09-05'),
  ('00000000-0000-4000-8000-000000000205', 'Jazz Bass — blindaje y cableado nuevo', 'Cavidades blindadas con cobre, potes y jack reemplazados.',
    '00000000-0000-4000-8000-0000000000a6', 'bajo', 'placeholder:[FOTO · antes]', 'placeholder:[FOTO · después]', false, '2026-08-20'),
  ('00000000-0000-4000-8000-000000000208', 'Les Paul Studio — calibración completa', 'Alma, action, octavación y limpieza de trastes.',
    '00000000-0000-4000-8000-0000000000a1', 'electrica', 'placeholder:[FOTO · antes]', 'placeholder:[FOTO · después]', false, '2026-08-10'),
  ('00000000-0000-4000-8000-000000000199', 'Acústica Yamaha — clavijero quebrado', 'Encolado estructural y refuerzo interno, sin repintar.',
    '00000000-0000-4000-8000-0000000000a4', 'acustica', 'placeholder:[FOTO · antes]', 'placeholder:[FOTO · después]', false, '2026-07-15'),
  ('00000000-0000-4000-8000-000000000190', 'Guitarra a medida — tipo T, cuerpo de lenga', 'Mástil de arce, escala 25.5", pastillas bobinadas a mano.',
    '00000000-0000-4000-8000-0000000000a7', 'electrica', 'placeholder:[FOTO · antes]', 'placeholder:[FOTO · después]', true, '2026-06-20');

-- Recordatorios ---------------------------------------------------------------
insert into recordatorios (instrumento_id, cliente_id, tipo, fecha_programada, canal, estado) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000c001', 'calibracion', '2026-10-13', 'whatsapp', 'pendiente'),
  ('00000000-0000-4000-8000-0000000000b7', '00000000-0000-4000-8000-00000000c005', 'cuerdas',     '2026-10-15', 'whatsapp', 'pendiente'),
  ('00000000-0000-4000-8000-0000000000ba', '00000000-0000-4000-8000-00000000c006', 'calibracion', '2026-10-16', 'whatsapp', 'pendiente'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-00000000c001', 'calibracion', '2026-10-24', 'whatsapp', 'pendiente'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000c001', 'calibracion', '2026-09-08', 'whatsapp', 'enviado');
update recordatorios set enviado_at = '2026-09-08 10:00-03' where estado = 'enviado';

-- Publicaciones de venta --------------------------------------------------------
insert into publicaciones_venta (id, instrumento_id, vendedor_id, titulo, descripcion, precio, estado_instrumento, con_estuche, acepta_permuta,
  mostrar_historial, revisado_por_taller, revision_orden_id, revisado_at, estado) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000b6', '00000000-0000-4000-8000-00000000c004',
    'Fender Stratocaster MIM 2015', 'Sunburst, mástil de maple, estuche rígido. Calibrada en el taller.', 850000, 'muy_bueno', true, false,
    true, true, '00000000-0000-4000-8000-000000000220', '2026-09-10', 'publicada'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000b9', '00000000-0000-4000-8000-00000000c005',
    'Takamine EG340 electroacústica', 'Ecualizador original, cuerdas nuevas. Funda acolchada.', 420000, 'bueno', false, false,
    true, true, '00000000-0000-4000-8000-000000000218', '2026-08-15', 'publicada'),
  ('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-0000000000ba', '00000000-0000-4000-8000-00000000c006',
    'Ibanez SR300 bajo 4 cuerdas', 'Electrónica activa revisada, trastes al 90%.', 380000, 'excelente', false, false,
    true, true, '00000000-0000-4000-8000-000000000222', '2026-09-20', 'publicada'),
  ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-00000000c002',
    'Epiphone Les Paul Studio', 'Pastillas Seymour Duncan. Con estuche.', 650000, 'muy_bueno', true, false,
    false, true, '00000000-0000-4000-8000-000000000208', '2026-08-10', 'publicada'),
  ('00000000-0000-4000-8000-0000000000d5', '00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-00000000c001',
    'Criolla Fonseca 40', 'Ideal para estudio. Se entrega con funda.', 120000, 'bueno', false, false,
    false, false, null, null, 'publicada'),
  ('00000000-0000-4000-8000-0000000000d6', '00000000-0000-4000-8000-0000000000bb', '00000000-0000-4000-8000-00000000c003',
    'Squier Classic Vibe Jazzmaster', 'Puente mejorado, calibrada. Acepta permuta por bajo.', 520000, 'excelente', false, true,
    true, true, '00000000-0000-4000-8000-000000000192', '2026-06-25', 'publicada');

insert into fotos_publicacion (publicacion_id, url, orden)
select id, 'placeholder:[FOTO · ' || titulo || ']', 0 from publicaciones_venta;

-- Instagram (caché) ---------------------------------------------------------------
insert into instagram_posts (ig_id, tipo, media_url, thumbnail_url, permalink, caption, fecha) values
  ('demo-1', 'imagen',   'placeholder:[POST · refrete Tele]', null, 'https://www.instagram.com/mandiocataller/', 'Refrete en acero inoxidable para una Tele del 78.', '2026-10-05 12:00-03'),
  ('demo-2', 'video',    'placeholder:[REEL · nivelado]',     null, 'https://www.instagram.com/mandiocataller/', 'Nivelado de trastes, paso a paso.', '2026-10-01 12:00-03'),
  ('demo-3', 'imagen',   'placeholder:[POST · criolla]',      null, 'https://www.instagram.com/mandiocataller/', 'Criolla con tapa rajada: encolado y vuelta a la vida.', '2026-09-26 12:00-03'),
  ('demo-4', 'imagen',   'placeholder:[POST · banco]',        null, 'https://www.instagram.com/mandiocataller/', 'El banco un lunes a la mañana.', '2026-09-20 12:00-03'),
  ('demo-5', 'carrusel', 'placeholder:[POST · Jazz Bass]',    null, 'https://www.instagram.com/mandiocataller/', 'Blindaje completo de un Jazz Bass.', '2026-09-14 12:00-03'),
  ('demo-6', 'video',    'placeholder:[REEL · a medida]',     null, 'https://www.instagram.com/mandiocataller/', 'Guitarra a medida, cuerpo de lenga.', '2026-09-08 12:00-03');

-- Configuración (placeholders to be completed by the workshop) -----------------
insert into configuracion (id, nombre_taller, direccion, horario, whatsapp, email, instagram_user, texto_aviso_calibracion, texto_aviso_listo) values
  (true, 'Taller de Instrumentos Mandioca', 'COMPLETAR: dirección del taller', 'COMPLETAR: lunes a viernes [horario] · sábados con turno',
   null, null, 'mandiocataller',
   'Hola {nombre}! Te escribimos del Taller Mandioca. A tu {instrumento} le toca la calibración (vence el {fecha}). ¿Coordinamos un turno?',
   'Hola {nombre}! Tu {instrumento} está listo para retirar. Orden #{numero}. Te esperamos en el taller.');

commit;
