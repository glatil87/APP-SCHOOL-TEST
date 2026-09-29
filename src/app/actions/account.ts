"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/forms";
import { findValidInvite } from "@/lib/invites";
import { SCHOOL_ID } from "@/lib/school";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseAccountDetails, parseNewAccount, parseSchoolName, type NewAccount } from "@/lib/validation";

const SOMETHING_WENT_WRONG = "Something went wrong on our side. Please try again in a moment.";

/** Only allow redirects within this app. */
function safeNext(value: FormDataEntryValue | null): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) {
    return { error: "Please enter your email and password.", values: { email } };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? "That email and password don’t match. Please check and try again."
          : SOMETHING_WENT_WRONG,
      values: { email },
    };
  }
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/**
 * Creates the account (already confirmed: no emails are sent), signs the
 * person in, and saves their profile. Returns an error message on failure.
 */
async function createAccount(account: NewAccount): Promise<string | null> {
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
  });
  if (created.error) {
    return created.error.code === "email_exists"
      ? "There’s already an account with this email. Please sign in instead."
      : created.error.code === "weak_password"
        ? "Please choose a longer or less common password."
        : SOMETHING_WENT_WRONG;
  }

  const supabase = await createClient();
  const signedIn = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
  if (signedIn.error) return SOMETHING_WENT_WRONG;

  return saveDetails(account);
}

async function saveDetails(details: Omit<NewAccount, "email" | "password">): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return SOMETHING_WENT_WRONG;

  const profile = await supabase.from("profiles").insert({
    user_id: data.user.id,
    parent_first_name: details.parentFirstName,
    child_first_name: details.childFirstName,
    avatar: details.avatar,
  });
  if (profile.error && profile.error.code !== "23505") return SOMETHING_WENT_WRONG;

  if (details.phone) {
    const contact = await supabase.from("contact_details").insert({ user_id: data.user.id, phone: details.phone });
    if (contact.error && contact.error.code !== "23505") return SOMETHING_WENT_WRONG;
  }
  return null;
}

/** New parent opening an invite link: create account, then ask to join. */
export async function joinWithNewAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get("code") ?? "");
  if (!(await findValidInvite(code))) {
    return { error: "This invite link is not valid any more. Please ask for a new one." };
  }
  const parsed = parseNewAccount(form);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values: parsed.values };

  const error = await createAccount(parsed.data);
  if (error) return { error, values: { ...Object.fromEntries(form), password: "" } as Record<string, string> };

  return requestToJoin(code);
}

/** Someone already signed in opening an invite link. */
export async function joinAsSignedIn(_prev: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get("code") ?? "");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/sign-in?next=/join/${encodeURIComponent(code)}`);
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!existing) {
    const parsed = parseAccountDetails(form);
    if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values: parsed.values };
    const error = await saveDetails(parsed.data);
    if (error) return { error };
  }
  return requestToJoin(code);
}

async function requestToJoin(code: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_school", { p_code: code });
  if (error) {
    return {
      error: error.code === "P0002" ? "This invite link is not valid any more. Please ask for a new one." : SOMETHING_WENT_WRONG,
    };
  }
  redirect("/waiting");
}

async function schoolHasCoordinator(): Promise<boolean> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("school_id", SCHOOL_ID)
    .eq("role", "coordinator")
    .eq("status", "approved");
  return (count ?? 0) > 0;
}

export async function isSetUp(): Promise<boolean> {
  return schoolHasCoordinator();
}

/**
 * First-time setup: the first person creates their account, names the school
 * and becomes its coordinator. Closed as soon as a coordinator exists.
 */
export async function setUpSchool(_prev: FormState, form: FormData): Promise<FormState> {
  if (await schoolHasCoordinator()) {
    return { error: "This app has already been set up. Please sign in." };
  }
  const schoolName = parseSchoolName(form);
  const parsed = parseNewAccount(form);
  if (!parsed.ok || !schoolName) {
    return {
      fieldErrors: {
        ...(parsed.ok ? {} : parsed.fieldErrors),
        ...(schoolName ? {} : { school_name: "Please enter the school’s name." }),
      },
      values: { ...(parsed.ok ? {} : parsed.values), school_name: String(form.get("school_name") ?? "") },
    };
  }

  const error = await createAccount(parsed.data);
  if (error) return { error };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const admin = createAdminClient();
  // Re-check just before granting, in case two people raced to set up.
  if (!data.user || (await schoolHasCoordinator())) return { error: "This app has already been set up. Please sign in." };
  const [bootstrap, rename] = await Promise.all([
    admin.rpc("bootstrap_coordinator", { p_school: SCHOOL_ID, p_user: data.user.id }),
    admin.from("schools").update({ name: schoolName }).eq("id", SCHOOL_ID),
  ]);
  if (bootstrap.error || rename.error) return { error: SOMETHING_WENT_WRONG };

  redirect("/admin?welcome=1");
}
