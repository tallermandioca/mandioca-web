-- Row Level Security.
-- admin: everything. cliente: only their own rows (column limits enforced by triggers in 0003).
-- Public read: visible portfolio, published listings, Instagram cache, public config view.

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

-- admin ----------------------------------------------------------------------
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

-- cliente --------------------------------------------------------------------
create policy cliente_lee_su_perfil on perfiles for select using (user_id = auth.uid());
create policy cliente_edita_su_perfil on perfiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and rol = 'cliente');

create policy usuario_lee_tipos on tipos_trabajo for select using (auth.uid() is not null and activo);

create policy cliente_lee_instrumentos on instrumentos for select using (dueno_id = fn_perfil_id());
create policy cliente_edita_instrumentos on instrumentos for update
  using (dueno_id = fn_perfil_id()) with check (dueno_id = fn_perfil_id());

create policy cliente_lee_ordenes on ordenes for select using (cliente_id = fn_perfil_id());
create policy cliente_aprueba_presupuesto on ordenes for update
  using (cliente_id = fn_perfil_id() and estado = 'presupuestado')
  with check (cliente_id = fn_perfil_id() and estado = 'aprobado');

create policy cliente_lee_fotos_orden on fotos_orden for select
  using (exists (select 1 from ordenes o where o.id = orden_id and o.cliente_id = fn_perfil_id()));

create policy cliente_lee_recordatorios on recordatorios for select using (cliente_id = fn_perfil_id());

create policy cliente_publicaciones on publicaciones_venta for all
  using (vendedor_id = fn_perfil_id())
  with check (vendedor_id = fn_perfil_id()
    and exists (select 1 from instrumentos i where i.id = instrumento_id and i.dueno_id = fn_perfil_id()));

create policy cliente_fotos_publicacion on fotos_publicacion for all
  using (exists (select 1 from publicaciones_venta p where p.id = publicacion_id and p.vendedor_id = fn_perfil_id()))
  with check (exists (select 1 from publicaciones_venta p where p.id = publicacion_id and p.vendedor_id = fn_perfil_id()));

-- público (anon y authenticated) ----------------------------------------------
create policy publico_portfolio on trabajos_portfolio for select using (visible);
create policy publico_publicaciones on publicaciones_venta for select using (estado = 'publicada');
create policy publico_fotos_publicacion on fotos_publicacion for select
  using (exists (select 1 from publicaciones_venta p where p.id = publicacion_id and p.estado = 'publicada'));
create policy publico_instagram on instagram_posts for select using (true);

-- Public views (run as owner, so they bypass RLS but only expose safe columns).
create view configuracion_publica with (security_invoker = false) as
  select nombre_taller, direccion, horario, whatsapp, email, instagram_user from configuracion;
grant select on configuracion_publica to anon, authenticated;

create view vendedores_publicos with (security_invoker = false) as
  select p.id as publicacion_id, pe.nombre, pe.whatsapp
  from publicaciones_venta p join perfiles pe on pe.id = p.vendedor_id
  where p.estado = 'publicada';
grant select on vendedores_publicos to anon, authenticated;

create view historial_publico with (security_invoker = false) as
  select p.id as publicacion_id, o.id as orden_id, o.fecha_cierre, t.nombre as tipo_trabajo, o.detalle_realizado
  from publicaciones_venta p
  join ordenes o on o.instrumento_id = p.instrumento_id and o.estado in ('listo', 'entregado')
  join tipos_trabajo t on t.id = o.tipo_trabajo_id
  where p.estado = 'publicada' and p.mostrar_historial;
grant select on historial_publico to anon, authenticated;

-- Instrument summary for a published listing, without owner or serial number.
create view instrumentos_publicos with (security_invoker = false) as
  select p.id as publicacion_id, i.tipo, i.marca, i.modelo, i.anio, i.calibre_cuerdas, i.afinacion,
         i.escala, i.trastes_cantidad, i.trastes_material, i.action_graves_mm, i.action_agudos_mm,
         i.proxima_revision
  from publicaciones_venta p join instrumentos i on i.id = p.instrumento_id
  where p.estado = 'publicada';
grant select on instrumentos_publicos to anon, authenticated;
