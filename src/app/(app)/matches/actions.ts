"use server";

import { requireMember } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// The database checks the caller is one of the two parents (or a coordinator).
// Actions return the page to open next (see ActionButton).

export async function markReturned(matchId: string): Promise<string> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_returned", { p_match: matchId });
  return error ? `/matches/${matchId}?note=failed` : `/matches/${matchId}?returned=1`;
}

export async function unconfirmMatch(matchId: string, backTo: string): Promise<string> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("unconfirm_match", { p_match: matchId });
  if (error) return `/matches/${matchId}?note=failed`;
  return backTo.startsWith("/reports/") ? `${backTo}?reopened=1` : "/";
}
