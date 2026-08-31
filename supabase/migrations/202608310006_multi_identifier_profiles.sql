alter table public.profiles
  add column if not exists email text,
  add column if not exists country_code text,
  add column if not exists phone_number text;

alter table public.profiles drop constraint if exists profiles_phone_parts_check;
alter table public.profiles add constraint profiles_phone_parts_check check (
  (country_code is null and phone_number is null)
  or (country_code in ('+61', '+86') and phone_number ~ '^[0-9]{9,11}$')
);

create unique index if not exists profiles_phone_unique_idx
  on public.profiles(country_code, phone_number)
  where phone_number is not null;

update public.profiles profile
set email = users.email,
    country_code = case
      when users.phone like '+61%' then '+61'
      when users.phone like '+86%' then '+86'
      else profile.country_code
    end,
    phone_number = case
      when users.phone like '+61%' then substr(users.phone, 4)
      when users.phone like '+86%' then substr(users.phone, 4)
      else profile.phone_number
    end
from auth.users users
where users.id = profile.user_id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  new_country_code text;
  new_phone_number text;
begin
  if new.phone like '+61%' then
    new_country_code := '+61';
    new_phone_number := substr(new.phone, 4);
  elsif new.phone like '+86%' then
    new_country_code := '+86';
    new_phone_number := substr(new.phone, 4);
  end if;

  insert into public.profiles(user_id, display_name, email, country_code, phone_number)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), new.phone, '家庭成员'),
    new.email,
    new_country_code,
    new_phone_number
  );
  return new;
end
$$;
