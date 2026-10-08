-- Functions and triggers: updated_at, RLS helpers, order state machine,
-- next-revision recalculation, reminder scheduling, auth user linking.

-- updated_at on every table ---------------------------------------------------
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

-- RLS helpers (security definer so they do not recurse into perfiles policies)
create or replace function fn_perfil_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from perfiles where user_id = auth.uid()
$$;

create or replace function fn_es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where user_id = auth.uid() and rol = 'admin')
$$;

-- Order state machine ---------------------------------------------------------
-- recibido -> presupuestado -> aprobado -> en_proceso -> listo -> entregado
-- cancelado allowed from any state before listo.
-- Templates that skip the quote allow recibido -> en_proceso.
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

  -- A client (non-admin) may only approve a quote; nothing else changes.
  if not fn_es_admin() and auth.uid() is not null then
    if not (old.estado = 'presupuestado' and new.estado = 'aprobado') then
      raise exception 'Solo podés aprobar un presupuesto' using errcode = 'insufficient_privilege';
    end if;
    if row(new.instrumento_id, new.cliente_id, new.tipo_trabajo_id, new.pedido_cliente, new.presupuesto,
           new.detalle_realizado, new.importe, new.cuerdas_puestas, new.notas_internas, new.fecha_ingreso,
           new.fecha_estimada, new.fecha_cierre, new.proxima_revision, new.publicar_en_portfolio, new.avisar_cliente)
       is distinct from
       row(old.instrumento_id, old.cliente_id, old.tipo_trabajo_id, old.pedido_cliente, old.presupuesto,
           old.detalle_realizado, old.importe, old.cuerdas_puestas, old.notas_internas, old.fecha_ingreso,
           old.fecha_estimada, old.fecha_cierre, old.proxima_revision, old.publicar_en_portfolio, old.avisar_cliente) then
      raise exception 'Solo podés aprobar un presupuesto' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;

create trigger trg_ordenes_before_update before update on ordenes
for each row execute function fn_ordenes_before_update();

-- On close (-> listo): next revision on the instrument + reminder 7 days before.
create or replace function fn_ordenes_cerrada() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meses int;
  proxima date;
  canal canal_aviso;
begin
  if new.estado = 'listo' and old.estado <> 'listo' then
    select meses_hasta_revision into meses from tipos_trabajo where id = new.tipo_trabajo_id;
    proxima := coalesce(new.proxima_revision,
                        (new.fecha_cierre + make_interval(months => coalesce(meses, 6)))::date);

    update ordenes set proxima_revision = proxima
      where id = new.id and proxima_revision is distinct from proxima;
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

-- Clients may only change foto_url, calibre_cuerdas and en_venta on their instruments.
create or replace function fn_instrumentos_before_update() returns trigger
language plpgsql as $$
begin
  if not fn_es_admin() and auth.uid() is not null then
    if row(new.dueno_id, new.tipo, new.marca, new.modelo, new.anio, new.numero_serie, new.foto_serie_url,
           new.afinacion, new.escala, new.trastes_cantidad, new.trastes_material, new.action_graves_mm,
           new.action_agudos_mm, new.calibracion_cada_meses, new.proxima_revision, new.qr_token)
       is distinct from
       row(old.dueno_id, old.tipo, old.marca, old.modelo, old.anio, old.numero_serie, old.foto_serie_url,
           old.afinacion, old.escala, old.trastes_cantidad, old.trastes_material, old.action_graves_mm,
           old.action_agudos_mm, old.calibracion_cada_meses, old.proxima_revision, old.qr_token) then
      raise exception 'Esos datos los carga el taller' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;

create trigger trg_instrumentos_before_update before update on instrumentos
for each row execute function fn_instrumentos_before_update();

-- Clients may not grant themselves the workshop seal or the featured flag.
create or replace function fn_publicaciones_before_write() returns trigger
language plpgsql as $$
begin
  if not fn_es_admin() and auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.revisado_por_taller = false;
      new.revision_orden_id = null;
      new.revisado_at = null;
      new.destacada = false;
    elsif row(new.revisado_por_taller, new.revision_orden_id, new.revisado_at, new.destacada, new.instrumento_id, new.vendedor_id)
          is distinct from
          row(old.revisado_por_taller, old.revision_orden_id, old.revisado_at, old.destacada, old.instrumento_id, old.vendedor_id) then
      raise exception 'Ese dato lo define el taller' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;

create trigger trg_publicaciones_before_write before insert or update on publicaciones_venta
for each row execute function fn_publicaciones_before_write();

-- Keep instrumentos.en_venta in sync with published listings.
create or replace function fn_publicaciones_sync_en_venta() returns trigger
language plpgsql security definer set search_path = public as $$
declare inst uuid;
begin
  inst := coalesce(new.instrumento_id, old.instrumento_id);
  update instrumentos set en_venta = exists (
    select 1 from publicaciones_venta where instrumento_id = inst and estado = 'publicada')
  where id = inst;
  return null;
end $$;

create trigger trg_publicaciones_sync_en_venta after insert or update or delete on publicaciones_venta
for each row execute function fn_publicaciones_sync_en_venta();

-- Link a new auth user to the profile the workshop created for that email,
-- or create a fresh client profile when there is none.
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
