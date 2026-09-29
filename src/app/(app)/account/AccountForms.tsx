"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/Avatar";
import { AvatarPicker, Field, FormError, FormSuccess, SubmitButton, type FormState } from "@/components/forms";
import type { AvatarId } from "@/lib/avatars";
import { MIN_PASSWORD } from "@/lib/validation";
import {
  changeEmail,
  changePassword,
  chooseSymbol,
  deleteAccount,
  removePhoto,
  saveDetails,
  uploadPhoto,
} from "./actions";

export function DetailsForm({ parent, child, phone }: { parent: string; child: string; phone: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveDetails, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormSuccess state={state} />
      <FormError state={state} />
      <Field label="Your first name" name="parent_first_name" defaultValue={parent} required maxLength={40} state={state} />
      <Field label="Your child’s first name" name="child_first_name" defaultValue={child} required maxLength={40} state={state} />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={phone}
        optional
        hint="Only shared with another parent when you both agree a match."
        state={state}
      />
      <SubmitButton pendingText="Saving…">Save details</SubmitButton>
    </form>
  );
}

/** Shrinks a photo to at most 512px and re-encodes it as JPEG (drops location data). */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

export function PictureForms({
  avatar,
  photoUrl,
}: {
  avatar: string;
  photoUrl: string | null;
}) {
  const [symbolState, symbolAction] = useActionState<FormState, FormData>(chooseSymbol, {});
  const [photoState, setPhotoState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    start(async () => {
      try {
        const small = await shrinkPhoto(file);
        const form = new FormData();
        form.set("photo", new File([small], "photo.jpg", { type: "image/jpeg" }));
        setPhotoState(await uploadPhoto(form));
      } catch {
        setPhotoState({ error: "We couldn’t read that photo. Please try a different one." });
      } finally {
        if (fileInput.current) fileInput.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <FormSuccess state={photoState} />
        <FormError state={photoState} />
        <div className="flex items-center gap-4">
          <Avatar avatar={avatar} photoUrl={photoUrl} size={64} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => fileInput.current?.click()}
              className="rounded-full bg-accent px-4 py-2 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Uploading…" : photoUrl ? "Change photo" : "Upload a photo"}
            </button>
            {photoUrl && (
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => setPhotoState(await removePhoto()))}
                className="rounded-full bg-fill px-4 py-2 text-[15px] font-semibold disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Upload a photo"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <p className="text-[13px] text-text-2">
          Please use a photo of yourself, not your child. Other approved parents at the school can see it.
        </p>
      </div>

      <form action={symbolAction} className="space-y-3">
        <FormSuccess state={symbolState} />
        <FormError state={symbolState} />
        <AvatarPicker defaultValue={(photoUrl ? undefined : avatar) as AvatarId | undefined} />
        <SubmitButton pendingText="Saving…">{photoUrl ? "Use this symbol instead" : "Save picture"}</SubmitButton>
      </form>
    </div>
  );
}

export function EmailForm({ email }: { email: string }) {
  const [state, action] = useActionState<FormState, FormData>(changeEmail, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormSuccess state={state} />
      <FormError state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={email} required state={state} />
      <Field
        label="Current password"
        name="current_password"
        type="password"
        autoComplete="current-password"
        required
        hint="To keep your account safe."
        state={state}
      />
      <SubmitButton pendingText="Saving…">Change email</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormSuccess state={state} />
      <FormError state={state} />
      <Field label="Current password" name="current_password" type="password" autoComplete="current-password" required state={state} />
      <Field
        label="New password"
        name="new_password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        required
        hint={`At least ${MIN_PASSWORD} characters.`}
        state={state}
      />
      <SubmitButton pendingText="Saving…">Change password</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(deleteAccount, {});
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[15px] font-semibold text-missing">
        Delete my account…
      </button>
    );
  }
  return (
    <form action={action} className="space-y-4 rounded-2xl bg-missing-soft p-4" noValidate>
      <p className="text-[15px]">
        This permanently deletes your account, your reports and your photo. It can’t be undone.
      </p>
      <FormError state={state} />
      <Field label="Current password" name="current_password" type="password" autoComplete="current-password" required state={state} />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-2xl bg-missing px-4 py-3 font-semibold text-white">
          Delete permanently
        </button>
        <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-2xl bg-card px-4 py-3 font-semibold">
          Cancel
        </button>
      </div>
    </form>
  );
}
