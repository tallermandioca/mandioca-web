-- Payments per order (partial payments allowed). Balance = (importe or presupuesto) - sum(pagos).
create table pagos (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes (id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  fecha date not null default current_date,
  nota text,
  created_at timestamptz not null default now()
);
create index pagos_orden_idx on pagos (orden_id);

alter table pagos enable row level security;
create policy admin_todo on pagos for all using (fn_es_admin()) with check (fn_es_admin());

-- WhatsApp text for the balance reminder (null = default template in code).
alter table configuracion add column texto_aviso_deuda text;
