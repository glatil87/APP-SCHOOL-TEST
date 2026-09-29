import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportForm } from "@/app/(app)/report/[kind]/ReportForm";
import { getReport, reportPhotoUrls } from "@/lib/reports";
import { todayInSchool } from "@/lib/reportValidation";
import { requireMember } from "@/lib/session";

export const metadata = { title: "Edit report · School Lost & Found" };

export default async function EditReportPage({ params }: PageProps<"/reports/[id]/edit">) {
  const viewer = await requireMember();
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();
  if (report.reporter_id !== viewer.userId || report.status !== "open") redirect(`/reports/${id}`);
  const photoUrl = (await reportPhotoUrls([report])).get(report.id) ?? null;

  return (
    <div className="space-y-6">
      <Link href={`/reports/${id}`} className="text-[17px] text-accent">
        ‹ Cancel
      </Link>
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">Edit your report</h1>
      <ReportForm
        kind={report.kind}
        today={todayInSchool()}
        editing={{
          id: report.id,
          photoUrl,
          values: {
            item_name: report.item_name,
            category: report.category,
            colour: report.colour,
            brand: report.brand ?? "",
            size: report.size ?? "",
            details: report.details,
            location: report.location,
            event_date: report.event_date,
            current_location: report.current_location ?? "",
          },
        }}
      />
    </div>
  );
}
