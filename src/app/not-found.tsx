import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        glyph="compass"
        tone="gray"
        title="We couldn’t find that page"
        body="It may have been removed, or the link might be wrong."
      />
      <Link href="/" className="block text-center text-[17px] text-accent">
        Go to Home
      </Link>
    </div>
  );
}
