"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/forms";
import { isAvatarId } from "@/lib/avatars";
import { SCHOOL_ID } from "@/lib/school";
import { requireMember } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MIN_PASSWORD, parseAccountDetails } from "@/lib/validation";

const SAVED: FormState = { success: "Saved ✓" };
const TRY_AGAIN = "Something went wrong on our side. Please try again in a moment.";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Name, child's name and phone. */
export async function saveDetails(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireMember();
  const parsed = parseAccountDetails(form);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values: parsed.values };

  const supabase = await createClient();
  const profile = await supabase
    .from("profiles")
    .update({ parent_first_name: parsed.data.parentFirstName, child_first_name: parsed.data.childFirstName })
    .eq("user_id", viewer.userId);
  if (profile.error) return { error: TRY_AGAIN };

  const updated = await supabase
    .from("contact_details")
    .update({ phone: parsed.data.phone })
    .eq("user_id", viewer.userId)
    .select("user_id");
  if (updated.error) return { error: TRY_AGAIN };
  if (!updated.data.length && parsed.data.phone) {
    const inserted = await supabase.from("contact_details").insert({ user_id: viewer.userId, phone: parsed.data.phone });
    if (inserted.error) return { error: TRY_AGAIN };
  }

  revalidatePath("/", "layout");
  return SAVED;
}

/** Use a glass symbol (removes any uploaded photo). */
export async function chooseSymbol(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireMember();
  const avatar = form.get("avatar");
  if (!isAvatarId(avatar)) return { error: "Please choose a picture." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar, avatar_path: null })
    .eq("user_id", viewer.userId);
  if (error) return { error: TRY_AGAIN };
  await deletePhoto(viewer.profile.avatar_path);

  revalidatePath("/", "layout");
  return SAVED;
}

/** Upload a profile photo (already shrunk in the browser). */
export async function uploadPhoto(form: FormData): Promise<FormState> {
  const viewer = await requireMember();
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a photo." };
  if (!PHOTO_TYPES.includes(file.type)) return { error: "Please choose a JPEG, PNG or WebP photo." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "That photo is too large. Please choose a smaller one." };

  const supabase = await createClient();
  const path = `${viewer.userId}/${randomUUID()}.jpg`;
  const upload = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) return { error: TRY_AGAIN };

  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("user_id", viewer.userId);
  if (error) {
    await deletePhoto(path);
    return { error: TRY_AGAIN };
  }
  await deletePhoto(viewer.profile.avatar_path);

  revalidatePath("/", "layout");
  return { success: "Photo updated ✓" };
}

export async function removePhoto(): Promise<FormState> {
  const viewer = await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("user_id", viewer.userId);
  if (error) return { error: TRY_AGAIN };
  await deletePhoto(viewer.profile.avatar_path);
  revalidatePath("/", "layout");
  return { success: "Photo removed ✓" };
}

async function deletePhoto(path: string | null) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from("avatars").remove([path]);
}

/** Checks the current password (and refreshes the session). */
async function passwordIsCorrect(email: string, password: string): Promise<boolean> {
  if (!password) return false;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function changeEmail(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireMember();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("current_password") ?? "");
  const values = { email };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { fieldErrors: { email: "Please enter a valid email address." }, values };
  }
  if (email === viewer.email) return { fieldErrors: { email: "That’s already your email." }, values };
  if (!(await passwordIsCorrect(viewer.email, password))) {
    return { fieldErrors: { current_password: "That password isn’t right." }, values };
  }

  // Changed directly (no confirmation email): the app sends no emails.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(viewer.userId, { email, email_confirm: true });
  if (error) {
    return error.code === "email_exists"
      ? { fieldErrors: { email: "Another account already uses this email." }, values }
      : { error: TRY_AGAIN, values };
  }
  await passwordIsCorrect(email, password);

  revalidatePath("/account");
  return { success: "Email changed ✓ Use it next time you sign in." };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireMember();
  const current = String(form.get("current_password") ?? "");
  const next = String(form.get("new_password") ?? "");

  if (next.length < MIN_PASSWORD) {
    return { fieldErrors: { new_password: `Please choose a password with at least ${MIN_PASSWORD} characters.` } };
  }
  if (!(await passwordIsCorrect(viewer.email, current))) {
    return { fieldErrors: { current_password: "That password isn’t right." } };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(viewer.userId, { password: next });
  if (error) {
    return error.code === "weak_password"
      ? { fieldErrors: { new_password: "Please choose a longer or less common password." } }
      : { error: TRY_AGAIN };
  }
  await passwordIsCorrect(viewer.email, next);
  return { success: "Password changed ✓" };
}

/** Permanently deletes the account, profile, reports and photo. */
export async function deleteAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireMember();
  if (!(await passwordIsCorrect(viewer.email, String(form.get("current_password") ?? "")))) {
    return { fieldErrors: { current_password: "That password isn’t right." } };
  }

  const admin = createAdminClient();
  if (viewer.membership.role === "coordinator") {
    const { count } = await admin
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("school_id", SCHOOL_ID)
      .eq("role", "coordinator")
      .eq("status", "approved");
    if ((count ?? 0) <= 1) {
      return { error: "You’re the only coordinator, so your account can’t be deleted yet. Make another parent a coordinator first." };
    }
  }

  const { data: files } = await admin.storage.from("avatars").list(viewer.userId);
  if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${viewer.userId}/${f.name}`));

  const { error } = await admin.auth.admin.deleteUser(viewer.userId);
  if (error) return { error: TRY_AGAIN };

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in?deleted=1");
}
