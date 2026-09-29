import Link from "next/link";
import { connection } from "next/server";
import { GlassIcon, type Glyph, type Tone } from "@/components/glass";

export const metadata = { title: "How it works · School Lost & Found" };

const STEPS: { glyph: Glyph; tone: Tone; title: string; body: string }[] = [
  {
    glyph: "search",
    tone: "orange",
    title: "Report what’s missing — or what you’ve found",
    body: "Add the item, its type and colour, where and when, and anything that stands out, like a name label or sticker. A photo helps too.",
  },
  {
    glyph: "sparkles",
    tone: "purple",
    title: "See possible matches",
    body: "The app compares missing and found items and suggests ones that share details, with the reasons. These are only suggestions — you decide.",
  },
  {
    glyph: "check",
    tone: "green",
    title: "Confirm and arrange the handover",
    body: "If it looks like a match, confirm it. You and the other parent then see each other’s contact details to arrange getting the item back. Both items leave the lists.",
  },
  {
    glyph: "tray",
    tone: "blue",
    title: "Mark it returned",
    body: "Once the item is back home, tap “Mark as returned”. If your item turns up on its own, open your report and close it.",
  },
];

export default async function HelpPage() {
  await connection();
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link href="/" className="text-[17px] text-accent">
          ‹ Home
        </Link>
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">How it works</h1>
      </header>

      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-3xl bg-card p-4">
            <GlassIcon glyph={s.glyph} tone={s.tone} size={48} />
            <div>
              <p className="font-semibold">
                {i + 1}. {s.title}
              </p>
              <p className="mt-1 text-[15px] text-text-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl font-semibold tracking-tight">Privacy</h2>
        <ul className="list-disc space-y-2 pl-5 text-[15px]">
          <li>Only parents approved by the school’s coordinator can see anything in the app.</li>
          <li>Other parents see your first name, your child’s first name and your picture.</li>
          <li>Your email and phone number are only shown to a parent when you both confirm a match.</li>
          <li>
            <strong>Please photograph items only</strong> — never include children in photos.
          </li>
          <li>You can change your details, or delete your account and reports, from your account page.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-5">
        <h2 className="text-xl font-semibold tracking-tight">Tips for a good report</h2>
        <ul className="list-disc space-y-2 pl-5 text-[15px]">
          <li>Mention name labels, stickers, keyrings, marks or damage — they’re the best clues.</li>
          <li>Add the brand and size if you know them.</li>
          <li>Choose the main colour; for patterned items pick “Multi-coloured”.</li>
          <li>Check back now and then: new suggestions appear as other parents report items.</li>
        </ul>
      </section>

      <p className="text-center text-[15px] text-text-2">
        Questions or problems? Please contact the app’s coordinator.
      </p>
      <p className="text-center text-[12px] text-text-2">
        Version {(process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7)}
      </p>
    </div>
  );
}
