import Link from "next/link";
import { KIND_COPY, type ReportKind } from "@/lib/items";
import { EmptyState } from "@/components/EmptyState";

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm font-medium text-text-2">School Lost &amp; Found</p>
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">
          Hello 👋
        </h1>
        <p className="text-text-2">What would you like to do?</p>
      </header>

      <section className="grid gap-3" aria-label="Report an item">
        <ActionCard kind="missing" />
        <ActionCard kind="found" />
      </section>

      <section className="space-y-3" aria-labelledby="your-reports">
        <h2 id="your-reports" className="text-xl font-semibold tracking-tight">
          Your reports
        </h2>
        <EmptyState
          title="You haven’t reported anything yet"
          body="Your reports and any possible matches will show up here."
        />
      </section>
    </div>
  );
}

function ActionCard({ kind }: { kind: ReportKind }) {
  const copy = KIND_COPY[kind];
  const tone =
    kind === "missing"
      ? "bg-missing-soft text-missing"
      : "bg-found-soft text-found";

  return (
    <Link
      href={`/report/${kind}`}
      className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] transition active:scale-[0.98]"
    >
      <span
        className={`grid size-14 shrink-0 place-items-center rounded-2xl text-2xl ${tone}`}
        aria-hidden="true"
      >
        {kind === "missing" ? "🔍" : "🙌"}
      </span>
      <span className="flex-1">
        <span className="block text-lg font-semibold">{copy.action}</span>
        <span className="block text-[15px] text-text-2">{copy.blurb}</span>
      </span>
      <svg width="10" height="16" viewBox="0 0 10 16" className="text-text-2" aria-hidden="true">
        <path d="m2 2 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
