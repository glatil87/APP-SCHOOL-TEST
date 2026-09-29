import "server-only";
import { findMatches, pairKey, scoreMatch, type MatchableReport, type MatchResult } from "./matching";
import { getReport, reportPhotoUrls, type ReportRow } from "./reports";
import { SCHOOL_ID } from "./school";
import { createClient } from "./supabase/server";

const COLUMNS =
  "id, reporter_id, kind, status, item_name, category, colour, brand, size, details, location, event_date, current_location, photo_path, created_at";

export function toMatchable(r: ReportRow): MatchableReport {
  return {
    id: r.id,
    kind: r.kind,
    itemName: r.item_name,
    category: r.category,
    colour: r.colour,
    brand: r.brand,
    size: r.size,
    details: r.details,
    location: r.location,
    date: r.event_date,
    status: r.status,
  };
}

export type SuggestionView = MatchResult & { report: ReportRow; photoUrl: string | null };

async function dismissedPairs(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_decisions")
    .select("missing_report_id, found_report_id")
    .eq("school_id", SCHOOL_ID)
    .eq("status", "dismissed");
  return new Set((data ?? []).map((d) => pairKey(d.missing_report_id, d.found_report_id)));
}

async function openReports(kind: "missing" | "found"): Promise<ReportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(COLUMNS)
    .eq("school_id", SCHOOL_ID)
    .eq("kind", kind)
    .eq("status", "open")
    .limit(1000);
  return (data ?? []) as ReportRow[];
}

/** Possible matches for one report, best first. Suggestions only — never certain. */
export async function suggestionsFor(report: ReportRow): Promise<SuggestionView[]> {
  if (report.status !== "open") return [];
  const [candidates, dismissed] = await Promise.all([
    openReports(report.kind === "missing" ? "found" : "missing"),
    dismissedPairs(),
  ]);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const found = findMatches(toMatchable(report), candidates.map(toMatchable), { dismissed });
  const rows = found.map((s) => byId.get(s.report.id)!);
  const photos = await reportPhotoUrls(rows);
  return found.map((s, i) => ({ ...s, report: rows[i], photoUrl: photos.get(rows[i].id) ?? null }));
}

export type NearMiss = MatchResult & { report: ReportRow; dismissed: boolean };

/**
 * Coordinator diagnostics: the closest reports that were NOT suggested
 * (below the threshold, different type, or marked "Not a match"), with
 * their scores, so matching can be tuned during the pilot.
 */
export async function nearMissesFor(report: ReportRow, limit = 4): Promise<NearMiss[]> {
  if (report.status !== "open") return [];
  const [candidates, dismissed] = await Promise.all([
    openReports(report.kind === "missing" ? "found" : "missing"),
    dismissedPairs(),
  ]);
  const me = toMatchable(report);
  return candidates
    .map((c) => {
      const other = toMatchable(c);
      const [m, f] = report.kind === "missing" ? [me, other] : [other, me];
      const isDismissed = dismissed.has(pairKey(m.id, f.id));
      return { ...scoreMatch(m, f), report: c, dismissed: isDismissed };
    })
    .filter((n) => n.band === null || n.dismissed)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** How many possible matches each of these reports has (for Home). */
export async function suggestionCounts(reports: ReportRow[]): Promise<Map<string, number>> {
  const open = reports.filter((r) => r.status === "open");
  const counts = new Map<string, number>();
  if (!open.length) return counts;
  const [missing, found, dismissed] = await Promise.all([openReports("missing"), openReports("found"), dismissedPairs()]);
  for (const r of open) {
    const pool = (r.kind === "missing" ? found : missing).map(toMatchable);
    counts.set(r.id, findMatches(toMatchable(r), pool, { dismissed }).length);
  }
  return counts;
}

export type Decision = {
  id: string;
  missing_report_id: string;
  found_report_id: string;
  status: "dismissed" | "confirmed" | "returned";
  score: number | null;
  decided_at: string;
  returned_at: string | null;
};

const DECISION_COLUMNS = "id, missing_report_id, found_report_id, status, score, decided_at, returned_at";

/** The decision (if any) the viewer can see for a missing/found pair. */
export async function decisionForPair(missingId: string, foundId: string): Promise<Decision | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_decisions")
    .select(DECISION_COLUMNS)
    .eq("missing_report_id", missingId)
    .eq("found_report_id", foundId)
    .maybeSingle();
  return (data as Decision | null) ?? null;
}

/** The confirmed/returned match a report belongs to, if the viewer may see it. */
export async function matchForReport(reportId: string): Promise<Decision | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_decisions")
    .select(DECISION_COLUMNS)
    .or(`missing_report_id.eq.${reportId},found_report_id.eq.${reportId}`)
    .in("status", ["confirmed", "returned"])
    .maybeSingle();
  return (data as Decision | null) ?? null;
}

export async function getMatch(id: string): Promise<Decision | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_decisions")
    .select(DECISION_COLUMNS)
    .eq("id", id)
    .in("status", ["confirmed", "returned"])
    .maybeSingle();
  return (data as Decision | null) ?? null;
}

export type Contact = {
  side: "missing" | "found";
  user_id: string;
  parent_first_name: string | null;
  child_first_name: string | null;
  avatar: string | null;
  avatar_path: string | null;
  email: string;
  phone: string | null;
};

/** Both parents' names and contact details (only for the two parents or a coordinator). */
export async function matchContacts(matchId: string): Promise<Contact[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("match_contacts", { p_match: matchId });
  return (data ?? []) as Contact[];
}

/** Loads a missing/found pair and scores it for the compare screen. */
export async function loadPair(missingId: string, foundId: string) {
  const [missing, found] = await Promise.all([getReport(missingId), getReport(foundId)]);
  if (!missing || !found || missing.kind !== "missing" || found.kind !== "found") return null;
  const photos = await reportPhotoUrls([missing, found]);
  return {
    missing,
    found,
    result: scoreMatch(toMatchable(missing), toMatchable(found)),
    photos,
  };
}
