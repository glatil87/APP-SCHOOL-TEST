import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassIcon } from "@/components/glass";
import { KIND_COPY } from "@/lib/items";
import { todayInSchool } from "@/lib/reportValidation";
import { ReportForm } from "./ReportForm";

export async function generateMetadata({ params }: PageProps<"/report/[kind]">) {
  const { kind } = await params;
  return { title: `${kind === "found" ? "Report a found item" : "Report a missing item"} · School Lost & Found` };
}

export default async function ReportPage({ params }: PageProps<"/report/[kind]">) {
  const { kind } = await params;
  if (kind !== "missing" && kind !== "found") notFound();
  const missing = kind === "missing";

  return (
    <div className="space-y-6">
      <Link href="/" className="text-[17px] text-accent">
        ‹ Back
      </Link>
      <header className="flex items-center gap-4">
        <GlassIcon glyph={missing ? "search" : "tray"} tone={missing ? "orange" : "green"} size={56} />
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">{KIND_COPY[kind].action}</h1>
          <p className="text-text-2">
            {missing ? "The more detail, the easier it is to spot." : "Thank you for helping another family!"}
          </p>
        </div>
      </header>
      <ReportForm kind={kind} today={todayInSchool()} />
    </div>
  );
}
