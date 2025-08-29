-- Helper RPC to resolve a user's UUID by email for admin use
create or replace function public.get_user_id_by_email(_email text)
returns uuid
language sql
stable
security definer
as $$
  select id
  from auth.users
  where lower(email) = lower(_email)
  limit 1;
$$;

grant execute on function public.get_user_id_by_email(text) to anon, authenticated, service_role;

