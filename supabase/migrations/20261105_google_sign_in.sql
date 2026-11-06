-- Run once in the SQL Editor before enabling Google sign-in in the app.
begin;

create table if not exists public.google_user_accounts (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  user_id bigint not null unique references public."Users"(id) on delete cascade
);
alter table public.google_user_accounts enable row level security;
revoke all on public.google_user_accounts from public, anon, authenticated;
grant select, insert on public.google_user_accounts to service_role;

-- Only the trusted backend can provision a profile. The function reads the
-- identity from Auth; callers cannot supply a different email or profile ID.
create or replace function public.sign_in_google_user(p_auth_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_profile auth.users%rowtype;
  app_profile public."Users"%rowtype;
  full_name text;
begin
  select * into auth_profile from auth.users
    where id = p_auth_user_id and email_confirmed_at is not null;
  if not found or not exists (
    select 1 from auth.identities where user_id = p_auth_user_id and provider = 'google'
  ) then
    raise exception 'INVALID_GOOGLE_IDENTITY';
  end if;

  -- Serialize simultaneous callbacks, including distinct Auth IDs with the
  -- same email, so they cannot create duplicate application accounts.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pg_catalog.lower(auth_profile.email), 0));
  select u.* into app_profile from public."Users" u
    join public.google_user_accounts g on g.user_id = u.id
    where g.auth_user_id = p_auth_user_id;
  if found then return pg_catalog.to_jsonb(app_profile) - 'Password'; end if;

  -- Legacy emails were not verified. Do not silently link a Google identity
  -- to an existing password account based only on its email address.
  if exists (select 1 from public."Users" where pg_catalog.lower(email) = pg_catalog.lower(auth_profile.email)) then
    raise exception 'EXISTING_EMAIL';
  end if;

  full_name := coalesce(auth_profile.raw_user_meta_data->>'full_name', auth_profile.raw_user_meta_data->>'name', 'Google user');
  insert into public."Users" ("Name", "Surname", "Username", email, "Password") values (
    pg_catalog.left(coalesce(auth_profile.raw_user_meta_data->>'given_name', pg_catalog.split_part(full_name, ' ', 1)), 100),
    pg_catalog.left(coalesce(auth_profile.raw_user_meta_data->>'family_name', ''), 100),
    'g_' || pg_catalog.left(pg_catalog.replace(p_auth_user_id::text, '-', ''), 16),
    auth_profile.email,
    pg_catalog.gen_random_uuid()::text || pg_catalog.gen_random_uuid()::text
  ) returning * into app_profile;
  insert into public.google_user_accounts (auth_user_id, user_id) values (p_auth_user_id, app_profile.id);
  return pg_catalog.to_jsonb(app_profile) - 'Password';
end;
$$;

revoke all on function public.sign_in_google_user(uuid) from public, anon, authenticated;
grant execute on function public.sign_in_google_user(uuid) to service_role;
commit;
