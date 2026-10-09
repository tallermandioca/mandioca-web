-- DEV ONLY. Drops everything the migrations create so they can be re-applied from scratch.
-- Auth users are not touched (they re-link to profiles through the auth trigger on next seed:usuarios).

drop trigger if exists trg_auth_user_creado on auth.users;
drop trigger if exists trg_auth_user_confirmado on auth.users;

drop policy if exists publicas_lee on storage.objects;
drop policy if exists publicas_admin on storage.objects;
drop policy if exists publicas_cliente on storage.objects;
drop policy if exists privadas_admin on storage.objects;
drop policy if exists privadas_cliente_lee on storage.objects;
delete from storage.objects where bucket_id in ('fotos-publicas', 'fotos-privadas');
delete from storage.buckets where id in ('fotos-publicas', 'fotos-privadas');

drop view if exists configuracion_publica;
drop view if exists vendedores_publicos;
drop view if exists historial_publico;
drop view if exists instrumentos_publicos;

drop table if exists notas_internas_orden cascade;
drop table if exists fotos_publicacion cascade;
drop table if exists publicaciones_venta cascade;
drop table if exists recordatorios cascade;
drop table if exists trabajos_portfolio cascade;
drop table if exists fotos_orden cascade;
drop table if exists ordenes cascade;
drop table if exists instrumentos cascade;
drop table if exists tipos_trabajo cascade;
drop table if exists instagram_posts cascade;
drop table if exists configuracion cascade;
drop table if exists perfiles cascade;
drop table if exists _migraciones cascade;

drop function if exists fn_auth_user_creado();
drop function if exists fn_publicaciones_aprobada();
drop function if exists fn_fotos_publicacion_insertada();
drop function if exists fn_vincular_cuenta(uuid, uuid);
drop function if exists fn_instrumentos_revision_editada();
drop function if exists fn_ordenes_revision_editada();
drop function if exists fn_hoy();
drop function if exists fn_perfiles_before_update();
drop function if exists fn_publicaciones_tipo();
drop function if exists fn_publicaciones_sync_en_venta();
drop function if exists fn_publicaciones_before_write();
drop function if exists fn_instrumentos_before_update();
drop function if exists fn_ordenes_cerrada();
drop function if exists fn_ordenes_before_update();
drop function if exists fn_transicion_valida(estado_orden, estado_orden, boolean);
drop function if exists fn_es_admin();
drop function if exists fn_perfil_id();
drop function if exists fn_set_updated_at();

drop type if exists tipo_ig_post;
drop type if exists estado_publicacion;
drop type if exists estado_instrumento_venta;
drop type if exists estado_recordatorio;
drop type if exists canal_aviso;
drop type if exists tipo_recordatorio;
drop type if exists momento_foto;
drop type if exists estado_orden;
drop type if exists tipo_instrumento;
drop type if exists rol_perfil;
drop type if exists estado_perfil;
