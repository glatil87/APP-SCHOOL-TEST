"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Field, FormError, SubmitButton, type FormState } from "@/components/forms";
import { GlassIcon } from "@/components/glass";
import { CATEGORIES, COLOUR_SWATCH, COLOURS, PLACES, WHERE_NOW, type ReportKind } from "@/lib/items";
import { createReport, updateReport } from "./actions";

const card = "space-y-4 rounded-3xl bg-card p-5";

/**
 * Form for a new report, or for editing one (`editing` holds the report's
 * current values and photo).
 */
export function ReportForm({
  kind,
  today,
  editing,
}: {
  kind: ReportKind;
  today: string;
  editing?: { id: string; values: Record<string, string>; photoUrl: string | null };
}) {
  const [actionState, action] = useActionState<FormState, FormData>(
    editing ? updateReport.bind(null, editing.id, kind) : createReport.bind(null, kind),
    {},
  );
  // Before the first submit, show the report's current values when editing.
  const state: FormState = { ...actionState, values: actionState.values ?? editing?.values };
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};
  const missing = kind === "missing";

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError state={state} />

      <section className={card}>
        <SectionTitle>What is it?</SectionTitle>
        <Field
          label="Item"
          name="item_name"
          placeholder={missing ? "e.g. School jumper" : "e.g. Blue water bottle"}
          maxLength={80}
          required
          state={state}
        />
        <ChoiceGroup label="Type of item" name="category" error={err.category}>
          {CATEGORIES.map((c) => (
            <Pill key={c} name="category" value={c} defaultChecked={v.category === c} />
          ))}
        </ChoiceGroup>
        <ChoiceGroup label="Main colour" name="colour" error={err.colour}>
          {COLOURS.map((c) => (
            <Pill key={c} name="colour" value={c} defaultChecked={v.colour === c} swatch={COLOUR_SWATCH[c]} />
          ))}
        </ChoiceGroup>
      </section>

      <section className={card}>
        <SectionTitle>Details that help</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand" name="brand" optional placeholder="e.g. Nike" maxLength={60} state={state} />
          <Field label="Size" name="size" optional placeholder="e.g. Age 7–8" maxLength={30} state={state} />
        </div>
        <TextArea
          label="Anything that stands out"
          name="details"
          defaultValue={v.details}
          error={err.details}
          placeholder="e.g. name label inside, dinosaur sticker, scratched lid"
          hint="Name labels, stickers, marks or damage make a match much easier to spot."
        />
      </section>

      <section className={card}>
        <SectionTitle>{missing ? "Where and when was it last seen?" : "Where and when did you find it?"}</SectionTitle>
        <Field
          label={missing ? "Place" : "Place found"}
          name="location"
          list="places"
          placeholder="e.g. Playground"
          maxLength={120}
          required={!missing}
          optional={missing}
          hint={missing ? "Leave blank if you’re not sure." : undefined}
          state={state}
        />
        <datalist id="places">
          {PLACES.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <Field
          label={missing ? "Date" : "Date found"}
          name="event_date"
          type="date"
          max={today}
          defaultValue={missing ? "" : today}
          required={!missing}
          optional={missing}
          hint={missing ? "Roughly is fine." : undefined}
          state={state}
        />
        {!missing && <WhereNow defaultValue={v.current_location} error={err.current_location} />}
      </section>

      <section className={card}>
        <SectionTitle>Photo</SectionTitle>
        <PhotoPicker resetKey={actionState} existingUrl={editing?.photoUrl ?? null} />
      </section>

      <SubmitButton pendingText={editing ? "Saving…" : "Sending…"}>
        {editing ? "Save changes" : missing ? "Report missing item" : "Report found item"}
      </SubmitButton>
      <p className="text-center text-[13px] text-text-2">
        Only approved parents at your school can see reports.
      </p>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[17px] font-semibold">{children}</h2>;
}

function ChoiceGroup({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-2" aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-2 text-[15px] font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {error && (
        <p id={`${name}-error`} className="text-[13px] font-medium text-missing">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Pill({
  name,
  value,
  defaultChecked,
  swatch,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  swatch?: string;
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex items-center gap-2 rounded-full bg-fill px-3.5 py-2 text-[15px] font-medium transition peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
        {swatch && (
          <span
            aria-hidden="true"
            className="size-4 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]"
            style={{ background: swatch }}
          />
        )}
        {value}
      </span>
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  error,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
  hint?: string;
}) {
  const id = `ta-${useId().replace(/:/g, "")}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[15px] font-medium">
        {label} <span className="font-normal text-text-2">(optional)</span>
      </label>
      <textarea
        id={id}
        name={name}
        rows={3}
        maxLength={1000}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-xl bg-card px-4 py-3 text-[17px] shadow-[inset_0_0_0_1px_var(--line)] placeholder:text-text-2 focus:outline-2 focus:outline-accent"
      />
      {error ? (
        <p className="text-[13px] font-medium text-missing">{error}</p>
      ) : (
        hint && <p className="text-[13px] text-text-2">{hint}</p>
      )}
    </div>
  );
}

/** Found items: where is it now? Three common answers, or type your own. */
function WhereNow({ defaultValue, error }: { defaultValue?: string; error?: string }) {
  const preset = (WHERE_NOW as readonly string[]).includes(defaultValue ?? "");
  const [choice, setChoice] = useState(preset || !defaultValue ? (defaultValue ?? WHERE_NOW[0]) : "other");
  const [other, setOther] = useState(preset ? "" : (defaultValue ?? ""));
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-[15px] font-medium">Where is it now?</legend>
      <input type="hidden" name="current_location" value={choice === "other" ? other : choice} />
      <div className="flex flex-wrap gap-2">
        {[...WHERE_NOW, "other"].map((opt) => (
          <label key={opt} className="cursor-pointer">
            <input
              type="radio"
              name="where_now_choice"
              value={opt}
              checked={choice === opt}
              onChange={() => setChoice(opt)}
              className="peer sr-only"
            />
            <span className="block rounded-full bg-fill px-3.5 py-2 text-[15px] font-medium peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              {opt === "other" ? "Somewhere else" : opt}
            </span>
          </label>
        ))}
      </div>
      {choice === "other" && (
        <input
          aria-label="Where is it now?"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          maxLength={120}
          placeholder="e.g. With Mrs Smith in Year 2"
          className="w-full rounded-xl bg-card px-4 py-3 text-[17px] shadow-[inset_0_0_0_1px_var(--line)] placeholder:text-text-2 focus:outline-2 focus:outline-accent"
        />
      )}
      {error && <p className="text-[13px] font-medium text-missing">{error}</p>}
    </fieldset>
  );
}

/** Shrinks a photo to at most 1280px and re-encodes it as JPEG (drops location data). */
async function shrinkPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
  return new File([blob], "item.jpg", { type: "image/jpeg" });
}

function PhotoPicker({ resetKey, existingUrl }: { resetKey: unknown; existingUrl: string | null }) {
  const picker = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // Editing: the report's current photo, until replaced or removed.
  const [keepExisting, setKeepExisting] = useState(!!existingUrl);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Put the shrunk photo into the (hidden) file field the form sends. Re-done
  // after each submit, because the browser clears file fields when a form resets.
  useEffect(() => {
    if (!upload.current) return;
    const dt = new DataTransfer();
    if (photo) dt.items.add(photo);
    upload.current.files = dt.files;
  }, [photo, resetKey]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setProblem(null);
    try {
      const small = await shrinkPhoto(file);
      setPhoto(small);
      setPreview(URL.createObjectURL(small));
      setKeepExisting(false);
    } catch {
      setProblem("We couldn’t read that photo. Please try a different one.");
    } finally {
      setBusy(false);
      if (picker.current) picker.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-3 rounded-2xl bg-missing-soft px-4 py-3 text-[15px] text-missing">
        <GlassIcon glyph="lock" tone="orange" size={28} />
        <span>
          <strong>Photograph the item only.</strong> Please make sure no children appear in the photo.
        </span>
      </p>
      <input ref={upload} type="file" name="photo" className="hidden" tabIndex={-1} aria-hidden="true" />
      {existingUrl && !keepExisting && !photo && <input type="hidden" name="remove_photo" value="1" />}
      <input
        ref={picker}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Add a photo of the item"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {preview || (keepExisting && existingUrl) ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview or signed URL */}
          <img src={preview ?? existingUrl!} alt="Photo of the item" className="size-24 rounded-2xl object-cover" />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => picker.current?.click()} className="text-[15px] font-semibold text-accent">
              Change photo
            </button>
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setPreview(null);
                setKeepExisting(false);
              }}
              className="text-[15px] font-semibold text-missing"
            >
              Remove photo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => picker.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-line px-4 py-6 text-[15px] font-semibold text-accent disabled:opacity-60"
        >
          {busy ? "Preparing photo…" : "＋ Add a photo (optional)"}
        </button>
      )}
      {problem && <p className="text-[13px] font-medium text-missing">{problem}</p>}
    </div>
  );
}
