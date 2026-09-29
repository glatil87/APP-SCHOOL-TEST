import { ReportList } from "@/components/ReportList";

export const metadata = { title: "Missing items · School Lost & Found" };

export default function MissingPage() {
  return <ReportList kind="missing" reports={[]} />;
}
