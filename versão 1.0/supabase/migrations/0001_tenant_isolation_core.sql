-- JurisAcompanha — Migration 0001: tenant isolation and core legal records
-- STATUS: REVIEW ONLY. Do not run in production. Review with a qualified engineer first.
-- Target: Supabase PostgreSQL. This migration does NOT create Storage buckets or app UI.
-- Assumptions:
--   * Supabase Auth owns authentication identities (auth.users).
--   * A person can be a client of multiple offices; the client record is office-scoped.
--   * Platform superadmins do not receive legal-content access through this schema.
--   * Office/tenant creation and privileged provisioning happen through a trusted server path.
--
-- Apply only in a disposable development project after reviewing the full migration.
-- Test cross-tenant isolation before inserting real personal/legal data.

begin;

create extension if not exists pgcrypto;

create schema if not exists private;

-- Keep authorization helpers out of the exposed PostgREST schema.
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Memberships represent office staff, not client relationships.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('office_admin', 'lawyer', 'collaborator')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  unique (tenant_id, id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 1 and 200),
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);

-- A global authenticated identity can be linked to separate client records
-- in different offices. The links never imply cross-office data access.
create table public.client_user_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, client_id)
    references public.clients(tenant_id, id) on delete cascade,
  unique (tenant_id, client_id, user_id),
  unique (tenant_id, user_id, client_id)
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  case_number text,
  court text,
  venue text,
  case_class text,
  subject text,
  title text not null check (length(trim(title)) between 1 and 240),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived', 'concluded')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create index cases_tenant_status_idx on public.cases (tenant_id, status);
create index cases_tenant_number_idx on public.cases (tenant_id, case_number);

create table public.case_client_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  case_id uuid not null,
  client_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, case_id)
    references public.cases(tenant_id, id) on delete cascade,
  foreign key (tenant_id, client_id)
    references public.clients(tenant_id, id) on delete restrict,
  unique (tenant_id, case_id, client_id)
);

create index case_client_links_client_idx
  on public.case_client_links (tenant_id, client_id);

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  case_id uuid not null,
  event_type text not null check (length(trim(event_type)) between 1 and 80),
  title text not null check (length(trim(title)) between 1 and 240),
  description text,
  visibility text not null default 'internal'
    check (visibility in ('internal', 'client')),
  event_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, case_id)
    references public.cases(tenant_id, id) on delete cascade,
  unique (tenant_id, id)
);

create index case_events_case_time_idx
  on public.case_events (tenant_id, case_id, event_at desc);

-- Metadata only. File bytes belong in a private Storage bucket in a later migration.
-- Never store public URLs or secrets in this table.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  case_id uuid not null,
  storage_path text not null,
  original_filename text not null check (length(trim(original_filename)) between 1 and 255),
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  visibility text not null default 'internal'
    check (visibility in ('internal', 'client')),
  scan_status text not null default 'pending'
    check (scan_status in ('pending', 'clean', 'quarantined', 'rejected')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, case_id)
    references public.cases(tenant_id, id) on delete cascade,
  unique (tenant_id, storage_path),
  unique (tenant_id, id)
);

create index documents_case_idx on public.documents (tenant_id, case_id);

-- Keep audit payloads operational and minimal: do not put document contents,
-- credentials, tokens, full legal narratives, or unnecessary personal data here.
create table public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.tenants(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (length(trim(action)) between 1 and 120),
  resource_type text not null check (length(trim(resource_type)) between 1 and 120),
  resource_id text,
  outcome text not null default 'success' check (outcome in ('success', 'denied', 'failure')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_tenant_time_idx
  on public.audit_logs (tenant_id, created_at desc);

-- Authorization helpers. SECURITY DEFINER is used only for these narrow checks
-- to avoid RLS recursion; fixed search_path and schema-qualified references are required.
create or replace function private.is_tenant_staff(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.tenants t on t.id = m.tenant_id
    where m.tenant_id = p_tenant_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and t.status = 'active'
  );
$$;

create or replace function private.has_tenant_role(p_tenant_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.tenants t on t.id = m.tenant_id
    where m.tenant_id = p_tenant_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and t.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function private.is_client_linked(p_tenant_id uuid, p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.client_user_links cul
    join public.tenants t on t.id = cul.tenant_id
    where cul.tenant_id = p_tenant_id
      and cul.client_id = p_client_id
      and cul.user_id = (select auth.uid())
      and t.status = 'active'
  );
$$;

create or replace function private.is_case_client(p_tenant_id uuid, p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.case_client_links ccl
    join public.client_user_links cul
      on cul.tenant_id = ccl.tenant_id
     and cul.client_id = ccl.client_id
    join public.tenants t on t.id = ccl.tenant_id
    where ccl.tenant_id = p_tenant_id
      and ccl.case_id = p_case_id
      and cul.user_id = (select auth.uid())
      and t.status = 'active'
  );
$$;

revoke all on function private.is_tenant_staff(uuid) from public;
revoke all on function private.has_tenant_role(uuid, text[]) from public;
revoke all on function private.is_client_linked(uuid, uuid) from public;
revoke all on function private.is_case_client(uuid, uuid) from public;
grant execute on function private.is_tenant_staff(uuid) to authenticated;
grant execute on function private.has_tenant_role(uuid, text[]) to authenticated;
grant execute on function private.is_client_linked(uuid, uuid) to authenticated;
grant execute on function private.is_case_client(uuid, uuid) to authenticated;

-- RLS is enabled on every table exposed to the application.
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.client_user_links enable row level security;
alter table public.cases enable row level security;
alter table public.case_client_links enable row level security;
alter table public.case_events enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

-- No authenticated INSERT policy for tenants: tenant provisioning is a trusted
-- backend/admin operation, not a client-side action.
create policy tenants_select_for_members
on public.tenants for select to authenticated
using (private.is_tenant_staff(id));

create policy profiles_select_self
on public.profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy profiles_insert_self
on public.profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profiles_update_self
on public.profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy memberships_select_same_tenant
on public.memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_tenant_staff(tenant_id)
);

-- Membership INSERT/UPDATE/DELETE is intentionally absent from browser policies.
-- Invitation and role changes should be implemented in a trusted server path.

create policy clients_select_for_staff_or_linked_client
on public.clients for select to authenticated
using (
  private.is_tenant_staff(tenant_id)
  or private.is_client_linked(tenant_id, id)
);

create policy clients_insert_for_authorized_staff
on public.clients for insert to authenticated
with check (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']));

create policy clients_update_for_authorized_staff
on public.clients for update to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']))
with check (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']));

create policy clients_delete_for_office_admin
on public.clients for delete to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin']));

create policy client_user_links_select_for_staff_or_self
on public.client_user_links for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_tenant_staff(tenant_id)
);

-- Client-account linking is a sensitive identity operation; no direct browser
-- INSERT/UPDATE/DELETE policy is provided in this initial migration.

create policy cases_select_for_staff_or_linked_client
on public.cases for select to authenticated
using (
  private.is_tenant_staff(tenant_id)
  or private.is_case_client(tenant_id, id)
);

create policy cases_insert_for_authorized_staff
on public.cases for insert to authenticated
with check (
  private.has_tenant_role(tenant_id, array['office_admin', 'lawyer'])
  and (created_by is null or created_by = (select auth.uid()))
);

create policy cases_update_for_authorized_staff
on public.cases for update to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']))
with check (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']));

create policy cases_delete_for_office_admin
on public.cases for delete to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin']));

create policy case_client_links_select_for_staff_or_linked_client
on public.case_client_links for select to authenticated
using (
  private.is_tenant_staff(tenant_id)
  or private.is_client_linked(tenant_id, client_id)
);

create policy case_client_links_insert_for_authorized_staff
on public.case_client_links for insert to authenticated
with check (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']));

create policy case_client_links_delete_for_authorized_staff
on public.case_client_links for delete to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']));

create policy case_events_select_by_visibility
on public.case_events for select to authenticated
using (
  private.is_tenant_staff(tenant_id)
  or (
    visibility = 'client'
    and private.is_case_client(tenant_id, case_id)
  )
);

create policy case_events_insert_for_staff
on public.case_events for insert to authenticated
with check (
  private.is_tenant_staff(tenant_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy case_events_update_for_lawyer_or_admin
on public.case_events for update to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']))
with check (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']));

create policy case_events_delete_for_office_admin
on public.case_events for delete to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin']));

create policy documents_select_by_visibility
on public.documents for select to authenticated
using (
  private.is_tenant_staff(tenant_id)
  or (
    visibility = 'client'
    and scan_status = 'clean'
    and private.is_case_client(tenant_id, case_id)
  )
);

create policy documents_insert_for_staff
on public.documents for insert to authenticated
with check (
  private.is_tenant_staff(tenant_id)
  and (uploaded_by is null or uploaded_by = (select auth.uid()))
);

create policy documents_update_for_lawyer_or_admin
on public.documents for update to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']))
with check (private.has_tenant_role(tenant_id, array['office_admin', 'lawyer']));

create policy documents_delete_for_office_admin
on public.documents for delete to authenticated
using (private.has_tenant_role(tenant_id, array['office_admin']));

-- Audit records are not readable or writable directly by authenticated clients.
-- Add a trusted, validated audit-writing mechanism before enabling production use.

-- Restrict table privileges; RLS remains the row-level boundary.
revoke all on public.tenants from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.memberships from anon, authenticated;
revoke all on public.clients from anon, authenticated;
revoke all on public.client_user_links from anon, authenticated;
revoke all on public.cases from anon, authenticated;
revoke all on public.case_client_links from anon, authenticated;
revoke all on public.case_events from anon, authenticated;
revoke all on public.documents from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant select on public.tenants to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.memberships to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select on public.client_user_links to authenticated;
grant select, insert, update, delete on public.cases to authenticated;
grant select, insert, delete on public.case_client_links to authenticated;
grant select, insert, update, delete on public.case_events to authenticated;
grant select, insert, update, delete on public.documents to authenticated;

commit;

-- Deliberately deferred to later reviewed migrations:
-- 1. Private Storage bucket + object policies, short-lived signed URLs, upload size/type checks.
-- 2. Server-side tenant provisioning, invitations, client identity verification/linking.
-- 3. Audit writer, audit tamper-resistance/retention, notification delivery.
-- 4. MFA enforcement for privileged users, backup/restore and incident-response procedures.
-- 5. Automated tests proving cross-tenant access is denied for SELECT/INSERT/UPDATE/DELETE.
