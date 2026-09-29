import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { GlassIcon } from "@/components/glass";
import { StatusBadge, formatDay } from "@/components/ReportCard";
import { COLOUR_SWATCH, type Colour } from "@/lib/items";
import { displayStatus, getReport, reportPhotoUrls } from "@/lib/reports";
import { requireMember } from "@/lib/session";

export const metadata = { title: "Report · School Lost & Found" };

export default async function ReportDetailPage({ params, searchParams }: PageProps<"/reports/[id]">) {
  const viewer = await requireMember();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const report = await getReport(id);
  if (!report) notFound();

  const photoUrl = (await reportPhotoUrls([report])).get(report.id);
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
          <Row label={missing ? "Last seen" : "Found at"}>{report.location}</Row>
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

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Possible matches</h2>
        <EmptyState
          glyph="sparkles"
          tone="purple"
          title="Coming soon"
          body="Suggestions of reports that might be the same item will appear here in the next update."
        />
      </section>
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
