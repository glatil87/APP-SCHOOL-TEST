"use server";

import { requireMember } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// All checks (who may act, both reports still open, same school) happen in
// the database functions. Each action returns the page to open next; the
// button then loads it fresh (see ActionButton), which proved more reliable
// than redirecting from inside the action.

function pairUrl(missingId: string, foundId: string, note: string) {
  return `/compare/${missingId}/${foundId}?note=${note}`;
}

export async function confirmMatch(missingId: string, foundId: string, score: number): Promise<string> {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_match", {
    p_missing: missingId,
    p_found: foundId,
    p_score: Math.max(0, Math.min(100, Math.round(score))),
  });
  if (error || typeof data !== "string") {
    return pairUrl(missingId, foundId, error?.code === "55000" ? "not-open" : "failed");
  }
  return `/matches/${data}?new=1`;
}

export async function dismissSuggestion(missingId: string, foundId: string, backTo: string): Promise<string> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("dismiss_suggestion", { p_missing: missingId, p_found: foundId });
  if (error) return pairUrl(missingId, foundId, "failed");
  return `${backTo.startsWith("/reports/") ? backTo : "/"}?dismissed=1`;
}

export async function undoDismiss(missingId: string, foundId: string): Promise<string> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("undo_dismiss", { p_missing: missingId, p_found: foundId });
  return pairUrl(missingId, foundId, error ? "failed" : "restored");
}
