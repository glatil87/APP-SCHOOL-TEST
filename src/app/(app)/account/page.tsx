import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { displayName } from "@/lib/people";
import { avatarPhotoUrls } from "@/lib/photos";
import { requireMember } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountForm, DetailsForm, EmailForm, PasswordForm, PictureForms } from "./AccountForms";

export const metadata = { title: "Your account · School Lost & Found" };

export default async function AccountPage() {
  const viewer = await requireMember();
  const supabase = await createClient();
  const [{ data: contact }, photos] = await Promise.all([
    supabase.from("contact_details").select("phone").eq("user_id", viewer.userId).maybeSingle(),
    avatarPhotoUrls([viewer.profile]),
  ]);
  const photoUrl = photos.get(viewer.userId) ?? null;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link href="/" className="text-[17px] text-accent">
          ‹ Home
        </Link>
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar avatar={viewer.profile.avatar} photoUrl={photoUrl} size={88} />
          <div>
            <h1 className="text-[28px] leading-tight font-bold tracking-tight">{displayName(viewer.profile)}</h1>
            <p className="text-text-2">{viewer.email}</p>
          </div>
        </div>
      </header>

      <Section title="Your details">
        <DetailsForm
          parent={viewer.profile.parent_first_name}
          child={viewer.profile.child_first_name}
          phone={contact?.phone ?? ""}
        />
      </Section>

      <Section title="Your picture">
        <PictureForms avatar={viewer.profile.avatar} photoUrl={photoUrl} />
      </Section>

      <Section title="Email">
        <EmailForm email={viewer.email} />
      </Section>

      <Section title="Password">
        <PasswordForm />
      </Section>

      <Section title="Privacy">
        <p className="text-[15px] text-text-2">
          Other approved parents at the school see your name, your child’s first name and your picture. Your email
          and phone number are only shown to a parent when you both agree a match.
        </p>
        <div className="space-y-4 pt-2">
          <SignOutButton />
          <DeleteAccountForm />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-[13px] font-semibold tracking-wide text-text-2 uppercase">{title}</h2>
      <div className="space-y-4 rounded-3xl bg-card p-5">{children}</div>
    </section>
  );
}
