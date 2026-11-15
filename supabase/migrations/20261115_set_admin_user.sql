-- Set user as admin
-- Run after initial schema migration

insert into public.profiles (id, role, name)
values ('84d17b5d-9a4b-4998-a411-20c1407615c0', 'admin', 'Admin Foodrink')
on conflict (id) do update set role = 'admin';

-- Verify
select id, role, name, created_at
from public.profiles
where id = '84d17b5d-9a4b-4998-a411-20c1407615c0';