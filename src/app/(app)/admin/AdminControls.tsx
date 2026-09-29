"use client";

import { useActionState, useState, useTransition } from "react";
import { SubmitButton } from "@/components/forms";
import { createInvite, resetPassword, setMemberStatus, revokeInvite, type InviteState, type ResetState } from "./actions";

const smallButton = "rounded-full px-4 py-1.5 text-[15px] font-semibold disabled:opacity-50";

export function ApproveButtons({ userId, name }: { userId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <button
        className={`${smallButton} bg-accent text-white`}
        disabled={pending}
        onClick={() => start(() => setMemberStatus(userId, "approved"))}
      >
        Approve
      </button>
      <button
        className={`${smallButton} bg-fill text-text`}
        disabled={pending}
        onClick={() => {
          if (confirm(`Decline ${name}? They won’t be able to see anything.`)) start(() => setMemberStatus(userId, "removed"));
        }}
      >
        Decline
      </button>
    </div>
  );
}

export function MemberActions({ userId, name, removed }: { userId: string; name: string; removed: boolean }) {
  const [pending, start] = useTransition();
  const [reset, setReset] = useState<ResetState>({});
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {removed ? (
          <button
            className={`${smallButton} bg-fill text-text`}
            disabled={pending}
            onClick={() => start(() => setMemberStatus(userId, "approved"))}
          >
            Restore access
          </button>
        ) : (
          <>
            <button
              className={`${smallButton} bg-fill text-text`}
              disabled={pending}
              onClick={() => {
                if (confirm(`Give ${name} a temporary password? Their old password will stop working.`)) {
                  start(async () => setReset(await resetPassword(userId)));
                }
              }}
            >
              Reset password
            </button>
            <button
              className={`${smallButton} bg-fill text-missing`}
              disabled={pending}
              onClick={() => {
                if (confirm(`Remove ${name}? They will lose access straight away.`)) start(() => setMemberStatus(userId, "removed"));
              }}
            >
              Remove
            </button>
          </>
        )}
      </div>
      {reset.password && (
        <p className="rounded-xl bg-found-soft px-3 py-2 text-[15px]">
          Temporary password: <strong className="font-mono select-all">{reset.password}</strong>
          <br />
          <span className="text-text-2">Pass it on to {name} privately. It’s only shown once.</span>
        </p>
      )}
      {reset.error && <p className="text-[13px] text-missing">{reset.error}</p>}
    </div>
  );
}

export function CreateInvite() {
  const [state, action] = useActionState<InviteState, FormData>(createInvite, {});
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-3">
      <form action={action} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="block text-[15px] font-medium">
            Label <span className="font-normal text-text-2">(optional, e.g. “Year 3 WhatsApp”)</span>
          </span>
          <input
            name="label"
            maxLength={80}
            className="w-full rounded-xl bg-card px-4 py-3 text-[17px] shadow-[inset_0_0_0_1px_var(--line)] focus:outline-2 focus:outline-accent"
          />
        </label>
        <SubmitButton pendingText="Creating…">Create invite link</SubmitButton>
      </form>
      {state.error && <p className="text-[15px] text-missing">{state.error}</p>}
      {state.url && (
        <div className="space-y-3 rounded-2xl bg-found-soft p-4">
          <p className="text-[15px] font-medium">Your new invite link — copy it now, it’s only shown once:</p>
          <p className="font-mono text-[13px] break-all select-all">{state.url}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`${smallButton} bg-accent text-white`}
              onClick={async () => {
                await navigator.clipboard.writeText(state.url!);
                setCopied(true);
              }}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                className={`${smallButton} bg-card text-accent`}
                onClick={() =>
                  navigator.share({ title: "School Lost & Found", text: "Join our school’s Lost & Found:", url: state.url })
                }
              >
                Share…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RevokeInvite({ inviteId }: { inviteId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className={`${smallButton} bg-fill text-missing`}
      disabled={pending}
      onClick={() => {
        if (confirm("Switch off this link? Nobody new will be able to join with it.")) start(() => revokeInvite(inviteId));
      }}
    >
      Switch off
    </button>
  );
}
