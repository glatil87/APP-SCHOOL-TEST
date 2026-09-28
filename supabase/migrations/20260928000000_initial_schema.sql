-- School Lost & Found — initial schema and access rules.
--
-- Principles:
--   * Every row belongs to a school. Only APPROVED members of that school can
--     read it (Row Level Security on every table).
--   * Parents can only create and edit their own reports.
--   * Report status (matched / returned) only changes through the functions
--     at the bottom, never by direct edits, and never automatically.
--   * Contact details are only revealed to the two parents of a confirmed
--     match (and coordinators).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.member_role as enum ('parent', 'coordinator');
create type public.membership_status as enum ('pending', 'approved', 'removed');
create type public.report_kind as enum ('missing', 'found');
create type public.report_status as enum ('open', 'matched', 'returned', 'withdrawn');
create type public.match_status as enum ('dismissed', 'confirmed', 'returned');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

-- Public-facing identity: shown to other approved members of the school.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  parent_first_name text not null check (char_length(btrim(parent_first_name)) between 1 and 40),
  child_first_name text not null check (char_length(btrim(child_first_name)) between 1 and 40),
  -- A built-in avatar id (e.g. "fox"), or 'photo' when avatar_path is set.
  avatar text not null default 'smile' check (char_length(avatar) between 1 and 30),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private contact details: only the owner can read them directly. They are
-- shared through match_contacts() once a match is confirmed.
create table public.contact_details (
  user_id uuid primary key references auth.users (id) on delete cascade,
  phone text check (phone is null or char_length(phone) <= 30),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'parent',
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  primary key (school_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  -- Only a hash of the invite code is stored.
  code_hash text not null unique,
  label text check (label is null or char_length(label) <= 80),
  expires_at timestamptz,
  revoked_at timestamptz,
  use_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  kind public.report_kind not null,
  status public.report_status not null default 'open',
  item_name text not null check (char_length(btrim(item_name)) between 1 and 80),
  category text not null check (char_length(category) between 1 and 40),
  colour text not null check (char_length(colour) between 1 and 30),
  brand text check (brand is null or char_length(brand) <= 60),
  size text check (size is null or char_length(size) <= 30),
  details text not null default '' check (char_length(details) <= 1000),
  location text not null check (char_length(btrim(location)) between 1 and 120),
  -- Date last seen (missing) or found.
  event_date date not null check (event_date <= current_date + 1),
  -- Found reports only: where the item is now, e.g. "With me".
  current_location text check (current_location is null or char_length(current_location) <= 120),
  photo_path text check (photo_path is null or char_length(photo_path) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photo_in_school_folder check (
    photo_path is null or photo_path like school_id::text || '/%'
  )
);
create index reports_school_kind_status_idx on public.reports (school_id, kind, status, created_at desc);
create index reports_reporter_idx on public.reports (reporter_id);

-- A decision a parent made about a missing/found pair. Possible matches are
-- computed by the app and never stored; only decisions are.
create table public.match_decisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  missing_report_id uuid not null references public.reports (id) on delete cascade,
  found_report_id uuid not null references public.reports (id) on delete cascade,
  status public.match_status not null,
  score integer check (score between 0 and 100),
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz not null default now(),
  returned_by uuid references auth.users (id) on delete set null,
  returned_at timestamptz,
  unique (missing_report_id, found_report_id)
);
-- A report can be part of at most one confirmed/returned match.
create unique index match_one_per_missing on public.match_decisions (missing_report_id)
  where status in ('confirmed', 'returned');
create unique index match_one_per_found on public.match_decisions (found_report_id)
  where status in ('confirmed', 'returned');
create index match_school_idx on public.match_decisions (school_id);

-- ---------------------------------------------------------------------------
-- Helpers used by the access rules
-- ---------------------------------------------------------------------------

create function public.is_member(p_school uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.school_id = p_school
      and m.user_id = (select auth.uid())
      and m.status = 'approved'
  )
$$;

create function public.is_coordinator(p_school uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.school_id = p_school
      and m.user_id = (select auth.uid())
      and m.status = 'approved'
      and m.role = 'coordinator'
  )
$$;

-- True when the caller may see another user's profile: they are approved
-- members of the same school, or the caller coordinates a school the other
-- user has applied to.
create function public.can_see_user(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = (select auth.uid()) or exists (
    select 1
    from public.memberships theirs
    join public.memberships mine
      on mine.school_id = theirs.school_id
     and mine.user_id = (select auth.uid())
     and mine.status = 'approved'
    where theirs.user_id = p_user
      and (theirs.status = 'approved' or mine.role = 'coordinator')
  )
$$;

create function public.try_uuid(p text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when others then
  return null;
end
$$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger contact_details_touch before update on public.contact_details
  for each row execute function public.touch_updated_at();
create trigger reports_touch before update on public.reports
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Table privileges: nothing for signed-out visitors; signed-in users get only
-- what the policies below allow, and only on the listed columns.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on public.schools to authenticated;

grant select, delete on public.profiles to authenticated;
grant insert (user_id, parent_first_name, child_first_name, avatar, avatar_path) on public.profiles to authenticated;
grant update (parent_first_name, child_first_name, avatar, avatar_path) on public.profiles to authenticated;

grant select, delete on public.contact_details to authenticated;
grant insert (user_id, phone) on public.contact_details to authenticated;
grant update (phone) on public.contact_details to authenticated;

grant select on public.memberships to authenticated;
grant select on public.invites to authenticated;

grant select, delete on public.reports to authenticated;
grant insert (school_id, reporter_id, kind, item_name, category, colour, brand, size,
              details, location, event_date, current_location, photo_path)
  on public.reports to authenticated;
grant update (item_name, category, colour, brand, size, details, location, event_date,
              current_location, photo_path)
  on public.reports to authenticated;

grant select on public.match_decisions to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.contact_details enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.reports enable row level security;
alter table public.match_decisions enable row level security;

-- Schools: visible to anyone who belongs to (or has applied to) them.
create policy schools_read on public.schools for select to authenticated
  using (exists (
    select 1 from public.memberships m
    where m.school_id = schools.id and m.user_id = (select auth.uid())
      and m.status <> 'removed'
  ));

-- Profiles
create policy profiles_read on public.profiles for select to authenticated
  using (public.can_see_user(user_id));
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy profiles_delete_own on public.profiles for delete to authenticated
  using (user_id = (select auth.uid()));

-- Contact details: owner only.
create policy contacts_own on public.contact_details for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Memberships: your own, or all of a school you coordinate. Changes go
-- through join_school() and set_membership().
create policy memberships_read on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or public.is_coordinator(school_id));

-- Invites: coordinators only. Created via create_invite().
create policy invites_read on public.invites for select to authenticated
  using (public.is_coordinator(school_id));

-- Reports
create policy reports_read on public.reports for select to authenticated
  using (public.is_member(school_id));
create policy reports_insert_own on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and public.is_member(school_id));
create policy reports_update_own on public.reports for update to authenticated
  using (reporter_id = (select auth.uid()) and public.is_member(school_id) and status = 'open')
  with check (reporter_id = (select auth.uid()) and public.is_member(school_id));
create policy reports_delete on public.reports for delete to authenticated
  using (
    public.is_coordinator(school_id)
    or (reporter_id = (select auth.uid()) and public.is_member(school_id)
        and status in ('open', 'withdrawn'))
  );

-- Match decisions: dismissals are visible to all members (so a dismissed
-- suggestion disappears for everyone). Confirmed/returned matches only to
-- the two reporting parents and coordinators.
create policy matches_read on public.match_decisions for select to authenticated
  using (
    public.is_member(school_id) and (
      status = 'dismissed'
      or public.is_coordinator(school_id)
      or exists (
        select 1 from public.reports r
        where r.id in (missing_report_id, found_report_id)
          and r.reporter_id = (select auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Actions (the only way to change memberships, invites and match status)
-- ---------------------------------------------------------------------------

-- Join a school with an invite code. Creates a PENDING membership awaiting a
-- coordinator's approval. Removed members stay removed.
create function public.join_school(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.invites;
begin
  if v_uid is null then
    raise exception 'Please sign in first' using errcode = '28000';
  end if;

  select * into v_invite from public.invites
  where code_hash = encode(extensions.digest(btrim(p_code), 'sha256'), 'hex')
    and revoked_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'This invite link is not valid any more' using errcode = 'P0002';
  end if;

  insert into public.memberships (school_id, user_id)
  values (v_invite.school_id, v_uid)
  on conflict (school_id, user_id) do nothing;

  update public.invites set use_count = use_count + 1 where id = v_invite.id;
  return v_invite.school_id;
end
$$;

-- Coordinator: create an invite code. Returns the plain code once; only its
-- hash is stored.
create function public.create_invite(p_school uuid, p_label text default null, p_days integer default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := encode(extensions.gen_random_bytes(12), 'hex');
begin
  if not public.is_coordinator(p_school) then
    raise exception 'Only coordinators can create invites' using errcode = '42501';
  end if;
  insert into public.invites (school_id, code_hash, label, expires_at, created_by)
  values (
    p_school,
    encode(extensions.digest(v_code, 'sha256'), 'hex'),
    p_label,
    case when p_days is null then null else now() + make_interval(days => p_days) end,
    auth.uid()
  );
  return v_code;
end
$$;

create function public.revoke_invite(p_invite uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.invites set revoked_at = now()
  where id = p_invite and public.is_coordinator(school_id) and revoked_at is null;
  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;
end
$$;

-- Coordinator: approve, remove, or change the role of a member.
create function public.set_membership(
  p_school uuid, p_user uuid, p_status public.membership_status,
  p_role public.member_role default null
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_coordinator(p_school) then
    raise exception 'Only coordinators can manage members' using errcode = '42501';
  end if;
  if p_user = auth.uid() and (p_status <> 'approved' or p_role = 'parent') then
    raise exception 'You cannot remove or demote yourself' using errcode = '42501';
  end if;
  update public.memberships
  set status = p_status,
      role = coalesce(p_role, role),
      decided_by = auth.uid(),
      decided_at = now()
  where school_id = p_school and user_id = p_user;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
end
$$;

-- Service role only: make someone the first coordinator of a school.
create function public.bootstrap_coordinator(p_school uuid, p_user uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.memberships (school_id, user_id, role, status, decided_at)
  values (p_school, p_user, 'coordinator', 'approved', now())
  on conflict (school_id, user_id)
  do update set role = 'coordinator', status = 'approved', decided_at = now()
$$;

-- Parent: withdraw your own open report (e.g. the item turned up at home).
create function public.withdraw_report(p_report uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.reports set status = 'withdrawn'
  where id = p_report and reporter_id = auth.uid() and status = 'open'
    and public.is_member(school_id);
  if not found then
    raise exception 'Report not found or not open' using errcode = 'P0002';
  end if;
end
$$;

-- Loads a missing/found pair and checks the caller may act on it.
create function public.check_pair(p_missing uuid, p_found uuid)
returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.reports;
  f public.reports;
begin
  select * into m from public.reports where id = p_missing;
  select * into f from public.reports where id = p_found;
  if m.id is null or f.id is null or m.kind <> 'missing' or f.kind <> 'found'
     or m.school_id <> f.school_id or not public.is_member(m.school_id) then
    raise exception 'Reports not found' using errcode = 'P0002';
  end if;
  if not (auth.uid() in (m.reporter_id, f.reporter_id) or public.is_coordinator(m.school_id)) then
    raise exception 'Only the parents who made these reports can do this' using errcode = '42501';
  end if;
  return m.school_id;
end
$$;

-- "Not a match": hide this suggestion for everyone.
create function public.dismiss_suggestion(p_missing uuid, p_found uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_school uuid := public.check_pair(p_missing, p_found);
begin
  insert into public.match_decisions (school_id, missing_report_id, found_report_id, status, decided_by)
  values (v_school, p_missing, p_found, 'dismissed', auth.uid())
  on conflict (missing_report_id, found_report_id) do nothing;
end
$$;

create function public.undo_dismiss(p_missing uuid, p_found uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_pair(p_missing, p_found);
  delete from public.match_decisions
  where missing_report_id = p_missing and found_report_id = p_found and status = 'dismissed';
end
$$;

-- "This looks like a match": both reports leave the open lists and the two
-- parents can see each other's contact details.
create function public.confirm_match(p_missing uuid, p_found uuid, p_score integer default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_school uuid := public.check_pair(p_missing, p_found);
  v_id uuid;
begin
  -- Lock both reports so two parents can't confirm different matches at once.
  perform 1 from public.reports where id in (p_missing, p_found) for update;
  if exists (select 1 from public.reports where id in (p_missing, p_found) and status <> 'open') then
    raise exception 'One of these items is no longer open' using errcode = '55000';
  end if;

  insert into public.match_decisions (school_id, missing_report_id, found_report_id, status, score, decided_by, decided_at)
  values (v_school, p_missing, p_found, 'confirmed', p_score, auth.uid(), now())
  on conflict (missing_report_id, found_report_id)
  do update set status = 'confirmed', score = excluded.score,
                decided_by = excluded.decided_by, decided_at = now()
  returning id into v_id;

  update public.reports set status = 'matched' where id in (p_missing, p_found);
  return v_id;
end
$$;

-- "Not a match after all": undo a confirmation before the item is returned.
create function public.unconfirm_match(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  d public.match_decisions;
begin
  select * into d from public.match_decisions where id = p_match and status = 'confirmed';
  if d.id is null then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;
  perform public.check_pair(d.missing_report_id, d.found_report_id);
  update public.match_decisions set status = 'dismissed', decided_by = auth.uid(), decided_at = now()
  where id = p_match;
  update public.reports set status = 'open'
  where id in (d.missing_report_id, d.found_report_id) and status = 'matched';
end
$$;

create function public.mark_returned(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  d public.match_decisions;
begin
  select * into d from public.match_decisions where id = p_match and status = 'confirmed';
  if d.id is null then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;
  perform public.check_pair(d.missing_report_id, d.found_report_id);
  update public.match_decisions set status = 'returned', returned_by = auth.uid(), returned_at = now()
  where id = p_match;
  update public.reports set status = 'returned'
  where id in (d.missing_report_id, d.found_report_id);
end
$$;

-- Names and contact details for the two parents of a confirmed match.
create function public.match_contacts(p_match uuid)
returns table (
  side public.report_kind,
  user_id uuid,
  parent_first_name text,
  child_first_name text,
  avatar text,
  avatar_path text,
  email text,
  phone text
)
language plpgsql stable security definer set search_path = '' as $$
declare
  d public.match_decisions;
begin
  select * into d from public.match_decisions
  where id = p_match and status in ('confirmed', 'returned');
  if d.id is null then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;
  perform public.check_pair(d.missing_report_id, d.found_report_id);

  return query
  select r.kind, r.reporter_id, p.parent_first_name, p.child_first_name,
         p.avatar, p.avatar_path, u.email::text, c.phone
  from public.reports r
  join auth.users u on u.id = r.reporter_id
  left join public.profiles p on p.user_id = r.reporter_id
  left join public.contact_details c on c.user_id = r.reporter_id
  where r.id in (d.missing_report_id, d.found_report_id)
  order by r.kind;
end
$$;

-- Functions are callable by signed-in users only (the checks inside decide
-- the rest); the bootstrap function is for the service role only.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.is_member(uuid), public.is_coordinator(uuid), public.can_see_user(uuid),
  public.try_uuid(text),
  public.join_school(text), public.create_invite(uuid, text, integer), public.revoke_invite(uuid),
  public.set_membership(uuid, uuid, public.membership_status, public.member_role),
  public.withdraw_report(uuid), public.check_pair(uuid, uuid),
  public.dismiss_suggestion(uuid, uuid), public.undo_dismiss(uuid, uuid),
  public.confirm_match(uuid, uuid, integer), public.unconfirm_match(uuid),
  public.mark_returned(uuid), public.match_contacts(uuid)
to authenticated;
grant execute on function public.bootstrap_coordinator(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Photo storage (private buckets)
--   report-photos/<school_id>/<user_id>/<file>
--   avatars/<user_id>/<file>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('report-photos', 'report-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy report_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'report-photos'
         and public.is_member(public.try_uuid((storage.foldername(name))[1])));
create policy report_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos'
              and public.is_member(public.try_uuid((storage.foldername(name))[1]))
              and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy report_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos'
         and (storage.foldername(name))[2] = (select auth.uid())::text);

create policy avatars_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars'
         and public.can_see_user(public.try_uuid((storage.foldername(name))[1])));
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars'
              and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
