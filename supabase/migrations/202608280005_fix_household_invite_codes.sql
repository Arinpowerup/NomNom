create or replace function public.create_household_invite(target_household_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  invite_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not exists(
    select 1 from public.households
    where id=target_household_id and owner_id=auth.uid()
  ) then
    raise exception 'Only the owner can invite members';
  end if;
  invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.household_invites(household_id,code,created_by,expires_at)
  values(target_household_id,invite_code,auth.uid(),now()+interval '7 days');
  return invite_code;
end
$$;
