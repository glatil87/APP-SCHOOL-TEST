import { COLOUR_SWATCH, type Colour } from "@/lib/items";
import type { ReportRow } from "@/lib/reports";
import { whereWhen } from "./ReportCard";
import { GlassIcon } from "./glass";

/** Compact summary of a report, used on the compare and match pages. */
export function ReportFacts({ report, photoUrl }: { report: ReportRow; photoUrl?: string | null }) {
  const missing = report.kind === "missing";
  return (
    <div className="space-y-3 rounded-3xl bg-card p-4">
      <div className="flex items-center gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
          <img src={photoUrl} alt={`Photo of the ${report.item_name}`} className="size-20 shrink-0 rounded-2xl object-cover" />
        ) : (
          <GlassIcon glyph={missing ? "search" : "tray"} tone={missing ? "orange" : "green"} size={64} />
        )}
        <div className="min-w-0">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${missing ? "bg-missing-soft text-missing" : "bg-found-soft text-found"}`}
          >
            {missing ? "Missing" : "Found"}
          </span>
          <p className="mt-1 truncate text-[19px] font-semibold">{report.item_name}</p>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
        <dt className="text-text-2">Type</dt>
        <dd>{report.category}</dd>
        <dt className="text-text-2">Colour</dt>
        <dd className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]"
            style={{ background: COLOUR_SWATCH[report.colour as Colour] ?? "#ccc" }}
          />
          {report.colour}
        </dd>
        {report.brand && (
          <>
            <dt className="text-text-2">Brand</dt>
            <dd>{report.brand}</dd>
          </>
        )}
        {report.size && (
          <>
            <dt className="text-text-2">Size</dt>
            <dd>{report.size}</dd>
          </>
        )}
        <dt className="text-text-2">{missing ? "Last seen" : "Found at"}</dt>
        <dd>
          {whereWhen(report.location, report.event_date)}
        </dd>
        {!missing && report.current_location && (
          <>
            <dt className="text-text-2">Now</dt>
            <dd>{report.current_location}</dd>
          </>
        )}
        {report.details && (
          <>
            <dt className="text-text-2">Details</dt>
            <dd className="whitespace-pre-line">{report.details}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
