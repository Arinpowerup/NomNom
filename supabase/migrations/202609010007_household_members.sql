create or replace function public.list_household_members(target_household_id uuid)
returns table(member_user_id uuid, display_name text, email text, role text, joined_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.household_members
    where household_id = target_household_id and user_id = auth.uid()
  ) then
    raise exception 'Household access required';
  end if;

  return query
  select hm.user_id,
         coalesce(nullif(p.display_name, ''), split_part(u.email, '@', 1), '家庭成员'),
         coalesce(u.email, ''),
         hm.role,
         hm.joined_at
  from public.household_members hm
  join auth.users u on u.id = hm.user_id
  left join public.profiles p on p.user_id = hm.user_id
  where hm.household_id = target_household_id
  order by case when hm.role = 'owner' then 0 else 1 end, hm.joined_at;
end;
$$;

revoke all on function public.list_household_members(uuid) from public;
grant execute on function public.list_household_members(uuid) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='household_members') then
    alter publication supabase_realtime add table public.household_members;
  end if;
end $$;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='households') then
    alter publication supabase_realtime add table public.households;
  end if;
end $$;