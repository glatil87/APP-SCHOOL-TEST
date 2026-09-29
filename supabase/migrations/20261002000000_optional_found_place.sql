-- Found-item reports: "where and when found" are optional too.
alter table public.reports drop constraint if exists found_reports_need_place_and_date;
