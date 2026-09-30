import "server-only";
import { OLDER_AFTER_DAYS, type ReportKind, type ReportSummary, type Status } from "./items";
import { SCHOOL_ID } from "./school";
import { createClient } from "./supabase/server";

export type ReportRow = {
  id: string;
  reporter_id: string;
  kind: ReportKind;
  status: "open" | "matched" | "returned" | "withdrawn";
  item_name: string;
  category: string;
  colour: string;
  brand: string | null;
  size: string | null;
  details: string;
  location: string | null;
  event_date: string | null;
  current_location: string | null;
  photo_path: string | null;
  created_at: string;
  /** Made behind the scenes by "I found this" / "This is mine"; never listed as a report. */
  quick_claim: boolean;
};

const COLUMNS =
  "id, reporter_id, kind, status, item_name, category, colour, brand, size, details, location, event_date, current_location, photo_path, created_at, quick_claim";

export function isOlder(r: Pick<ReportRow, "status" | "created_at">, now = Date.now()): boolean {
  return r.status === "open" && now - Date.parse(r.created_at) > OLDER_AFTER_DAYS * 24 * 3600 * 1000;
}

/** Status as parents see it. */
export function displayStatus(r: Pick<ReportRow, "status" | "created_at">): Status {
  if (r.status === "matched") return "Matched";
  if (r.status === "returned") return "Returned";
  if (r.status === "withdrawn") return "Withdrawn";
  return isOlder(r) ? "Older" : "Open";
}

/** Short-lived links to report photos (the storage rules decide who may see them). */
export async function reportPhotoUrls(rows: Pick<ReportRow, "id" | "photo_path">[]): Promise<Map<string, string>> {
  const withPhoto = rows.filter((r) => r.photo_path);
  const urls = new Map<string, string>();
  if (!withPhoto.length) return urls;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("report-photos").createSignedUrls(
    withPhoto.map((r) => r.photo_path!),
    60 * 60,
  );
  data?.forEach((d, i) => {
    if (d.signedUrl) urls.set(withPhoto[i].id, d.signedUrl);
  });
  return urls;
}

export async function toSummaries(
  rows: ReportRow[],
  viewerId: string,
  matchCounts?: Map<string, number>,
): Promise<ReportSummary[]> {
  const photos = await reportPhotoUrls(rows);
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    itemName: r.item_name,
    category: r.category,
    colour: r.colour,
    location: r.location,
    date: r.event_date,
    status: displayStatus(r),
    photoUrl: photos.get(r.id) ?? null,
    mine: r.reporter_id === viewerId,
    matchCount: matchCounts?.get(r.id),
  }));
}

/** Open reports of one kind, newest first (matched items leave the lists). */
export async function listReports(kind: ReportKind, viewerId: string): Promise<ReportSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(COLUMNS)
    .eq("school_id", SCHOOL_ID)
    .eq("kind", kind)
    .eq("status", "open")
    .eq("quick_claim", false)
    .order("created_at", { ascending: false })
    .limit(500);
  return toSummaries((data ?? []) as ReportRow[], viewerId);
}

/** The viewer's own reports that are still active (open or matched). */
export async function myReportRows(viewerId: string): Promise<ReportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(COLUMNS)
    .eq("reporter_id", viewerId)
    .in("status", ["open", "matched"])
    .order("created_at", { ascending: false });
  return (data ?? []) as ReportRow[];
}

export async function getReport(id: string): Promise<ReportRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as ReportRow | null) ?? null;
}
