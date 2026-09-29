import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GlassIcon } from "@/components/glass";
import { ReportFacts } from "@/components/ReportFacts";
import { ActionButton, TwoStepButton } from "@/components/TwoStepButton";
import { decisionForPair, loadPair } from "@/lib/matches";
import { requireMember } from "@/lib/session";
import { confirmMatch, dismissSuggestion, undoDismiss } from "../../actions";

export const metadata = { title: "Compare · School Lost & Found" };

const NOTES: Record<string, string> = {
  "not-open": "One of these items has already been matched or closed, so this pair can’t be confirmed.",
  failed: "Something went wrong on our side. Please try again in a moment.",
};

export default async function ComparePage({ params, searchParams }: PageProps<"/compare/[missing]/[found]">) {
  const viewer = await requireMember();
  const { missing: missingId, found: foundId } = await params;
  const { note, from } = await searchParams;
  const pair = await loadPair(missingId, foundId);
  if (!pair) notFound();
  const { missing, found, result, photos } = pair;

  const decision = await decisionForPair(missing.id, found.id);
  if (decision && decision.status !== "dismissed") redirect(`/matches/${decision.id}`);

  const isParty = viewer.userId === missing.reporter_id || viewer.userId === found.reporter_id;
  const canDecide = isParty || viewer.membership.role === "coordinator";
  const bothOpen = missing.status === "open" && found.status === "open";
  const mineId = viewer.userId === missing.reporter_id ? missing.id : viewer.userId === found.reporter_id ? found.id : missing.id;
  const backTo = typeof from === "string" && from.startsWith("/reports/") ? from : `/reports/${mineId}`;

  return (
    <div className="space-y-6">
      <Link href={backTo} className="text-[17px] text-accent">
        ‹ Back
      </Link>

      <header className="space-y-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Could this be the same item?</h1>
        <p className="text-text-2">
          This is only a suggestion based on the details parents gave. Only the two parents can tell for sure.
        </p>
      </header>

      {note === "restored" && (
        <p role="status" className="rounded-2xl bg-found-soft px-4 py-3 text-[15px] font-medium text-found">
          Done — this pair is a suggestion again.
        </p>
      )}
      {typeof note === "string" && NOTES[note] && (
        <p role="alert" className="rounded-2xl bg-missing-soft px-4 py-3 text-[15px] font-medium text-missing">
          {NOTES[note]}
        </p>
      )}

      <div className="space-y-3">
        <ReportFacts report={missing} photoUrl={photos.get(missing.id)} />
        <ReportFacts report={found} photoUrl={photos.get(found.id)} />
      </div>

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <div className="flex items-center gap-3">
          <GlassIcon glyph="sparkles" tone="purple" size={36} />
          <h2 className="text-[17px] font-semibold">{result.bandLabel ?? "Not many details in common"}</h2>
        </div>
        {result.reasons.length > 0 && (
          <ul className="space-y-1.5">
            {result.reasons.map((r) => (
              <li key={r} className="flex gap-2 text-[15px]">
                <span aria-hidden="true" className="font-semibold text-found">✓</span>
                {r}
              </li>
            ))}
          </ul>
        )}
        {result.differences.length > 0 && (
          <ul className="space-y-1.5">
            {result.differences.map((d) => (
              <li key={d} className="flex gap-2 text-[15px] text-text-2">
                <span aria-hidden="true" className="font-semibold text-missing">≠</span>
                {d}
              </li>
            ))}
          </ul>
        )}
      </section>

      {decision?.status === "dismissed" ? (
        <section className="space-y-3 rounded-3xl bg-fill p-5 text-center">
          <p className="font-medium">This pair was marked “Not a match”, so it isn’t suggested any more.</p>
          {canDecide && (
            <ActionButton
              action={undoDismiss.bind(null, missing.id, found.id)}
              label="Undo — show it as a suggestion again"
              variant="link"
            />
          )}
        </section>
      ) : !bothOpen ? (
        <p className="rounded-2xl bg-fill px-4 py-3 text-center text-[15px] text-text-2">
          One of these items is no longer open, so this pair can’t be confirmed.
        </p>
      ) : canDecide ? (
        <section className="space-y-3">
          <TwoStepButton
            action={confirmMatch.bind(null, missing.id, found.id, result.score)}
            label="This looks like a match"
            confirmLabel="Yes, confirm"
            question="Confirm this match? You and the other parent will see each other’s contact details to arrange the handover, and both items leave the lists."
            tone="found"
          />
          <ActionButton action={dismissSuggestion.bind(null, missing.id, found.id, backTo)} label="Not a match" />
        </section>
      ) : (
        <p className="rounded-2xl bg-fill px-4 py-3 text-center text-[15px] text-text-2">
          Only the two parents who made these reports can confirm or dismiss this suggestion.
        </p>
      )}
    </div>
  );
}
