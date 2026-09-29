-- Missing-item reports: "where and when last seen" become optional (parents
-- often don't know). Found-item reports still need both.
alter table public.reports
  alter column location drop not null,
  alter column event_date drop not null;

alter table public.reports
  drop constraint reports_location_check,
  add constraint reports_location_check
    check (location is null or char_length(btrim(location)) between 1 and 120),
  add constraint found_reports_need_place_and_date
    check (kind = 'missing' or (location is not null and event_date is not null));
