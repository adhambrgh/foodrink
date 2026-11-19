-- Fix handle_new_user trigger: use raw_user_meta_data for name & phone
-- Replaces outdated version from 20261115_full_recovery.sql

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), new.email),
    case
      when new.raw_user_meta_data->>'phone' is not null
        and new.raw_user_meta_data->>'phone' <> ''
      then public.normalize_phone(new.raw_user_meta_data->>'phone')
      else null
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger (drop existing first to be safe)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Optional: backfill existing users from raw_user_meta_data
-- Uncomment to run once:
 update public.profiles p
set
   name = coalesce(nullif(u.raw_user_meta_data->>'name', ''), u.email),
phone = case
     when u.raw_user_meta_data->>'phone' is not null
       and u.raw_user_meta_data->>'phone' <> ''
     then public.normalize_phone(u.raw_user_meta_data->>'phone')
     else null
   end
 from auth.users u
 where u.id = p.id
   and (p.name = u.email or p.name is null or p.phone is null);