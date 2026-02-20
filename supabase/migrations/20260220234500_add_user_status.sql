alter table public.users
  add column if not exists status text not null default 'pending';

alter table public.users
  add column if not exists email_verified_at timestamptz;

update public.users
set status = 'active',
    email_verified_at = coalesce(email_verified_at, now())
where status is null or status = 'pending';
