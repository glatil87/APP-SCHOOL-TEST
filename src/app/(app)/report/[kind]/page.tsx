import Link from "next/link";
import { notFound } from "next/navigation";
import { KIND_COPY } from "@/lib/items";

export default async function ReportPage({ params }: PageProps<"/report/[kind]">) {
  const { kind } = await params;
  if (kind !== "missing" && kind !== "found") notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-[17px] text-accent">
        ‹ Back
      </Link>
      <h1 className="text-[32px] leading-tight font-bold tracking-tight">
        {KIND_COPY[kind].action}
      </h1>
      <div className="rounded-3xl bg-card p-6 text-[15px] text-text-2">
        The report form is coming in a later step. For now this page is a
        placeholder.
      </div>
    </div>
  );
}
