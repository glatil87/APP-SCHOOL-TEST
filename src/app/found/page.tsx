import { ReportList } from "@/components/ReportList";

export const metadata = { title: "Found items · School Lost & Found" };

export default function FoundPage() {
  return <ReportList kind="found" reports={[]} />;
}
