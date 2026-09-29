import Link from "next/link";
import { connection } from "next/server";
import { GlassIcon } from "@/components/glass";
import { SCHOOL_ID } from "@/lib/school";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Privacy · School Lost & Found" };

async function schoolName(): Promise<string> {
  try {
    const { data } = await createAdminClient().from("schools").select("name").eq("id", SCHOOL_ID).single();
    return data?.name && data.name !== "Our school" ? data.name : "your school";
  } catch {
    return "your school";
  }
}

/** Plain-English privacy note. Readable without signing in. */
export default async function PrivacyPage() {
  await connection();
  const school = await schoolName();

  return (
    <div className="space-y-6 pt-2">
      <header className="space-y-3">
        <GlassIcon glyph="lock" tone="blue" size={56} />
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Privacy</h1>
        <p className="text-text-2">
          School Lost &amp; Found helps parents at {school} reunite lost items with their owners. This page explains,
          in plain English, what information the app keeps and who can see it.
        </p>
      </header>

      <Section title="Who runs it">
        <p>
          The app is run by the Lost &amp; Found coordinator(s) for {school}. If you have any question about your
          information, or want a copy of it, please contact the coordinator.
        </p>
      </Section>

      <Section title="What the app keeps">
        <ul>
          <li>
            <strong>Your account:</strong> your email address and a password (the password is stored scrambled, so
            nobody can read it).
          </li>
          <li>
            <strong>Your name:</strong> your first name and your child’s first name, e.g. “Sam (Mia’s parent)”.
          </li>
          <li>
            <strong>Optional:</strong> a phone number, and a photo of yourself (or you can use an animal picture).
          </li>
          <li>
            <strong>Your reports:</strong> descriptions of lost or found items, where and when (if you add them),
            and photos of items.
          </li>
          <li>
            <strong>Matches:</strong> which reports parents confirmed as a match or marked “Not a match”.
          </li>
        </ul>
      </Section>

      <Section title="What it doesn’t keep">
        <ul>
          <li>No children’s surnames, dates of birth, classes or photos of children.</li>
          <li>Photos are shrunk before upload and any location information inside them is removed.</li>
          <li>No advertising, no tracking and no selling of information — ever.</li>
          <li>The only cookie keeps you signed in.</li>
        </ul>
      </Section>

      <Section title="Who can see what">
        <ul>
          <li>Only parents approved by the coordinator can see anything in the app.</li>
          <li>Approved parents see your name, your child’s first name, your picture and your reports.</li>
          <li>
            Your <strong>email and phone number</strong> are only shown to the other parent when you both confirm a
            match, so you can arrange the handover — and to the coordinator, who needs them to approve members.
          </li>
          <li>Please photograph items only, never children. The coordinator removes any unsuitable photo.</li>
        </ul>
      </Section>

      <Section title="Where it’s stored">
        <p>
          Information is stored securely by Supabase (database and photos) and the app is hosted by Vercel. Everything
          is sent over an encrypted connection, and strict access rules stop anyone outside the school community from
          reading it.
        </p>
      </Section>

      <Section title="How long it’s kept">
        <ul>
          <li>Your account and reports are kept while you use the app.</li>
          <li>Closed, matched and returned reports are hidden from the lists but kept, so matches can be checked.</li>
          <li>When you delete your account, your details, reports and photos are deleted straight away.</li>
          <li>If the app stops being used, the coordinator will delete all of its information.</li>
        </ul>
      </Section>

      <Section title="Your choices">
        <ul>
          <li>Change your details, picture, email or password at any time on your account page.</li>
          <li>Edit or close any of your reports.</li>
          <li>Delete your account and everything in it from your account page.</li>
          <li>Ask the coordinator for a copy of your information or to correct it.</li>
        </ul>
      </Section>

      <Link href="/" className="block text-center text-[17px] text-accent">
        ‹ Back to the app
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-3xl bg-card p-5 text-[15px] [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}
