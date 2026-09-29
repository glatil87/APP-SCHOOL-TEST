"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { SCHOOL_ID } from "@/lib/school";
import { requireCoordinator } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Status = "approved" | "removed";

/** Approve or remove a member. The database checks the caller is a coordinator. */
export async function setMemberStatus(userId: string, status: Status, role?: "parent" | "coordinator") {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_membership", {
    p_school: SCHOOL_ID,
    p_user: userId,
    p_status: status,
    ...(role ? { p_role: role } : {}),
  });
  if (error) throw new Error("Could not update this member. Please try again.");
  revalidatePath("/admin");
}

/** Form action for the Approve button (works even before the page finishes loading). */
export async function approveMember(userId: string) {
  await setMemberStatus(userId, "approved");
}

export type InviteState = { url?: string; error?: string };

export async function createInvite(_prev: InviteState, form: FormData): Promise<InviteState> {
  const label = String(form.get("label") ?? "").trim().slice(0, 80) || null;
  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("create_invite", { p_school: SCHOOL_ID, p_label: label });
  if (error || typeof code !== "string") return { error: "Could not create a link. Please try again." };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  revalidatePath("/admin");
  return { url: `${proto}://${host}/join/${code}` };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invite", { p_invite: inviteId });
  if (error) throw new Error("Could not switch off this link. Please try again.");
  revalidatePath("/admin");
}

export type ResetState = { password?: string; error?: string };

// Easy to read aloud or type: no 0/O, 1/l/I.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Give a member who forgot their password a temporary one to sign in with. */
export async function resetPassword(userId: string): Promise<ResetState> {
  const viewer = await requireCoordinator();
  if (userId === viewer.userId) return { error: "You can’t reset your own password here." };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("memberships")
    .select("user_id")
    .eq("school_id", SCHOOL_ID)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return { error: "Member not found." };

  const password = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""),
  ).join("-");
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: "Could not reset the password. Please try again." };
  return { password };
}
