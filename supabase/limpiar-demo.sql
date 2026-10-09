-- Removes every piece of demo data and leaves the database ready for real clients.
-- Keeps: the workshop admin profile, work types (tipos_trabajo) and configuracion.
-- Run with: npm run db:limpiar

begin;

delete from recordatorios;
delete from fotos_orden;
delete from trabajos_portfolio;
delete from fotos_publicacion;
delete from publicaciones_venta;
delete from notas_internas_orden;
delete from ordenes;
delete from instrumentos;
delete from instagram_posts;

-- Client profiles (demo ones and any self-registered account created while testing).
delete from perfiles where rol = 'cliente';

-- Demo auth users (the trigger-linked profiles are already gone).
delete from auth.users where email like '%@demo.mandioca.ar';

-- Start order numbers from 1 for the real workshop.
select setval('ordenes_numero_seq', 1, false);

commit;
