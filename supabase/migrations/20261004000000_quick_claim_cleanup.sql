-- Catch reports made by "I found this" / "This is mine" before they were
-- flagged, including ones whose match was later undone (which put them back
-- on a list). Such reports were copied from another report, with no details,
-- no place and no photo, and were paired with a perfect-score match decision
-- (confirmed, returned or since undone). Found ones also carry today's date
-- and one of the fixed "where is it now" answers.
update public.reports r set quick_claim = true
where not r.quick_claim
  and r.details = ''
  and r.location is null
  and r.photo_path is null
  and exists (
    select 1 from public.match_decisions d
    where r.id in (d.missing_report_id, d.found_report_id) and d.score = 100
  )
  and (
    (r.kind = 'missing' and r.event_date is null)
    or (r.kind = 'found'
        and r.event_date = (r.created_at at time zone 'Europe/London')::date
        and r.current_location in ('I have it at home', 'Handed in to the school office', 'In the lost property box'))
  );

-- Behind-the-scenes reports are never listed on their own: close any that
-- were put back on a list by an undo.
update public.reports set status = 'withdrawn' where quick_claim and status = 'open';
