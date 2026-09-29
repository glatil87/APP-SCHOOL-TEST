"use client";

import { useFormStatus } from "react-dom";
import { AVATARS, type AvatarId } from "@/lib/avatars";

/** Result of a form's server action: field errors and/or a general message. */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export function Field({
  label,
  name,
  hint,
  state,
  optional,
  ...input
}: {
  label: string;
  name: string;
  hint?: string;
  state?: FormState;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = state?.fieldErrors?.[name];
  const id = `f-${name}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[15px] font-medium">
        {label}
        {optional && <span className="font-normal text-text-2"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={state?.values?.[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-xl bg-card px-4 py-3 text-[17px] shadow-[inset_0_0_0_1px_var(--line)] placeholder:text-text-2 focus:outline-2 focus:outline-accent ${
          error ? "shadow-[inset_0_0_0_1.5px_var(--missing)]" : ""
        }`}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[13px] font-medium text-missing">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-text-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-accent px-5 py-3.5 text-[17px] font-semibold text-white active:bg-accent-press disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormError({ state }: { state?: FormState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="rounded-2xl bg-missing-soft px-4 py-3 text-[15px] font-medium text-missing">
      {state.error}
    </p>
  );
}

export function AvatarPicker({ state, defaultValue = "fox" }: { state?: FormState; defaultValue?: AvatarId }) {
  const selected = state?.values?.avatar ?? defaultValue;
  return (
    <fieldset className="space-y-2">
      <legend className="text-[15px] font-medium">Choose your picture</legend>
      <div className="grid grid-cols-6 gap-2">
        {Object.entries(AVATARS).map(([id, emoji]) => (
          <label key={id} className="cursor-pointer">
            <input type="radio" name="avatar" value={id} defaultChecked={id === selected} className="peer sr-only" />
            <span
              className="grid aspect-square place-items-center rounded-2xl bg-card text-2xl shadow-[inset_0_0_0_1px_var(--line)] peer-checked:bg-accent/15 peer-checked:shadow-[inset_0_0_0_2px_var(--accent)] peer-focus-visible:outline-2 peer-focus-visible:outline-accent"
              aria-label={id}
            >
              {emoji}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
