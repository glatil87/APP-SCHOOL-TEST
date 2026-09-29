"use client";

import { useState } from "react";

/**
 * Runs a server action that returns the page to open next, then loads that
 * page fresh. (Soft navigations right after an action were sometimes cut off,
 * leaving the screen stuck; a full load is always reliable.)
 */
export function useGo() {
  const [busy, setBusy] = useState(false);
  const go = async (action: () => Promise<string>) => {
    setBusy(true);
    try {
      window.location.assign(await action());
    } catch {
      setBusy(false);
      alert("Something went wrong. Please check your connection and try again.");
    }
  };
  return [busy, go] as const;
}

type Tone = "accent" | "found" | "plain";

function toneClasses(tone: Tone) {
  return tone === "found" ? "bg-found text-white" : tone === "plain" ? "bg-fill text-text" : "bg-accent text-white";
}

/** A plain button for a server action (e.g. "Not a match"). */
export function ActionButton({
  action,
  label,
  tone = "plain",
  variant = "button",
}: {
  action: () => Promise<string>;
  label: string;
  tone?: Tone;
  variant?: "button" | "link";
}) {
  const [busy, go] = useGo();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => go(action)}
      className={
        variant === "link"
          ? "text-[15px] font-semibold text-accent disabled:opacity-60"
          : `w-full rounded-2xl px-5 py-3.5 text-[17px] font-semibold disabled:opacity-60 ${toneClasses(tone)}`
      }
    >
      {busy ? "Saving…" : label}
    </button>
  );
}

/**
 * A button that asks "Are you sure?" before running its action, for
 * decisions that matter (confirming a match, marking returned).
 */
export function TwoStepButton({
  action,
  label,
  confirmLabel,
  question,
  tone = "accent",
}: {
  action: () => Promise<string>;
  label: string;
  confirmLabel: string;
  question: string;
  tone?: Tone;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, go] = useGo();
  const colours = toneClasses(tone);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={`w-full rounded-2xl px-5 py-3.5 text-[17px] font-semibold ${colours}`}
      >
        {label}
      </button>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <p className="text-[15px] font-medium">{question}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => go(action)}
          className={`flex-1 rounded-2xl px-4 py-3 font-semibold disabled:opacity-60 ${colours}`}
        >
          {busy ? "Saving…" : confirmLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAsking(false)}
          className="flex-1 rounded-2xl bg-fill px-4 py-3 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
