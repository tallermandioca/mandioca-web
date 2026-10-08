-- Work types are shown on the public portfolio (tags and filters), so anyone may read the active ones.
drop policy if exists usuario_lee_tipos on tipos_trabajo;
create policy publico_lee_tipos on tipos_trabajo for select using (activo);
