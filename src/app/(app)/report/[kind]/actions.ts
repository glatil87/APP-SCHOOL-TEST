"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/forms";
import type { ReportKind } from "@/lib/items";
import { parseReport } from "@/lib/reportValidation";
import { SCHOOL_ID } from "@/lib/school";
import { requireMember } from "@/lib/session";
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
