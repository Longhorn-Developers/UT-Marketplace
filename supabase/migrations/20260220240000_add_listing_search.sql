alter table public.listings
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.listings
  add column if not exists search_vector tsvector;

create or replace function public.listings_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector(
    'english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.location, '') || ' ' ||
    coalesce(new.category::text, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

drop trigger if exists listings_search_vector_update on public.listings;

create trigger listings_search_vector_update
before insert or update on public.listings
for each row
execute function public.listings_search_vector_update();

update public.listings
set search_vector = to_tsvector(
  'english',
  coalesce(title, '') || ' ' ||
  coalesce(location, '') || ' ' ||
  coalesce(category::text, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '')
);

create index if not exists listings_search_vector_idx
  on public.listings
  using gin (search_vector);
