"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/forms";
import type { ReportKind } from "@/lib/items";
import { parseReport } from "@/lib/reportValidation";
import { SCHOOL_ID } from "@/lib/school";
import { getReport } from "@/lib/reports";
import { requireMember } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function createReport(kind: ReportKind, _prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireMember();
  const parsed = parseReport(form, kind);
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors, values: parsed.values, error: "Please check the highlighted fields." };
  }
  const r = parsed.data;
  const supabase = await createClient();

  // Optional photo (already shrunk and stripped of location data in the browser).
  let photoPath: string | null = null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!PHOTO_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_BYTES) {
      return { values: parsed.values, error: "That photo couldn’t be used. Please try a different one, or send the report without a photo." };
    }
    photoPath = `${SCHOOL_ID}/${viewer.userId}/${randomUUID()}.jpg`;
    const upload = await supabase.storage.from("report-photos").upload(photoPath, photo, { contentType: photo.type });
    if (upload.error) {
      return { values: parsed.values, error: "The photo didn’t upload. Please try again, or send the report without a photo." };
    }
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      school_id: SCHOOL_ID,
      reporter_id: viewer.userId,
      kind,
      item_name: r.itemName,
      category: r.category,
      colour: r.colour,
      brand: r.brand,
      size: r.size,
      details: r.details,
      location: r.location,
      event_date: r.eventDate,
      current_location: r.currentLocation,
      photo_path: photoPath,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (photoPath) await supabase.storage.from("report-photos").remove([photoPath]);
    return { values: parsed.values, error: "Something went wrong on our side. Please try again in a moment." };
  }

  revalidatePath("/", "layout");
  redirect(`/reports/${data.id}?new=1`);
}

/** Edit your own open report (optionally replacing or removing its photo). */
export async function updateReport(
  reportId: string,
  kind: ReportKind,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const viewer = await requireMember();
  const existing = await getReport(reportId);
  if (!existing || existing.reporter_id !== viewer.userId || existing.status !== "open") {
    return { error: "This report can’t be edited any more." };
  }
  const parsed = parseReport(form, kind);
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors, values: parsed.values, error: "Please check the highlighted fields." };
  }
  const r = parsed.data;
  const supabase = await createClient();

  let photoPath = existing.photo_path;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!PHOTO_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_BYTES) {
      return { values: parsed.values, error: "That photo couldn’t be used. Please try a different one." };
    }
    photoPath = `${SCHOOL_ID}/${viewer.userId}/${randomUUID()}.jpg`;
    const upload = await supabase.storage.from("report-photos").upload(photoPath, photo, { contentType: photo.type });
    if (upload.error) return { values: parsed.values, error: "The photo didn’t upload. Please try again." };
  } else if (form.get("remove_photo") === "1") {
    photoPath = null;
  }

  const { error } = await supabase
    .from("reports")
    .update({
      item_name: r.itemName,
      category: r.category,
      colour: r.colour,
      brand: r.brand,
      size: r.size,
      details: r.details,
      location: r.location,
      event_date: r.eventDate,
      current_location: r.currentLocation,
      photo_path: photoPath,
    })
    .eq("id", reportId);
  if (error) {
    if (photoPath && photoPath !== existing.photo_path) await supabase.storage.from("report-photos").remove([photoPath]);
    return { values: parsed.values, error: "Something went wrong on our side. Please try again in a moment." };
  }
  if (existing.photo_path && existing.photo_path !== photoPath) {
    await supabase.storage.from("report-photos").remove([existing.photo_path]);
  }
  redirect(`/reports/${reportId}?updated=1`);
}

/** "It turned up" / "I no longer need this": hides your own open report. */
export async function withdrawReport(reportId: string): Promise<string> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_report", { p_report: reportId });
  return error ? `/reports/${reportId}?note=failed` : "/?withdrawn=1";
}

/** Coordinator: remove any report (and its photo), e.g. if it's unsuitable. */
export async function removeReport(reportId: string): Promise<string> {
  const viewer = await requireMember();
  if (viewer.membership.role !== "coordinator") return `/reports/${reportId}?note=failed`;
  const report = await getReport(reportId);
  const supabase = await createClient();
  // The database lets coordinators delete any report in their school.
  const { data, error } = await supabase.from("reports").delete().eq("id", reportId).select("id");
  if (error || !data?.length) return `/reports/${reportId}?note=failed`;
  if (report?.photo_path) {
    await createAdminClient().storage.from("report-photos").remove([report.photo_path]);
  }
  return `/${report?.kind === "found" ? "found" : "missing"}?removed=1`;
}
