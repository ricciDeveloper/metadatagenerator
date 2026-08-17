-- Schema para Supabase PostgreSQL
-- Cria as tabelas necessárias para o projeto SEO Metadata Generator

create table if not exists public.projects (
  id text primary key,
  name text not null,
  domain text not null,
  description text default '',
  seo_config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  status text not null default 'PENDING',
  total_urls integer not null default 0,
  processed_urls integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.job_urls (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  url text not null,
  status text not null default 'PENDING',
  original_title text,
  original_h1 text,
  generated_title text,
  title_length integer,
  generated_description text,
  description_length integer,
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_created_at on public.projects(created_at desc);
create index if not exists idx_jobs_project_id on public.jobs(project_id);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);
create index if not exists idx_job_urls_job_id on public.job_urls(job_id);
create index if not exists idx_job_urls_status on public.job_urls(status);

-- Optional: trigger para atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create or replace trigger trg_job_urls_updated_at
before update on public.job_urls
for each row
execute function public.set_updated_at();
