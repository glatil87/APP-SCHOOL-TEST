import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { GlassIcon } from "@/components/glass";
import { StatusBadge, formatDay, whereWhen } from "@/components/ReportCard";
import { TwoStepButton } from "@/components/TwoStepButton";
import { removeReport, withdrawReport } from "../../report/[kind]/actions";
import { COLOUR_SWATCH, type Colour } from "@/lib/items";
import { matchForReport, nearMissesFor, suggestionsFor, type SuggestionView } from "@/lib/matches";
import { displayStatus, getReport, reportPhotoUrls, type ReportRow } from "@/lib/reports";
import { requireMember } from "@/lib/session";

export const metadata = { title: "Report · School Lost & Found" };

export default async function ReportDetailPage({ params, searchParams }: PageProps<"/reports/[id]">) {
  const viewer = await requireMember();
  const { id } = await params;
  const { new: isNew, dismissed, reopened, updated, note } = await searchParams;
  const report = await getReport(id);
  if (!report) notFound();

  const [photos, suggestions, match] = await Promise.all([
    reportPhotoUrls([report]),
    suggestionsFor(report),
    report.status === "open" ? null : matchForReport(report.id),
  ]);
  const photoUrl = photos.get(report.id);
  const nearMisses = viewer.membership.role === "coordinator" ? await nearMissesFor(report) : [];
  const missing = report.kind === "missing";
  const mine = report.reporter_id === viewer.userId;

  return (
    <div className="space-y-6">
      <Link href={missing ? "/missing" : "/found"} className="text-[17px] text-accent">
        ‹ {missing ? "Missing items" : "Found items"}
      </Link>

      {isNew && mine && (
        <div role="status" className="flex items-center gap-3 rounded-3xl bg-found-soft p-4">
          <GlassIcon glyph="check" tone="green" size={40} />
          <div>
            <p className="font-semibold text-found">Report added</p>
            <p className="text-[15px] text-text-2">
              Other parents can now see it. Possible matches will be shown on this page.
            </p>
          </div>
        </div>
      )}

      {updated && (
        <p role="status" className="rounded-2xl bg-found-soft px-4 py-3 text-[15px] font-medium text-found">
          Changes saved ✓
        </p>
      )}
      {note === "failed" && (
        <p role="alert" className="rounded-2xl bg-missing-soft px-4 py-3 text-[15px] font-medium text-missing">
          Something went wrong on our side. Please try again in a moment.
        </p>
      )}
      {dismissed && (
        <p role="status" className="rounded-2xl bg-fill px-4 py-3 text-[15px]">
          Got it — that suggestion won’t be shown again.
        </p>
      )}
      {reopened && (
        <p role="status" className="rounded-2xl bg-fill px-4 py-3 text-[15px]">
          The match was undone. This report is back on the list.
        </p>
      )}
      {match && (
        <Link href={`/matches/${match.id}`} className="flex items-center gap-3 rounded-3xl bg-found-soft p-4">
          <GlassIcon glyph={match.status === "returned" ? "check" : "sparkles"} tone={match.status === "returned" ? "green" : "purple"} size={40} />
          <div className="flex-1">
            <p className="font-semibold text-found">{match.status === "returned" ? "Returned" : "Match confirmed"}</p>
            <p className="text-[15px] text-text-2">
              {match.status === "returned" ? "This item is back with its owner." : "See contact details and arrange the handover ›"}
            </p>
          </div>
        </Link>
      )}

      <article className="space-y-5">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
          <img src={photoUrl} alt={`Photo of the ${report.item_name}`} className="aspect-[4/3] w-full rounded-3xl bg-fill object-cover" />
        ) : null}

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${missing ? "bg-missing-soft text-missing" : "bg-found-soft text-found"}`}>
              {missing ? "Missing" : "Found"}
            </span>
            <StatusBadge status={displayStatus(report)} />
            {mine && <span className="rounded-full bg-fill px-2.5 py-0.5 text-[12px] font-semibold">Your report</span>}
          </div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">{report.item_name}</h1>
        </header>

        <dl className="divide-y divide-line rounded-3xl bg-card px-5">
          <Row label="Type">{report.category}</Row>
          <Row label="Colour">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]"
                style={{ background: COLOUR_SWATCH[report.colour as Colour] ?? "#ccc" }}
              />
              {report.colour}
            </span>
          </Row>
          {report.brand && <Row label="Brand">{report.brand}</Row>}
          {report.size && <Row label="Size">{report.size}</Row>}
          <Row label={missing ? "Last seen" : "Found at"}>{report.location ?? "Not known"}</Row>
          <Row label={missing ? "Date" : "Date found"}>{formatDay(report.event_date)}</Row>
          {!missing && report.current_location && <Row label="Where it is now">{report.current_location}</Row>}
        </dl>

        {report.details && (
          <section className="space-y-2 rounded-3xl bg-card p-5">
            <h2 className="text-[13px] font-semibold tracking-wide text-text-2 uppercase">What stands out</h2>
            <p className="text-[17px] whitespace-pre-line">{report.details}</p>
          </section>
        )}
      </article>

      {mine && report.status === "open" && (
        <section className="space-y-3">
          <Link
            href={`/reports/${report.id}/edit`}
            className="block w-full rounded-2xl bg-fill px-5 py-3.5 text-center text-[17px] font-semibold"
          >
            Edit report
          </Link>
          <TwoStepButton
            action={withdrawReport.bind(null, report.id)}
            label={missing ? "It turned up — close this report" : "Close this report"}
            confirmLabel="Yes, close it"
            question={
              missing
                ? "Close this report? It will be removed from the list. Glad it turned up!"
                : "Close this report? It will be removed from the list."
            }
            tone="plain"
          />
        </section>
      )}

      {report.status === "open" && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Possible matches</h2>
          {suggestions.length === 0 ? (
            <EmptyState
              glyph="sparkles"
              tone="purple"
              title="No possible matches yet"
              body={`We’ll keep checking as new ${missing ? "found" : "missing"} items are reported. Look back here soon.`}
            />
          ) : (
            <>
              <p className="text-[15px] text-text-2">
                These {missing ? "found" : "missing"} items share some details. They’re suggestions only — open one to
                compare.
              </p>
              <ul className="space-y-3">
                {suggestions.map((s) => (
                  <li key={s.report.id}>
                    <SuggestionCard suggestion={s} from={report} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      {viewer.membership.role === "coordinator" && report.status === "open" && (
        <details className="rounded-3xl bg-card p-5">
          <summary className="cursor-pointer text-[15px] font-semibold">Why not suggested? (coordinator only)</summary>
          <div className="mt-3 space-y-3">
            <p className="text-[13px] text-text-2">
              The closest reports that were not suggested. Suggestions need a score of 35 or more and a similar type.
            </p>
            {nearMisses.length === 0 ? (
              <p className="text-[15px]">No other open {missing ? "found" : "missing"} reports to compare with.</p>
            ) : (
              <ul className="space-y-3">
                {nearMisses.map((n) => (
                  <li key={n.report.id} className="space-y-1 rounded-2xl bg-fill p-3 text-[14px]">
                    <p className="font-semibold">
                      {n.report.item_name} · score {n.score}
                      {n.dismissed && <span className="font-normal text-text-2"> · marked “Not a match”</span>}
                    </p>
                    <p className="text-text-2">
                      {n.report.category} · {n.report.colour} · {whereWhen(n.report.location, n.report.event_date)}
                    </p>
                    {n.reasons.map((r) => (
                      <p key={r}>✓ {r}</p>
                    ))}
                    {n.differences.map((d) => (
                      <p key={d} className="text-text-2">≠ {d}</p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}

      {viewer.membership.role === "coordinator" && !mine && (
        <section className="space-y-2 border-t border-line pt-5">
          <p className="text-[13px] text-text-2">Coordinator</p>
          <TwoStepButton
            action={removeReport.bind(null, report.id)}
            label="Remove this report"
            confirmLabel="Yes, remove it"
            question="Remove this report for everyone? Use this for unsuitable or duplicate reports. It can’t be undone."
            tone="plain"
          />
        </section>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-3.5">
      <dt className="text-text-2">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function SuggestionCard({ suggestion, from }: { suggestion: SuggestionView; from: ReportRow }) {
  const { report: other, photoUrl, bandLabel, band, reasons } = suggestion;
  const [missingId, foundId] = from.kind === "missing" ? [from.id, other.id] : [other.id, from.id];
  return (
    <Link
      href={`/compare/${missingId}/${foundId}?from=/reports/${from.id}`}
      className="block space-y-3 rounded-3xl bg-card p-4 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
          <img src={photoUrl} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
        ) : (
          <GlassIcon glyph={other.kind === "missing" ? "search" : "tray"} tone={other.kind === "missing" ? "orange" : "green"} size={56} />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-[17px] font-semibold">{other.item_name}</p>
          <p className="truncate text-[14px] text-text-2">
            {whereWhen(other.location, other.event_date)}
          </p>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
              band === "strong" ? "bg-found-soft text-found" : "bg-fill text-text-2"
            }`}
          >
            {bandLabel}
          </span>
        </div>
      </div>
      <ul className="space-y-1">
        {reasons.map((r) => (
          <li key={r} className="flex gap-2 text-[14px]">
            <span aria-hidden="true" className="font-semibold text-found">✓</span>
            {r}
          </li>
        ))}
      </ul>
      <p className="text-[15px] font-semibold text-accent">Compare ›</p>
    </Link>
  );
}
