create extension if not exists pgcrypto;
create table public.profiles (user_id uuid primary key references auth.users(id) on delete cascade, display_name text not null default '', avatar_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.households (id uuid primary key default gen_random_uuid(), name text not null check(char_length(name) between 1 and 80), owner_id uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.household_members (household_id uuid not null references public.households(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'member' check(role in ('owner','member')), joined_at timestamptz not null default now(), primary key(household_id,user_id));
create index household_members_user_id_idx on public.household_members(user_id);
create table public.household_states (household_id uuid primary key references public.households(id) on delete cascade, data jsonb not null default '{}'::jsonb, revision bigint not null default 1, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now());
create table public.household_invites (id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade, code text not null unique check(char_length(code) between 6 and 32), created_by uuid not null references auth.users(id), expires_at timestamptz not null, max_uses integer not null default 10 check(max_uses>0), use_count integer not null default 0, created_at timestamptz not null default now());
create index household_invites_household_id_idx on public.household_invites(household_id);

create schema if not exists private;
create function private.user_household_ids() returns setof uuid language sql security definer set search_path='' stable as $$ select household_id from public.household_members where user_id=(select auth.uid()) $$;
revoke execute on function private.user_household_ids() from public;
grant usage on schema private to authenticated;
grant execute on function private.user_household_ids() to authenticated;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_states enable row level security;
alter table public.household_invites enable row level security;
revoke all on public.profiles,public.households,public.household_members,public.household_states,public.household_invites from anon,authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update,delete on public.households,public.household_members,public.household_states,public.household_invites to authenticated;

create policy "profile read own" on public.profiles for select to authenticated using((select auth.uid())=user_id);
create policy "profile insert own" on public.profiles for insert to authenticated with check((select auth.uid())=user_id);
create policy "profile update own" on public.profiles for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "members read household" on public.households for select to authenticated using(id in(select private.user_household_ids()));
create policy "users create household" on public.households for insert to authenticated with check((select auth.uid())=owner_id);
create policy "owners update household" on public.households for update to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create policy "owners delete household" on public.households for delete to authenticated using((select auth.uid())=owner_id);
create policy "members read membership" on public.household_members for select to authenticated using(household_id in(select private.user_household_ids()));
create policy "owners add members" on public.household_members for insert to authenticated with check(exists(select 1 from public.households h where h.id=household_id and h.owner_id=(select auth.uid())));
create policy "owners manage members" on public.household_members for update to authenticated using(exists(select 1 from public.households h where h.id=household_id and h.owner_id=(select auth.uid())));
create policy "owners remove members" on public.household_members for delete to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.households h where h.id=household_id and h.owner_id=(select auth.uid())));
create policy "members read state" on public.household_states for select to authenticated using(household_id in(select private.user_household_ids()));
create policy "members create state" on public.household_states for insert to authenticated with check(household_id in(select private.user_household_ids()) and updated_by=(select auth.uid()));
create policy "members update state" on public.household_states for update to authenticated using(household_id in(select private.user_household_ids())) with check(household_id in(select private.user_household_ids()) and updated_by=(select auth.uid()));
create policy "members read invites" on public.household_invites for select to authenticated using(household_id in(select private.user_household_ids()));
create policy "owners create invites" on public.household_invites for insert to authenticated with check(created_by=(select auth.uid()) and exists(select 1 from public.households h where h.id=household_id and h.owner_id=(select auth.uid())));
create policy "owners delete invites" on public.household_invites for delete to authenticated using(exists(select 1 from public.households h where h.id=household_id and h.owner_id=(select auth.uid())));

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(user_id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1))); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
