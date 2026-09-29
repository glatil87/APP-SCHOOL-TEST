"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/account";
import { Field, FormError, SubmitButton, type FormState } from "@/components/forms";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError state={state} />
      <input type="hidden" name="next" value={next ?? "/"} />
      <Field label="Email" name="email" type="email" autoComplete="email" required state={state} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required state={state} />
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
