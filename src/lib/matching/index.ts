import { scoreMatch, type MatchableReport, type MatchResult } from "./score";
import { RULES } from "./weights";

export { scoreMatch } from "./score";
export type { MatchableReport, MatchBand, MatchResult } from "./score";
export { BAND_LABELS, RULES, WEIGHTS } from "./weights";

export type Suggestion = MatchResult & { report: MatchableReport };

/** Key for a missing/found pair, used to remember dismissed suggestions. */
export function pairKey(missingId: string, foundId: string): string {
  return `${missingId}:${foundId}`;
}

/**
 * Possible matches for one report among reports of the opposite kind,
 * best first. Only open reports are considered, and dismissed pairs are
 * skipped. Suggestions are hints for parents to check, never certain.
 */
export function findMatches(
  report: MatchableReport,
  candidates: MatchableReport[],
  options: { dismissed?: Set<string>; limit?: number } = {},
): Suggestion[] {
  if (report.status !== "open") return [];
  const { dismissed = new Set<string>(), limit = RULES.maxSuggestions } = options;

  return candidates
    .filter((c) => c.kind !== report.kind && c.status === "open" && c.id !== report.id)
    .map((c) => {
      const [missing, found] = report.kind === "missing" ? [report, c] : [c, report];
      if (dismissed.has(pairKey(missing.id, found.id))) return null;
      return { ...scoreMatch(missing, found), report: c };
    })
    .filter((s): s is Suggestion => s !== null && s.band !== null)
    .sort((a, b) => b.score - a.score || a.report.date.localeCompare(b.report.date))
    .slice(0, limit);
}
