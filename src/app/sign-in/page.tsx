import Link from "next/link";
import { redirect } from "next/navigation";
import { isSetUp } from "@/app/actions/account";
import { SignInForm } from "@/components/auth/SignInForm";
import { GlassIcon } from "@/components/glass";
import { getViewer } from "@/lib/session";

export const metadata = { title: "Sign in · School Lost & Found" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next, deleted } = await searchParams;
  if (await getViewer()) redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/");
  const setUp = await isSetUp();

  return (
    <div className="space-y-8 pt-6">
      <header className="space-y-2 text-center">
        <GlassIcon glyph="backpack" tone="blue" size={84} className="mx-auto" />
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">School Lost &amp; Found</h1>
        <p className="text-text-2">Sign in to see lost and found items at your school.</p>
      </header>
      {deleted && (
        <p role="status" className="rounded-2xl bg-found-soft px-4 py-3 text-center text-[15px] font-medium text-found">
          Your account has been deleted.
        </p>
      )}
      <SignInForm next={typeof next === "string" ? next : undefined} />
      <div className="space-y-2 text-center text-[15px] text-text-2">
        <p>New here? Open the invite link you were sent to create your account.</p>
        <p>Forgotten your password? Ask the app’s coordinator to reset it for you.</p>
        <p>
          <Link href="/privacy" className="font-medium text-accent">
            Privacy
          </Link>
        </p>
        {!setUp && (
          <p>
            Setting the app up for the first time?{" "}
            <Link href="/setup" className="font-medium text-accent">
              Start here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
