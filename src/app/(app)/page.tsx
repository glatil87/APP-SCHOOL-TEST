import Link from "next/link";
import { KIND_COPY, type ReportKind } from "@/lib/items";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { GlassIcon } from "@/components/glass";
import { avatarPhotoUrls } from "@/lib/photos";
import { SCHOOL_ID } from "@/lib/school";
import { requireMember } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const viewer = await requireMember();
  const isCoordinator = viewer.membership.role === "coordinator";
  const photoUrl = (await avatarPhotoUrls([viewer.profile])).get(viewer.userId);
  let waiting = 0;
  if (isCoordinator) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("school_id", SCHOOL_ID)
      .eq("status", "pending");
    waiting = count ?? 0;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm font-medium text-text-2">School Lost &amp; Found</p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">
            Hello, {viewer.profile.parent_first_name}
          </h1>
          <Link href="/account" aria-label="Your account" className="rounded-full active:scale-95">
            <Avatar avatar={viewer.profile.avatar} photoUrl={photoUrl} size={48} />
          </Link>
        </div>
        <p className="text-text-2">What would you like to do?</p>
      </header>

      {isCoordinator && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 font-medium"
        >
          <span className="flex items-center gap-3">
            <GlassIcon glyph="people" tone="indigo" size={32} />
            Members &amp; invite links
          </span>
          {waiting > 0 ? (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[13px] font-semibold text-white">
              {waiting} waiting
            </span>
          ) : (
            <span className="text-text-2" aria-hidden="true">›</span>
          )}
        </Link>
      )}

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
  return (
    <Link
      href={`/report/${kind}`}
      className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] transition active:scale-[0.98]"
    >
      <GlassIcon glyph={kind === "missing" ? "search" : "tray"} tone={kind === "missing" ? "orange" : "green"} size={56} />
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
