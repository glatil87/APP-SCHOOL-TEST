import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/auth/JoinForm";
import { EmptyState } from "@/components/EmptyState";
import { findValidInvite } from "@/lib/invites";
import { getViewer } from "@/lib/session";

export const metadata = { title: "Join · School Lost & Found" };

export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const [invite, viewer] = await Promise.all([findValidInvite(code), getViewer()]);

  if (!invite) {
    return (
      <div className="space-y-4 pt-6">
        <EmptyState
          icon="🔗"
          title="This invite link isn’t valid"
          body="It may have been switched off or mistyped. Please ask the person who sent it for a new one."
        />
        <Link href="/sign-in" className="block text-center text-[17px] text-accent">
          Already a member? Sign in
        </Link>
      </div>
    );
  }

  if (viewer?.membership) redirect(viewer.membership.status === "approved" ? "/" : "/waiting");

  return (
    <div className="space-y-6 pt-2">
      <header className="space-y-2">
        <div className="text-4xl" aria-hidden="true">👋</div>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Join {invite.schoolName}</h1>
        <p className="text-text-2">
          School Lost &amp; Found helps parents at {invite.schoolName} reunite lost items with their owners. Only
          approved parents can see what’s posted.
        </p>
      </header>
      <JoinForm code={code} signedIn={!!viewer} needsDetails={!viewer?.profile} />
      {!viewer && (
        <p className="text-center text-[15px] text-text-2">
          Already have an account?{" "}
          <Link href={`/sign-in?next=/join/${code}`} className="font-medium text-accent">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
