import type { ReportKind } from "@/lib/items";
import {
  compact,
  compareColours,
  daysBetween,
  normaliseSize,
  shared,
  words,
} from "./normalise";
import { BAND_LABELS, RULES, WEIGHTS } from "./weights";

/** The fields matching needs. Kept independent of how reports are stored. */
export type MatchableReport = {
  id: string;
  kind: ReportKind;
  itemName: string;
  category: string;
  colour: string;
  brand?: string | null;
  size?: string | null;
  details?: string | null;
  /** Optional for missing reports. */
  location?: string | null;
  /** Date last seen (missing) or found, as YYYY-MM-DD. Optional for missing reports. */
  date?: string | null;
  /** Only open reports are suggested. */
  status: "open" | "matched" | "returned" | "withdrawn";
};

export type MatchBand = "strong" | "possible";

export type MatchResult = {
  /** 0–100 ranking score. Not a probability. */
  score: number;
  band: MatchBand | null;
  bandLabel: string | null;
  /** Why they may match, strongest first. */
  reasons: string[];
  /** Details that don't line up, for the compare screen. */
  differences: string[];
};

type Signal = { points: number; reason?: string; difference?: string };

/**
 * Scores how alike a missing and a found report are. Returns score 0 with no
 * band when they can't be the same item (e.g. different categories).
 */
export function scoreMatch(
  missing: MatchableReport,
  found: MatchableReport,
): MatchResult {
  if (missing.category !== found.category) {
    return { score: 0, band: null, bandLabel: null, reasons: [], differences: ["Different categories"] };
  }

  const signals: Signal[] = [
    textSignal(missing, found),
    colourSignal(missing.colour, found.colour),
    brandSignal(missing.brand, found.brand),
    sizeSignal(missing.size, found.size),
    locationSignal(missing.location, found.location),
    dateSignal(missing.date, found.date),
  ];

  const total = signals.reduce<number>((sum, s) => sum + s.points, WEIGHTS.category);
  const score = Math.max(0, Math.min(100, Math.round(total)));
  const band: MatchBand | null =
    score >= RULES.strongScore ? "strong" : score >= RULES.minScore ? "possible" : null;

  // Strongest reasons first; the shared category is always true, so it only
  // fills a spare slot.
  const reasons = [
    ...signals
      .filter((s) => s.reason && s.points > 0)
      .sort((a, b) => b.points - a.points)
      .map((s) => s.reason!),
    `Both in ${missing.category}`,
  ].slice(0, RULES.maxReasons);

  return {
    score,
    band,
    bandLabel: band ? BAND_LABELS[band] : null,
    reasons,
    differences: signals.flatMap((s) => (s.difference ? [s.difference] : [])),
  };
}

function textSignal(a: MatchableReport, b: MatchableReport): Signal {
  const wa = words(`${a.itemName} ${a.details ?? ""}`);
  const wb = words(`${b.itemName} ${b.details ?? ""}`);
  const common = shared(wa, wb);
  if (common.length === 0 || wa.size === 0 || wb.size === 0) return { points: 0 };

  // Overlap relative to the shorter description, so a brief report isn't
  // penalised for the other parent writing more; scaled down until
  // `RULES.textFullCreditWords` words are shared, so one generic shared word
  // ("bottle") counts for little.
  const overlap = common.length / Math.min(wa.size, wb.size);
  const confidence = Math.min(1, common.length / RULES.textFullCreditWords);
  const points = WEIGHTS.text * overlap * confidence;

  const quoted = common
    .sort((x, y) => y.length - x.length)
    .slice(0, 3)
    .map((w) => `“${w}”`);
  return { points, reason: `Both mention ${joinList(quoted)}` };
}

function colourSignal(a: string, b: string): Signal {
  switch (compareColours(a, b)) {
    case "same":
      return { points: WEIGHTS.colourSame, reason: `Both ${a.toLowerCase()}` };
    case "related":
      return {
        points: WEIGHTS.colourRelated,
        reason: `Similar colours (${a.toLowerCase()} and ${b.toLowerCase()})`,
      };
    default:
      return { points: 0, difference: `Different colours (${a.toLowerCase()} and ${b.toLowerCase()})` };
  }
}

function brandSignal(a?: string | null, b?: string | null): Signal {
  const ca = compact(a);
  const cb = compact(b);
  if (!ca || !cb) return { points: 0 };
  if (ca === cb || ca.includes(cb) || cb.includes(ca)) {
    return { points: WEIGHTS.brandSame, reason: `Same brand (${b!.trim()})` };
  }
  return { points: WEIGHTS.brandDifferent, difference: `Different brands (${a!.trim()} and ${b!.trim()})` };
}

function sizeSignal(a?: string | null, b?: string | null): Signal {
  const na = normaliseSize(a);
  const nb = normaliseSize(b);
  if (!na || !nb) return { points: 0 };
  if (na === nb) return { points: WEIGHTS.sizeSame, reason: `Same size (${b!.trim()})` };
  return { points: WEIGHTS.sizeDifferent, difference: `Different sizes (${a!.trim()} and ${b!.trim()})` };
}

function locationSignal(a?: string | null, b?: string | null): Signal {
  if (!a || !b) return { points: 0 };
  if (compact(a) && compact(a) === compact(b)) {
    return { points: WEIGHTS.locationSame, reason: `Same place (${b.trim()})` };
  }
  const common = shared(words(a), words(b));
  if (common.length > 0) {
    return { points: WEIGHTS.locationOverlap, reason: `Similar place (${common[0]})` };
  }
  return { points: 0 };
}

function dateSignal(missingDate?: string | null, foundDate?: string | null): Signal {
  if (!missingDate || !foundDate) return { points: 0 };
  const days = daysBetween(missingDate, foundDate);
  if (Number.isNaN(days)) return { points: 0 };
  if (days < -RULES.dateGraceDays) {
    return {
      points: WEIGHTS.dateFoundBeforeLost,
      difference: `Found ${-days} days before it went missing`,
    };
  }
  if (days <= RULES.dateWindowDays) {
    const when =
      days <= 0 ? "Found around the day it went missing" : `Found ${days} day${days === 1 ? "" : "s"} after it went missing`;
    return { points: WEIGHTS.dateClose, reason: when };
  }
  return { points: 0 };
}

function joinList(items: string[]): string {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
