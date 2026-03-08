-- Allow price history trigger to write regardless of RLS
create or replace function public.log_listing_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
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

alter function public.log_listing_price_change() owner to postgres;
