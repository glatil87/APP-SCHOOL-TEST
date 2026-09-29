export type Profile = {
  user_id: string;
  parent_first_name: string;
  child_first_name: string;
  avatar: string;
  avatar_path: string | null;
};

/** How a parent appears in the app, e.g. "Sam (Mia's parent)". */
export function displayName(p: Pick<Profile, "parent_first_name" | "child_first_name">): string {
  return `${p.parent_first_name} (${p.child_first_name}’s parent)`;
}
