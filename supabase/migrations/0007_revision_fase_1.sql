-- Fixes from the Fase 1 code review.

-- 1. Public listings: denormalise the instrument type so public queries never
--    need to embed `instrumentos` (which is not readable by anon).
alter table publicaciones_venta add column instrumento_tipo tipo_instrumento;
update publicaciones_venta p set instrumento_tipo = i.tipo from instrumentos i where i.id = p.instrumento_id;
alter table publicaciones_venta alter column instrumento_tipo set not null;

create or replace function fn_publicaciones_tipo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select tipo into new.instrumento_tipo from instrumentos where id = new.instrumento_id;
  return new;
end $$;

create trigger trg_publicaciones_tipo before insert or update of instrumento_id on publicaciones_venta
for each row execute function fn_publicaciones_tipo();

-- 2. Internal notes move to an admin-only table (RLS is per row, not per column).
create table notas_internas_orden (
  orden_id uuid primary key references ordenes (id) on delete cascade,
  texto text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_notas_internas_orden_updated_at before update on notas_internas_orden
for each row execute function fn_set_updated_at();
alter table notas_internas_orden enable row level security;
create policy admin_todo on notas_internas_orden for all using (fn_es_admin()) with check (fn_es_admin());
insert into notas_internas_orden (orden_id, texto)
  select id, notas_internas from ordenes where notas_internas is not null and notas_internas <> '';
alter table ordenes drop column notas_internas;

-- 3. Client update on ordenes: the only thing a client can do is approve a quote.
--    Rebuild the row from OLD so nothing else (numero, dates, amounts) can change.
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
      new.fecha_cierre = coalesce(new.fecha_cierre, current_date);
    end if;
  end if;
  new.numero := old.numero;
  new.created_at := old.created_at;
  return new;
end $$;

-- 4. Marketplace moderation: a client cannot publish unless automatic moderation is on,
--    and cannot touch created_at (used for ordering).
create or replace function fn_publicaciones_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare automatica boolean;
begin
  if not fn_es_admin() and auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.revisado_por_taller = false;
      new.revision_orden_id = null;
      new.revisado_at = null;
      new.destacada = false;
      new.created_at = now();
    else
      if row(new.revisado_por_taller, new.revision_orden_id, new.revisado_at, new.destacada, new.instrumento_id, new.vendedor_id, new.created_at)
         is distinct from
         row(old.revisado_por_taller, old.revision_orden_id, old.revisado_at, old.destacada, old.instrumento_id, old.vendedor_id, old.created_at) then
        raise exception 'Ese dato lo define el taller' using errcode = 'insufficient_privilege';
      end if;
    end if;
    if new.estado = 'publicada' and (tg_op = 'INSERT' or old.estado <> 'publicada') then
      select moderacion_automatica into automatica from configuracion where id;
      if not coalesce(automatica, false) then
        raise exception 'La publicación la aprueba el taller' using errcode = 'insufficient_privilege';
      end if;
    end if;
  end if;
  return new;
end $$;

-- 5. Only link/create profiles for confirmed auth users (sign-ups are not confirmed at insert).
drop trigger if exists trg_auth_user_creado on auth.users;

create or replace function fn_auth_user_creado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;
  update perfiles set user_id = new.id where user_id is null and lower(email) = lower(new.email);
  if not found and not exists (select 1 from perfiles where user_id = new.id) then
    insert into perfiles (user_id, nombre, email)
      values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)), new.email);
  end if;
  return new;
end $$;

create trigger trg_auth_user_confirmado after insert or update of email_confirmed_at on auth.users
for each row execute function fn_auth_user_creado();

-- 6. A client cannot change their own email (it is the auth identity and the invite key).
create or replace function fn_perfiles_before_update() returns trigger
language plpgsql as $$
begin
  if not fn_es_admin() and auth.uid() is not null then
    if row(new.email, new.rol, new.user_id) is distinct from row(old.email, old.rol, old.user_id) then
      raise exception 'Ese dato lo cambia el taller' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;

create trigger trg_perfiles_before_update before update on perfiles
for each row execute function fn_perfiles_before_update();

-- 7. Migration ledger is not public data.
alter table if exists _migraciones enable row level security;
