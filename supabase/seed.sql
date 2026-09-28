-- Local development only: the pilot school.
insert into public.schools (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Pilot School')
on conflict (id) do nothing;
