"use client";

import { useId, useState } from "react";
import { WHERE_NOW, type ReportKind } from "@/lib/items";
import { useGo } from "./TwoStepButton";

/**
 * "I found this" on someone's missing item, or "This is mine" on a found
 * item. Asks once to be sure (and, for found items, where the item is now),
 * then confirms the match so the two parents can arrange the handover.
 */
export function ClaimButton({
  kind,
  itemName,
  action,
}: {
  /** The kind of the report being viewed. */
  kind: ReportKind;
  itemName: string;
  action: (whereNow: string | null) => Promise<string>;
}) {
  const [asking, setAsking] = useState(false);
  const [whereNow, setWhereNow] = useState<string | null>(null);
  const [busy, go] = useGo();
  const id = useId();
  const iFoundIt = kind === "missing";

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="w-full rounded-2xl bg-found px-5 py-3.5 text-[17px] font-semibold text-white"
      >
        {iFoundIt ? "I found this" : "This is mine"}
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <p className="text-[15px] font-medium">
        {iFoundIt
          ? `Great! You and the parent who lost the ${itemName} will see each other’s contact details to arrange the handover.`
          : `Great! You and the parent who found the ${itemName} will see each other’s contact details to arrange the handover.`}
      </p>
      {iFoundIt && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-[15px] font-semibold">Where is it now?</legend>
          {WHERE_NOW.map((w, i) => (
            <label
              key={w}
              htmlFor={`${id}-${i}`}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[15px] ${
                whereNow === w ? "bg-found-soft font-semibold text-found" : "bg-fill"
              }`}
            >
              <input
                id={`${id}-${i}`}
                type="radio"
                name={`${id}-where`}
                value={w}
                checked={whereNow === w}
                onChange={() => setWhereNow(w)}
                className="accent-[var(--found)]"
              />
              {w}
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || (iFoundIt && !whereNow)}
          onClick={() => go(() => action(whereNow))}
          className="flex-1 rounded-2xl bg-found px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : iFoundIt ? "Yes, I found it" : "Yes, it’s mine"}
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
