-- Home hero photo, managed by the workshop from Configuración (public bucket URL).
alter table configuracion add column foto_portada_url text;

create or replace view configuracion_publica with (security_invoker = false) as
  select nombre_taller, direccion, horario, whatsapp, email, instagram_user, foto_portada_url
  from configuracion;
