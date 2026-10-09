-- Fixes from the Fase 2 code review.

-- 1. A pending (self-registered) profile may have neither whatsapp nor email yet
--    (its email can collide with a profile the workshop already linked).
alter table perfiles drop constraint perfiles_contacto;
alter table perfiles add constraint perfiles_contacto
  check (estado = 'pendiente' or whatsapp is not null or email is not null);

-- 2. Never fail the auth insert: if the email is taken by an already-linked profile,
--    create the pending profile without email so the workshop can link it by hand.
create or replace function fn_auth_user_creado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nombre_meta text;
  email_libre boolean;
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
    email_libre := not exists (select 1 from perfiles where lower(email) = lower(new.email));
    insert into perfiles (user_id, nombre, email, avatar_url, estado)
      values (new.id, nombre_meta, case when email_libre then new.email else null end,
              new.raw_user_meta_data ->> 'avatar_url', 'pendiente');
  end if;
  return new;
end $$;

-- 3. Link a self-registered account to an existing client atomically (admin only).
create or replace function fn_vincular_cuenta(pendiente_id uuid, existente_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  p perfiles%rowtype;
  e perfiles%rowtype;
begin
  if not fn_es_admin() then
    raise exception 'Solo el taller puede vincular cuentas' using errcode = 'insufficient_privilege';
  end if;
  select * into p from perfiles where id = pendiente_id for update;
  select * into e from perfiles where id = existente_id for update;
  if p.id is null or p.user_id is null or p.estado = 'activo' then
    raise exception 'Esa cuenta ya no está pendiente';
  end if;
  if e.id is null or e.rol <> 'cliente' then
    raise exception 'No encontramos ese cliente';
  end if;
  if e.user_id is not null then
    raise exception '% ya tiene una cuenta vinculada', e.nombre;
  end if;
  -- Move any rows that may have been created for the pending profile by mistake.
  update instrumentos set dueno_id = e.id where dueno_id = p.id;
  update ordenes set cliente_id = e.id where cliente_id = p.id;
  update recordatorios set cliente_id = e.id where cliente_id = p.id;
  update publicaciones_venta set vendedor_id = e.id where vendedor_id = p.id;
  delete from perfiles where id = p.id;
  update perfiles set
    user_id = p.user_id,
    estado = 'activo',
    email = coalesce(e.email, p.email),
    avatar_url = coalesce(p.avatar_url, e.avatar_url)
  where id = e.id;
end $$;

-- 4. Editing the instrument's next revision moves its pending reminder too.
create or replace function fn_instrumentos_revision_editada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.proxima_revision is distinct from old.proxima_revision and new.proxima_revision is not null then
    update recordatorios set fecha_programada = new.proxima_revision - 7
      where instrumento_id = new.id and estado = 'pendiente';
  end if;
  return new;
end $$;

create trigger trg_instrumentos_revision_editada after update of proxima_revision on instrumentos
for each row execute function fn_instrumentos_revision_editada();
