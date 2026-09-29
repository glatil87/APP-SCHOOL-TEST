import "server-only";
import { createClient } from "./supabase/server";

/**
 * Short-lived links to profile photos the viewer is allowed to see (the
 * storage rules decide). Photos are never publicly reachable.
 */
export async function avatarPhotoUrls(profiles: { user_id: string; avatar_path: string | null }[]) {
  const withPhoto = profiles.filter((p) => p.avatar_path);
  const urls = new Map<string, string>();
  if (!withPhoto.length) return urls;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("avatars").createSignedUrls(
    withPhoto.map((p) => p.avatar_path!),
    60 * 60,
  );
  data?.forEach((d, i) => {
    if (d.signedUrl) urls.set(withPhoto[i].user_id, d.signedUrl);
  });
  return urls;
}
