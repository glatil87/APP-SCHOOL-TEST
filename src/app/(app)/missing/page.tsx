import { ReportList } from "@/components/ReportList";
import { listReports } from "@/lib/reports";
import { requireMember } from "@/lib/session";

export const metadata = { title: "Missing items · School Lost & Found" };

export default async function MissingPage({ searchParams }: PageProps<"/missing">) {
  const { removed } = await searchParams;
  const viewer = await requireMember();
  return <ReportList kind="missing" reports={await listReports("missing", viewer.userId)} notice={removed ? "Report removed ✓" : undefined} />;
}
