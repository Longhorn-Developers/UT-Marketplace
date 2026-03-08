-- Price history table for listings
create table if not exists public.listing_price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  old_price numeric(10,2),
  new_price numeric(10,2) not null,
  changed_at timestamptz not null default now(),
  changed_by uuid null references public.users(id)
);

create index if not exists listing_price_history_listing_id_idx
  on public.listing_price_history (listing_id);

create index if not exists listing_price_history_changed_at_idx
  on public.listing_price_history (changed_at desc);

alter table public.listing_price_history enable row level security;

create policy "Price history is viewable by anyone"
  on public.listing_price_history
  for select
  using (true);

create policy "Price history insert blocked"
  on public.listing_price_history
  for insert
  with check (false);

create policy "Price history update blocked"
  on public.listing_price_history
  for update
  using (false);

create policy "Price history delete blocked"
  on public.listing_price_history
  for delete
  using (false);

-- Log price changes when listing price is updated
create or replace function public.log_listing_price_change()
returns trigger
language plpgsql
as $$
begin
  if new.price is distinct from old.price then
    -- Only track public listings (non-draft). Treat missing status as approved.
    if coalesce(new.is_draft, false) = false
       and coalesce(new.status, 'approved') = 'approved' then
      insert into public.listing_price_history (
        listing_id,
        old_price,
        new_price,
        changed_at,
        changed_by
      ) values (
        new.id,
        old.price,
        new.price,
        now(),
        coalesce(auth.uid(), new.user_id)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listing_price_history_trigger on public.listings;

create trigger listing_price_history_trigger
after update of price on public.listings
for each row
when (old.price is distinct from new.price)
execute function public.log_listing_price_change();
