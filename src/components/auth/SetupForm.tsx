"use client";

import { useActionState } from "react";
import { setUpSchool } from "@/app/actions/account";
import { Field, FormError, SubmitButton, type FormState } from "@/components/forms";
import { AccountFields } from "./AccountFields";

export function SetupForm() {
  const [state, action] = useActionState<FormState, FormData>(setUpSchool, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError state={state} />
      <Field label="School name" name="school_name" required maxLength={120} placeholder="e.g. Oakfield Primary" state={state} />
      <AccountFields state={state} withLogin />
      <SubmitButton pendingText="Setting up…">Set up the app</SubmitButton>
    </form>
  );
}
