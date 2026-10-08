-- Storage buckets and policies.
-- fotos-publicas : portfolio, listings, avatars. Anyone reads.
--                  admin writes anywhere; a client writes under perfiles/<perfil_id>/...
-- fotos-privadas : order photos and serial-number photos under ordenes/<orden_id>/...
--                  admin everything; a client reads photos of their own orders.

insert into storage.buckets (id, name, public) values
  ('fotos-publicas', 'fotos-publicas', true),
  ('fotos-privadas', 'fotos-privadas', false)
on conflict (id) do nothing;

create policy publicas_lee on storage.objects for select
  using (bucket_id = 'fotos-publicas');
create policy publicas_admin on storage.objects for all
  using (bucket_id = 'fotos-publicas' and fn_es_admin())
  with check (bucket_id = 'fotos-publicas' and fn_es_admin());
create policy publicas_cliente on storage.objects for all
  using (bucket_id = 'fotos-publicas'
    and (storage.foldername(name))[1] = 'perfiles'
    and (storage.foldername(name))[2] = fn_perfil_id()::text)
  with check (bucket_id = 'fotos-publicas'
    and (storage.foldername(name))[1] = 'perfiles'
    and (storage.foldername(name))[2] = fn_perfil_id()::text);

create policy privadas_admin on storage.objects for all
  using (bucket_id = 'fotos-privadas' and fn_es_admin())
  with check (bucket_id = 'fotos-privadas' and fn_es_admin());
create policy privadas_cliente_lee on storage.objects for select
  using (bucket_id = 'fotos-privadas'
    and (storage.foldername(name))[1] = 'ordenes'
    and exists (
      select 1 from ordenes o
      where o.id::text = (storage.foldername(name))[2] and o.cliente_id = fn_perfil_id()));
