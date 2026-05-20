create table if not exists public.support_incidents (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('client','api','pwa','browserbase','google-calendar','supabase')),
  route text not null default '/',
  message text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  fingerprint text not null,
  status text not null default 'open' check (status in ('open','linear_failed','filed','in_progress','resolved')),
  occurrence_count int not null default 1,
  stack text,
  context jsonb not null default '{}'::jsonb,
  admin_action text,
  linear_issue_id text,
  linear_issue_identifier text,
  linear_issue_url text,
  resolution_summary text,
  raw_payload jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_update_records (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.support_incidents(id) on delete set null,
  title text not null,
  summary text not null,
  linear_issue_id text,
  linear_issue_url text,
  commit_sha text,
  status text not null default 'published' check (status in ('published','applied','dismissed')),
  published_at timestamptz not null default now(),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_incidents_fingerprint_open_idx
  on public.support_incidents (fingerprint, status, last_seen_at desc);
create index if not exists support_incidents_status_idx
  on public.support_incidents (status, last_seen_at desc);
create index if not exists support_incidents_linear_idx
  on public.support_incidents (linear_issue_id)
  where linear_issue_id is not null;
create index if not exists app_update_records_published_idx
  on public.app_update_records (published_at desc);

drop trigger if exists support_incidents_touch_updated_at on public.support_incidents;
create trigger support_incidents_touch_updated_at
before update on public.support_incidents
for each row execute function public.touch_updated_at();

alter table public.support_incidents enable row level security;
alter table public.app_update_records enable row level security;

drop policy if exists "incidents admin read" on public.support_incidents;
create policy "incidents admin read" on public.support_incidents
  for select using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
    )
  );

drop policy if exists "updates public read" on public.app_update_records;
create policy "updates public read" on public.app_update_records
  for select using (true);

grant select on public.app_update_records to anon, authenticated;
grant select on public.support_incidents to authenticated;
grant all on public.support_incidents to service_role;
grant all on public.app_update_records to service_role;
