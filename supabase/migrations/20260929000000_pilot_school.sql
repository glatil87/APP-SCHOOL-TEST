-- The single pilot school. Its name is set by the first coordinator on the
-- app's setup page.
insert into public.schools (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Our school')
on conflict (id) do nothing;
