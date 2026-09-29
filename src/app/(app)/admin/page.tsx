import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { displayName, type Profile } from "@/lib/people";
import { SCHOOL_ID } from "@/lib/school";
import { requireCoordinator } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ApproveButtons, CreateInvite, MemberActions, RevokeInvite } from "./AdminControls";

export const metadata = { title: "Members · School Lost & Found" };

type Member = {
  user_id: string;
  role: "parent" | "coordinator";
  status: "pending" | "approved" | "removed";
  created_at: string;
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const viewer = await requireCoordinator();
  const { welcome } = await searchParams;
  const supabase = await createClient();

  const [{ data: members }, { data: invites }, { data: school }] = await Promise.all([
    supabase.from("memberships").select("user_id, role, status, created_at").eq("school_id", SCHOOL_ID).order("created_at"),
    supabase
      .from("invites")
      .select("id, label, created_at, use_count")
      .eq("school_id", SCHOOL_ID)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("schools").select("name").eq("id", SCHOOL_ID).single(),
  ]);

  const list = (members ?? []) as Member[];
  const ids = list.map((m) => m.user_id);
  const [{ data: profiles }, emails] = await Promise.all([
    supabase.from("profiles").select("user_id, parent_first_name, child_first_name, avatar, avatar_path").in("user_id", ids),
    memberEmails(ids),
  ]);
  const profileOf = new Map((profiles as Profile[] | null)?.map((p) => [p.user_id, p]));
  const nameOf = (id: string) => {
    const p = profileOf.get(id);
    return p ? displayName(p) : "Unnamed member";
  };

  const pending = list.filter((m) => m.status === "pending");
  const approved = list.filter((m) => m.status === "approved");
  const removed = list.filter((m) => m.status === "removed");

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link href="/" className="text-[17px] text-accent">
          ‹ Home
        </Link>
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">Members</h1>
        <p className="text-text-2">{school?.name}</p>
      </header>

      {welcome && (
        <p role="status" className="rounded-2xl bg-found-soft px-4 py-3 text-[15px]">
          🎉 All set up! Next, create an invite link below and share it with parents.
        </p>
      )}

      <Section title={`Waiting for approval${pending.length ? ` (${pending.length})` : ""}`}>
        {pending.length === 0 ? (
          <EmptyState icon="☕️" title="Nobody waiting" body="New parents who use an invite link will appear here for you to approve." />
        ) : (
          <ul className="space-y-2">
            {pending.map((m) => (
              <MemberRow key={m.user_id} member={m} name={nameOf(m.user_id)} email={emails.get(m.user_id)} profile={profileOf.get(m.user_id)}>
                <ApproveButtons userId={m.user_id} name={nameOf(m.user_id)} />
              </MemberRow>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Invite links">
        <p className="text-[15px] text-text-2">
          Anyone with a link can ask to join, but only you can let them in. Share links in trusted groups only, and
          switch them off when you no longer need them.
        </p>
        <CreateInvite />
        {(invites ?? []).length > 0 && (
          <ul className="space-y-2">
            {invites!.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4">
                <div>
                  <p className="font-medium">{inv.label ?? "Invite link"}</p>
                  <p className="text-[13px] text-text-2">
                    Created {dateFmt.format(new Date(inv.created_at))} · used {inv.use_count}{" "}
                    {inv.use_count === 1 ? "time" : "times"}
                  </p>
                </div>
                <RevokeInvite inviteId={inv.id} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Members (${approved.length})`}>
        <ul className="space-y-2">
          {approved.map((m) => (
            <MemberRow key={m.user_id} member={m} name={nameOf(m.user_id)} email={emails.get(m.user_id)} profile={profileOf.get(m.user_id)}>
              {m.user_id !== viewer.userId && <MemberActions userId={m.user_id} name={nameOf(m.user_id)} removed={false} />}
            </MemberRow>
          ))}
        </ul>
      </Section>

      {removed.length > 0 && (
        <Section title="Removed or declined">
          <ul className="space-y-2">
            {removed.map((m) => (
              <MemberRow key={m.user_id} member={m} name={nameOf(m.user_id)} email={emails.get(m.user_id)} profile={profileOf.get(m.user_id)}>
                <MemberActions userId={m.user_id} name={nameOf(m.user_id)} removed />
              </MemberRow>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** Emails for the coordinator's member list (only after the coordinator check). */
async function memberEmails(ids: string[]): Promise<Map<string, string>> {
  const wanted = new Set(ids);
  const map = new Map<string, string>();
  const admin = createAdminClient();
  for (let page = 1; page < 50 && map.size < wanted.size; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) break;
    for (const u of data.users) if (wanted.has(u.id) && u.email) map.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return map;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function MemberRow({
  member,
  name,
  email,
  profile,
  children,
}: {
  member: Member;
  name: string;
  email?: string;
  profile?: Profile;
  children?: React.ReactNode;
}) {
  return (
    <li className="space-y-3 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar avatar={profile?.avatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {name}
            {member.role === "coordinator" && <span className="ml-2 text-[13px] font-normal text-text-2">Coordinator</span>}
          </p>
          <p className="truncate text-[13px] text-text-2">
            {email} · joined {dateFmt.format(new Date(member.created_at))}
          </p>
        </div>
      </div>
      {children}
    </li>
  );
}
