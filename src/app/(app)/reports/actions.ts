"use server";

import { WHERE_NOW } from "@/lib/items";
import { getReport } from "@/lib/reports";
import { SCHOOL_ID } from "@/lib/school";
import { requireMember } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { todayInSchool } from "@/lib/reportValidation";

/**
 * "I found this" (on someone's missing item) or "This is mine" (on a found
 * item): adds the matching report for the viewer, copied from the original,
 * and confirms the match straight away so both parents see each other's
 * contact details. Returns the page to open next (see ActionButton).
 */
export async function claimReport(reportId: string, whereNow: string | null): Promise<string> {
  const viewer = await requireMember();
  const original = await getReport(reportId);
  if (!original || original.status !== "open") return `/reports/${reportId}?note=not-open`;
  if (original.reporter_id === viewer.userId) return `/reports/${reportId}?note=failed`;

  const kind = original.kind === "missing" ? "found" : "missing";
  if (kind === "found" && !(WHERE_NOW as readonly string[]).includes(whereNow ?? "")) {
    return `/reports/${reportId}?note=failed`;
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("reports")
    .insert({
      school_id: SCHOOL_ID,
      reporter_id: viewer.userId,
      kind,
      item_name: original.item_name,
      category: original.category,
      colour: original.colour,
      brand: original.brand,
      size: original.size,
      details: "",
      location: null,
      event_date: kind === "found" ? todayInSchool() : null,
      current_location: kind === "found" ? whereNow : null,
      quick_claim: true,
    })
    .select("id")
    .single();
  if (error || !created) return `/reports/${reportId}?note=failed`;

  const [missingId, foundId] = kind === "found" ? [original.id, created.id] : [created.id, original.id];
  const { data: matchId, error: matchError } = await supabase.rpc("confirm_match", {
    p_missing: missingId,
    p_found: foundId,
    p_score: 100,
  });
  if (matchError || typeof matchId !== "string") {
    // Tidy up: the new report was only needed for this match.
    await supabase.from("reports").delete().eq("id", created.id);
    return `/reports/${reportId}?note=${matchError?.code === "55000" ? "not-open" : "failed"}`;
  }
  return `/matches/${matchId}?new=1`;
}
