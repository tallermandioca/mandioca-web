-- Marketplace: the client asks for publication; the workshop approves (unless moderacion_automatica).
alter table publicaciones_venta add column solicita_publicacion boolean not null default false;
create index publicaciones_para_aprobar_idx on publicaciones_venta (created_at) where solicita_publicacion and estado <> 'publicada';

-- Approving clears the request flag.
create or replace function fn_publicaciones_aprobada() returns trigger
language plpgsql as $$
begin
  if new.estado = 'publicada' then
    new.solicita_publicacion := false;
  end if;
  return new;
end $$;

create trigger trg_publicaciones_aprobada before insert or update of estado on publicaciones_venta
for each row execute function fn_publicaciones_aprobada();
