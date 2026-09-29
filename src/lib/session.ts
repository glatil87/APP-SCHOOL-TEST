import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Profile } from "./people";
import { SCHOOL_ID } from "./school";
import { createClient } from "./supabase/server";

export type Membership = {
  role: "parent" | "coordinator";
  status: "pending" | "approved" | "removed";
};

export type Viewer = {
  userId: string;
  email: string;
  profile: Profile | null;
  membership: Membership | null;
};

/** The signed-in user with their profile and school membership, or null. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const [profile, membership] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, parent_first_name, child_first_name, avatar, avatar_path")
      .eq("user_id", data.user.id)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("role, status")
      .eq("school_id", SCHOOL_ID)
      .eq("user_id", data.user.id)
      .maybeSingle(),
  ]);

  return {
    userId: data.user.id,
    email: data.user.email ?? "",
    profile: profile.data,
    membership: membership.data,
  };
});

/** For pages only approved members may see. */
export async function requireMember(): Promise<Viewer & { membership: Membership; profile: Profile }> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.membership?.status !== "approved" || !viewer.profile) redirect("/waiting");
  return viewer as Viewer & { membership: Membership; profile: Profile };
}

export async function requireCoordinator() {
  const viewer = await requireMember();
  if (viewer.membership.role !== "coordinator") redirect("/");
  return viewer;
}
