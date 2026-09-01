create or replace function public.leave_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role text;
  successor_id uuid;
begin
  select role into current_role
  from public.household_members
  where household_id = target_household_id and user_id = auth.uid()
  for update;

  if current_role is null then
    raise exception 'You are not a member of this household';
  end if;

  if current_role = 'owner' then
    select user_id into successor_id
    from public.household_members
    where household_id = target_household_id and user_id <> auth.uid()
    order by joined_at
    limit 1
    for update;

    if successor_id is null then
      delete from public.households where id = target_household_id;
      return;
    end if;

    update public.household_members
    set role = 'owner'
    where household_id = target_household_id and user_id = successor_id;

    update public.households
    set owner_id = successor_id, updated_at = now()
    where id = target_household_id;
  end if;

  delete from public.household_members
  where household_id = target_household_id and user_id = auth.uid();
end;
$$;

revoke all on function public.leave_household(uuid) from public;
grant execute on function public.leave_household(uuid) to authenticated;