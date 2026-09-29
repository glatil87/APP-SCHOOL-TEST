import Link from "next/link";
import { COLOUR_SWATCH, type Colour, type ReportSummary } from "@/lib/items";
import { GlassIcon } from "./glass";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export function formatDay(date: string | null | undefined) {
  return date ? dateFmt.format(new Date(`${date}T12:00:00`)) : "Date not known";
}

/** "Playground · 29 Sept", leaving out whatever wasn't given. */
export function whereWhen(location: string | null | undefined, date: string | null | undefined) {
  const parts = [location, date ? formatDay(date) : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Place and date not known";
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Open"
      ? "bg-accent/12 text-accent-ink"
      : status === "Matched"
        ? "bg-found-soft text-found"
        : "bg-fill text-text-2";
  return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tone}`}>{status}</span>;
}

export function ReportCard({ report, showKind = false }: { report: ReportSummary; showKind?: boolean }) {
  const missing = report.kind === "missing";
  return (
    <Link href={`/reports/${report.id}`} className="flex items-center gap-4 rounded-3xl bg-card p-3 pr-4 active:scale-[0.99]">
      {report.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
        <img src={report.photoUrl} alt="" className="size-16 shrink-0 rounded-2xl object-cover" />
      ) : (
        <GlassIcon glyph={missing ? "search" : "tray"} tone={missing ? "orange" : "green"} size={64} />
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-[17px] font-semibold">{report.itemName}</p>
        </div>
        <p className="flex items-center gap-1.5 truncate text-[14px] text-text-2">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]"
            style={{ background: COLOUR_SWATCH[report.colour as Colour] ?? "#ccc" }}
          />
          {report.colour} · {report.category}
        </p>
        <p className="truncate text-[14px] text-text-2">
          {whereWhen(report.location, report.date)}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {showKind && (
            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${missing ? "bg-missing-soft text-missing" : "bg-found-soft text-found"}`}>
              {missing ? "Missing" : "Found"}
            </span>
          )}
          <StatusBadge status={report.status} />
          {report.status === "Matched" && report.mine && (
            <span className="rounded-full bg-found-soft px-2.5 py-0.5 text-[12px] font-semibold text-found">See contact details</span>
          )}
          {!!report.matchCount && (
            <span className="rounded-full bg-[#6d28d9]/10 px-2.5 py-0.5 text-[12px] font-semibold text-[#5b21b6] dark:bg-[#8b3df5]/25 dark:text-[#d6b8ff]">
              {report.matchCount} possible {report.matchCount === 1 ? "match" : "matches"}
            </span>
          )}
          {report.mine && !showKind && <span className="rounded-full bg-fill px-2.5 py-0.5 text-[12px] font-semibold">Yours</span>}
        </div>
      </div>
    </Link>
  );
}
