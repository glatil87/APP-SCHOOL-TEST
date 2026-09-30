-- "I found this" / "This is mine" create the matching report behind the
-- scenes. Mark those reports so they never show up as a report of their own,
-- and so undoing the match removes them instead of putting them on a list.
alter table public.reports add column if not exists quick_claim boolean not null default false;
grant insert (quick_claim) on public.reports to authenticated;

-- Reports already made this way (before this column existed): created by the
-- same parent who confirmed the match, with a perfect score, moments earlier.
update public.reports r set quick_claim = true
from public.match_decisions d
where r.id in (d.missing_report_id, d.found_report_id)
  and d.status in ('confirmed', 'returned')
  and d.score = 100
  and d.decided_by = r.reporter_id
  and r.details = ''
  and r.location is null
  and d.decided_at - r.created_at between interval '0' and interval '1 minute';

-- "Not a match after all": reopen the real reports, close the behind-the-scenes one.
create or replace function public.unconfirm_match(p_match uuid) returns void
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
  update public.reports
  set status = case when quick_claim then 'withdrawn'::public.report_status else 'open'::public.report_status end
  where id in (d.missing_report_id, d.found_report_id) and status = 'matched';
end
$$;
