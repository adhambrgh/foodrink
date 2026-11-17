-- Admin audit log table
create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  resource_type text not null, -- 'menu', 'category', 'banner', 'qris', 'order', 'notification', 'login'
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_admin_audit_logs_admin_id on public.admin_audit_logs(admin_id);
create index if not exists idx_admin_audit_logs_resource on public.admin_audit_logs(resource_type, resource_id);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin read audit logs" on public.admin_audit_logs;
create policy "admin read audit logs" on public.admin_audit_logs
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "system insert audit logs" on public.admin_audit_logs;
create policy "system insert audit logs" on public.admin_audit_logs
  for insert with check (true); -- Service role bypasses RLS

notify pgrst, 'reload schema';