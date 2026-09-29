import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { GlassIcon } from "@/components/glass";
import { ReportFacts } from "@/components/ReportFacts";
import { TwoStepButton } from "@/components/TwoStepButton";
import { getMatch, matchContacts } from "@/lib/matches";
import { displayName } from "@/lib/people";
import { avatarPhotoUrls } from "@/lib/photos";
import { getReport, reportPhotoUrls } from "@/lib/reports";
import { requireMember } from "@/lib/session";
import { markReturned, unconfirmMatch } from "../actions";

export const metadata = { title: "Match · Thingr" };

export default async function MatchPage({ params, searchParams }: PageProps<"/matches/[id]">) {
  const viewer = await requireMember();
  const { id } = await params;
  const { new: isNew, returned, note } = await searchParams;
  const match = await getMatch(id);
  if (!match) notFound();

  const [missing, found, contacts] = await Promise.all([
    getReport(match.missing_report_id),
    getReport(match.found_report_id),
    matchContacts(match.id),
  ]);
  if (!missing || !found) notFound();
  const [photos, avatars] = await Promise.all([
    reportPhotoUrls([missing, found]),
    avatarPhotoUrls(contacts.map((c) => ({ user_id: c.user_id, avatar_path: c.avatar_path }))),
  ]);

  const done = match.status === "returned";
  const myReport = viewer.userId === missing.reporter_id ? missing : found;
  const other = contacts.find((c) => c.user_id !== viewer.userId);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-[17px] text-accent">
        ‹ Home
      </Link>

      <header className="flex items-center gap-4">
        <GlassIcon glyph={done ? "check" : "sparkles"} tone={done ? "green" : "purple"} size={64} />
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">{done ? "Returned 🎉" : "Match confirmed"}</h1>
          <p className="text-text-2">
            {done
              ? "This item is back with its owner. Thank you for helping!"
              : "Both items have left the lists. Get in touch to arrange the handover."}
          </p>
        </div>
      </header>

      {isNew && !done && (
        <p role="status" className="rounded-2xl bg-found-soft px-4 py-3 text-[15px] font-medium text-found">
          Thank you! The other parent can now see this match and your contact details too.
        </p>
      )}
      {returned && (
        <p role="status" className="rounded-2xl bg-found-soft px-4 py-3 text-[15px] font-medium text-found">
          Marked as returned. Both reports are now closed.
        </p>
      )}
      {note === "failed" && (
        <p role="alert" className="rounded-2xl bg-missing-soft px-4 py-3 text-[15px] font-medium text-missing">
          Something went wrong on our side. Please try again in a moment.
        </p>
      )}

      {!done && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Contact details</h2>
          {contacts.map((c) => (
            <div key={c.user_id} className="space-y-3 rounded-3xl bg-card p-4">
              <div className="flex items-center gap-3">
                <Avatar avatar={c.avatar} photoUrl={avatars.get(c.user_id)} size={48} />
                <div>
                  <p className="font-semibold">
                    {c.parent_first_name && c.child_first_name
                      ? displayName({ parent_first_name: c.parent_first_name, child_first_name: c.child_first_name })
                      : "A parent"}
                    {c.user_id === viewer.userId && <span className="font-normal text-text-2"> · you</span>}
                  </p>
                  <p className="text-[14px] text-text-2">{c.side === "missing" ? "Lost the item" : "Found the item"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`mailto:${c.email}`} className="rounded-full bg-accent/12 px-4 py-2 text-[15px] font-semibold text-accent">
                  ✉︎ {c.email}
                </a>
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="rounded-full bg-accent/12 px-4 py-2 text-[15px] font-semibold text-accent">
                    ☎︎ {c.phone}
                  </a>
                )}
              </div>
            </div>
          ))}
          {other && !other.phone && (
            <p className="text-[13px] text-text-2">
              {other.parent_first_name ?? "The other parent"} hasn’t added a phone number, so email is the way to reach them.
            </p>
          )}
          {!done && found.current_location && (
            <p className="rounded-2xl bg-fill px-4 py-3 text-[15px]">
              <span className="text-text-2">Where the item is now:</span> <strong>{found.current_location}</strong>
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The two reports</h2>
        <ReportFacts report={missing} photoUrl={photos.get(missing.id)} />
        <ReportFacts report={found} photoUrl={photos.get(found.id)} />
      </section>

      {!done && (
        <section className="space-y-3">
          <TwoStepButton
            action={markReturned.bind(null, match.id)}
            label="Mark as returned"
            confirmLabel="Yes, it’s returned"
            question="Has the item been handed back? This closes both reports."
            tone="found"
          />
          <TwoStepButton
            action={unconfirmMatch.bind(null, match.id, `/reports/${myReport.id}`)}
            label="Not a match after all"
            confirmLabel="Yes, undo the match"
            question="Undo this match? Both items go back on the lists and this pair won’t be suggested again."
            tone="plain"
          />
        </section>
      )}
    </div>
  );
}
