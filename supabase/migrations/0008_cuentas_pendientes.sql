-- Self-service accounts: clients sign up on their own (Google / magic link) and the
-- workshop links or approves them. Also: calendar dates in Argentina time.

create type estado_perfil as enum ('pendiente', 'activo', 'bloqueado');
alter table perfiles add column estado estado_perfil not null default 'activo';
create index perfiles_pendientes_idx on perfiles (created_at) where estado = 'pendiente';

-- "Today" in the workshop's timezone (Supabase runs in UTC).
create or replace function fn_hoy() returns date
language sql stable as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date
$$;

alter table ordenes alter column fecha_ingreso set default fn_hoy();
alter table trabajos_portfolio alter column fecha set default fn_hoy();

-- Auth user confirmed: link to the profile the workshop created (same email) and activate it,
-- or create a PENDING profile the workshop has to approve.
create or replace function fn_auth_user_creado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nombre_meta text;
begin
  if new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;
  update perfiles set user_id = new.id, estado = 'activo'
    where user_id is null and lower(email) = lower(new.email);
  if not found and not exists (select 1 from perfiles where user_id = new.id) then
    nombre_meta := coalesce(
      new.raw_user_meta_data ->> 'nombre',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1));
    insert into perfiles (user_id, nombre, email, avatar_url, estado)
      values (new.id, nombre_meta, new.email, new.raw_user_meta_data ->> 'avatar_url', 'pendiente');
  end if;
  return new;
end $$;

-- Clients cannot change their own estado either.
create or replace function fn_perfiles_before_update() returns trigger
language plpgsql as $$
begin
  if not fn_es_admin() and auth.uid() is not null then
    if row(new.email, new.rol, new.user_id, new.estado) is distinct from row(old.email, old.rol, old.user_id, old.estado) then
      raise exception 'Ese dato lo cambia el taller' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;

-- Only active profiles count as logged-in clients for RLS purposes.
create or replace function fn_perfil_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from perfiles where user_id = auth.uid() and estado = 'activo'
$$;

create or replace function fn_es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where user_id = auth.uid() and rol = 'admin' and estado = 'activo')
$$;

-- Closing an order uses the workshop's calendar day.
create or replace function fn_ordenes_before_update() returns trigger
language plpgsql as $$
declare salta boolean;
begin
  if not fn_es_admin() and auth.uid() is not null then
    if not (old.estado = 'presupuestado' and new.estado = 'aprobado') then
      raise exception 'Solo podés aprobar un presupuesto' using errcode = 'insufficient_privilege';
    end if;
    new := old;
    new.estado := 'aprobado';
    new.presupuesto_aprobado_at := now();
    return new;
  end if;

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
      new.fecha_cierre = coalesce(new.fecha_cierre, fn_hoy());
    end if;
  end if;
  new.numero := old.numero;
  new.created_at := old.created_at;
  return new;
end $$;

-- Editing proxima_revision on a closed order propagates to the instrument and its reminder.
create or replace function fn_ordenes_revision_editada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado in ('listo', 'entregado') and old.estado = new.estado
     and new.proxima_revision is distinct from old.proxima_revision and new.proxima_revision is not null then
    update instrumentos set proxima_revision = new.proxima_revision where id = new.instrumento_id;
    update recordatorios set fecha_programada = new.proxima_revision - 7
      where instrumento_id = new.instrumento_id and estado = 'pendiente';
  end if;
  return new;
end $$;

create trigger trg_ordenes_revision_editada after update of proxima_revision on ordenes
for each row execute function fn_ordenes_revision_editada();
