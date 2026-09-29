import { TabBar } from "@/components/TabBar";
import { requireMember } from "@/lib/session";

/** Everything in here is for approved members of the school only. */
export default async function MemberLayout({ children }: LayoutProps<"/">) {
  await requireMember();
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
