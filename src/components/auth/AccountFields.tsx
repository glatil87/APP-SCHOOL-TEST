"use client";

import { AvatarPicker, Field, type FormState } from "@/components/forms";
import { MIN_PASSWORD } from "@/lib/validation";

/** Name, child's name, picture, optional phone, and (for new accounts) email + password. */
export function AccountFields({ state, withLogin }: { state?: FormState; withLogin: boolean }) {
  return (
    <>
      <Field label="Your first name" name="parent_first_name" autoComplete="given-name" required maxLength={40} state={state} />
      <Field
        label="Your child’s first name"
        name="child_first_name"
        required
        maxLength={40}
        hint="First name only. Other parents will see you as, e.g., “Sam (Mia’s parent)”."
        state={state}
      />
      <AvatarPicker state={state} />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        autoComplete="tel"
        optional
        hint="Only shared with another parent when you both agree a match, so you can arrange the handover."
        state={state}
      />
      {withLogin && (
        <>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            hint="Used to sign in, and shared only with a parent you agree a match with."
            state={state}
          />
          <Field
            label="Choose a password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            hint={`At least ${MIN_PASSWORD} characters.`}
            state={state}
          />
        </>
      )}
    </>
  );
}
