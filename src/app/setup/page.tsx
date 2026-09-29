import Link from "next/link";
import { connection } from "next/server";
import { isSetUp } from "@/app/actions/account";
import { SetupForm } from "@/components/auth/SetupForm";
import { EmptyState } from "@/components/EmptyState";
import { GlassIcon } from "@/components/glass";

export const metadata = { title: "Set up · Thingr" };

export default async function SetupPage() {
  await connection();
  if (await isSetUp()) {
    return (
      <div className="space-y-4 pt-6">
        <EmptyState glyph="check" tone="green" title="The app is already set up" body="Please sign in, or ask the coordinator for an invite link." />
        <Link href="/sign-in" className="block text-center text-[17px] text-accent">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <header className="space-y-2">
        <GlassIcon glyph="school" tone="indigo" size={64} />
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Set up Thingr</h1>
        <p className="text-text-2">
          You’ll be the app’s coordinator: you invite parents and approve who can join. This page closes once
          it’s done.
        </p>
      </header>
      <SetupForm />
    </div>
  );
}
