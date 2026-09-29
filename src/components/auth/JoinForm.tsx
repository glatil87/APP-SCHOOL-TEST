"use client";

import { useActionState } from "react";
import { joinAsSignedIn, joinWithNewAccount } from "@/app/actions/account";
import { FormError, SubmitButton, type FormState } from "@/components/forms";
import { AccountFields } from "./AccountFields";

/** `needsDetails`: signed-in person who has no profile yet. */
export function JoinForm({ code, signedIn, needsDetails }: { code: string; signedIn: boolean; needsDetails: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(signedIn ? joinAsSignedIn : joinWithNewAccount, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError state={state} />
      <input type="hidden" name="code" value={code} />
      {(!signedIn || needsDetails) && <AccountFields state={state} withLogin={!signedIn} />}
      <SubmitButton pendingText="Sending…">Ask to join</SubmitButton>
    </form>
  );
}
