import Link from "next/link";
import { connection } from "next/server";
import { isSetUp } from "@/app/actions/account";
import { SetupForm } from "@/components/auth/SetupForm";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Set up · School Lost & Found" };

export default async function SetupPage() {
  await connection();
  if (await isSetUp()) {
    return (
      <div className="space-y-4 pt-6">
        <EmptyState icon="✅" title="The app is already set up" body="Please sign in, or ask the coordinator for an invite link." />
        <Link href="/sign-in" className="block text-center text-[17px] text-accent">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <header className="space-y-2">
        <div className="text-4xl" aria-hidden="true">🏫</div>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Set up School Lost &amp; Found</h1>
        <p className="text-text-2">
          You’ll be the app’s coordinator: you invite parents and approve who can join. This page closes once
          it’s done.
        </p>
      </header>
      <SetupForm />
    </div>
  );
}
