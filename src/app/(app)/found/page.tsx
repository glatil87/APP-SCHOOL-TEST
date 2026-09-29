import { ReportList } from "@/components/ReportList";
import { listReports } from "@/lib/reports";
import { requireMember } from "@/lib/session";

export const metadata = { title: "Found items · School Lost & Found" };

export default async function FoundPage() {
  const viewer = await requireMember();
  return <ReportList kind="found" reports={await listReports("found", viewer.userId)} />;
}
