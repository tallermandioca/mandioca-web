-- Fixes from the Fases 4-6 code review.

-- 1. One active listing per instrument, enforced by the database.
create unique index publicaciones_activa_por_instrumento_idx
  on publicaciones_venta (instrumento_id) where estado <> 'vendida';

-- 2. Editing the content of a published listing sends it back to moderation
--    (unless automatic moderation is on). Admin edits are untouched.
create or replace function fn_publicaciones_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare automatica boolean;
begin
  if not fn_es_admin() and auth.uid() is not null then
    select moderacion_automatica into automatica from configuracion where id;
    automatica := coalesce(automatica, false);
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
      if old.estado = 'publicada' and new.estado = 'publicada' and not automatica
         and row(new.titulo, new.descripcion, new.precio, new.estado_instrumento, new.con_estuche, new.acepta_permuta, new.mostrar_historial)
             is distinct from
             row(old.titulo, old.descripcion, old.precio, old.estado_instrumento, old.con_estuche, old.acepta_permuta, old.mostrar_historial) then
        new.estado := 'pausada';
        new.solicita_publicacion := true;
      end if;
    end if;
    if new.estado = 'publicada' and (tg_op = 'INSERT' or old.estado <> 'publicada') and not automatica then
      raise exception 'La publicación la aprueba el taller' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;

-- 3. Adding a photo to a published listing also sends it back to moderation.
create or replace function fn_fotos_publicacion_insertada() returns trigger
language plpgsql security definer set search_path = public as $$
declare automatica boolean;
begin
  if not fn_es_admin() and auth.uid() is not null then
    select moderacion_automatica into automatica from configuracion where id;
    if not coalesce(automatica, false) then
      update publicaciones_venta set estado = 'pausada', solicita_publicacion = true
        where id = new.publicacion_id and estado = 'publicada';
    end if;
  end if;
  return new;
end $$;

create trigger trg_fotos_publicacion_insertada after insert on fotos_publicacion
for each row execute function fn_fotos_publicacion_insertada();
