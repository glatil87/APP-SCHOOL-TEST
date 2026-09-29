import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { GlassIcon } from "@/components/glass";
import { getViewer } from "@/lib/session";

export const metadata = { title: "Waiting for approval · School Lost & Found" };

export default async function WaitingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  const status = viewer.membership?.status;
  if (status === "approved" && viewer.profile) redirect("/");

  const copy =
    status === "pending"
      ? {
          glyph: "hourglass" as const,
          tone: "orange" as const,
          title: `Thanks${viewer.profile ? `, ${viewer.profile.parent_first_name}` : ""}!`,
          body: "Your request to join has been sent. The coordinator will approve it soon, then you’ll be able to see and report items. Check back a little later.",
        }
      : status === "removed"
        ? {
            glyph: "lock" as const,
            tone: "gray" as const,
            title: "You no longer have access",
            body: "Your access to this school’s Lost & Found has been removed. If you think this is a mistake, please contact the coordinator.",
          }
        : {
            glyph: "link" as const,
            tone: "blue" as const,
            title: "You need an invite link",
            body: "To join, open the invite link shared by your school’s coordinator.",
          };

  return (
    <div className="space-y-6 pt-10 text-center">
      <GlassIcon glyph={copy.glyph} tone={copy.tone} size={84} className="mx-auto" />
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">{copy.title}</h1>
      <p className="mx-auto max-w-sm text-text-2">{copy.body}</p>
      {status === "pending" && (
        <a href="/waiting" className="inline-block rounded-2xl bg-accent px-6 py-3 font-semibold text-white">
          Check again
        </a>
      )}
      <SignOutButton />
    </div>
  );
}
