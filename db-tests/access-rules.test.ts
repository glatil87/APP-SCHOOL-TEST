/**
 * Proves the database access rules: who can see and change what.
 * Runs against a local Postgres (see scripts/test-db.sh), using a small
 * stand-in for Supabase's auth and storage schemas.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ADMIN_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
const TEST_DB = "lost_found_access_test";

let db: Client;

const SCHOOL_A = "0000000a-0000-4000-8000-000000000000";
const SCHOOL_B = "0000000b-0000-4000-8000-000000000000";

const users = {
  coordA: "10000000-0000-4000-8000-000000000001",
  parent1: "10000000-0000-4000-8000-000000000002", // reports a missing bottle
  parent2: "10000000-0000-4000-8000-000000000003", // reports a found bottle
  parent3: "10000000-0000-4000-8000-000000000004", // uninvolved approved parent
  pending: "10000000-0000-4000-8000-000000000005",
  removed: "10000000-0000-4000-8000-000000000006",
  outsider: "10000000-0000-4000-8000-000000000007", // approved at school B
  stranger: "10000000-0000-4000-8000-000000000008", // signed in, no school
} as const;
type User = keyof typeof users;

const reports = {
  lostBottle: "20000000-0000-4000-8000-000000000001",
  foundBottle: "20000000-0000-4000-8000-000000000002",
  foundHat: "20000000-0000-4000-8000-000000000003",
  schoolBReport: "20000000-0000-4000-8000-000000000004",
};

/** Runs `sql` as a signed-in user (or signed out when `user` is null). */
async function as<T extends Record<string, unknown> = Record<string, unknown>>(
  user: User | null,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  await db.query("begin");
  try {
    await db.query(`set local role ${user ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(user ? { sub: users[user], role: "authenticated" } : { role: "anon" }),
    ]);
    const res = await db.query(sql, params);
    await db.query("commit");
    return res.rows as T[];
  } catch (err) {
    await db.query("rollback");
    throw err;
  }
}

async function count(user: User | null, sql: string, params: unknown[] = []) {
  return (await as(user, sql, params)).length;
}

async function reportStatus(id: string) {
  const res = await db.query("select status from public.reports where id = $1", [id]);
  return res.rows[0]?.status;
}

async function insertReport(user: User, school: string, overrides: Record<string, unknown> = {}) {
  const row = {
    school_id: school,
    reporter_id: users[user],
    kind: "missing",
    item_name: "Test item",
    category: "Bags",
    colour: "Red",
    location: "Hall",
    event_date: "2026-09-20",
    ...overrides,
  };
  const cols = Object.keys(row);
  return as(
    user,
    `insert into public.reports (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
    Object.values(row),
  );
}

beforeAll(async () => {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${TEST_DB} with (force)`);
  await admin.query(`create database ${TEST_DB}`);
  await admin.end();

  const url = new URL(ADMIN_URL);
  url.pathname = `/${TEST_DB}`;
  db = new Client({ connectionString: url.toString() });
  await db.connect();

  const root = join(__dirname, "..", "supabase");
  await db.query(readFileSync(join(root, "tests", "supabase-stub.sql"), "utf8"));
  for (const file of readdirSync(join(root, "migrations")).sort()) {
    await db.query(readFileSync(join(root, "migrations", file), "utf8"));
  }

  // Fixtures, inserted as the database owner.
  for (const [name, id] of Object.entries(users)) {
    await db.query("insert into auth.users (id, email) values ($1, $2)", [id, `${name}@example.com`]);
    await db.query(
      "insert into public.profiles (user_id, parent_first_name, child_first_name) values ($1, $2, 'Kid')",
      [id, name],
    );
  }
  await db.query("insert into public.schools (id, name) values ($1, 'School A'), ($2, 'School B')", [SCHOOL_A, SCHOOL_B]);
  await db.query("select public.bootstrap_coordinator($1, $2)", [SCHOOL_A, users.coordA]);
  const members: [string, User, string][] = [
    [SCHOOL_A, "parent1", "approved"],
    [SCHOOL_A, "parent2", "approved"],
    [SCHOOL_A, "parent3", "approved"],
    [SCHOOL_A, "pending", "pending"],
    [SCHOOL_A, "removed", "removed"],
    [SCHOOL_B, "outsider", "approved"],
  ];
  for (const [school, user, status] of members) {
    await db.query("insert into public.memberships (school_id, user_id, status) values ($1, $2, $3)", [school, users[user], status]);
  }
  await db.query("insert into public.contact_details (user_id, phone) values ($1, '07700 900001'), ($2, '07700 900002')", [
    users.parent1,
    users.parent2,
  ]);
  const base = "category, colour, location, event_date";
  await db.query(
    `insert into public.reports (id, school_id, reporter_id, kind, item_name, ${base}) values
      ($1, $5, $6, 'missing', 'Blue bottle', 'Water bottles', 'Blue', 'Playground', '2026-09-14'),
      ($2, $5, $7, 'found',   'Bottle',      'Water bottles', 'Blue', 'Playground', '2026-09-15'),
      ($3, $5, $7, 'found',   'Hat',         'Clothing',      'Red',  'Field',      '2026-09-15'),
      ($4, $8, $9, 'missing', 'Coat',        'Clothing',      'Red',  'Gate',       '2026-09-15')`,
    [reports.lostBottle, reports.foundBottle, reports.foundHat, reports.schoolBReport, SCHOOL_A, users.parent1, users.parent2, SCHOOL_B, users.outsider],
  );
});

afterAll(async () => {
  await db?.end();
});

describe("reading reports", () => {
  it("signed-out visitors cannot read anything", async () => {
    await expect(as(null, "select * from public.reports")).rejects.toThrow(/permission denied/);
    await expect(as(null, "select * from public.profiles")).rejects.toThrow(/permission denied/);
  });

  it("approved members see their own school's reports only", async () => {
    const rows = await as<{ id: string }>("parent3", "select id from public.reports order by id");
    expect(rows.map((r) => r.id)).toEqual([reports.lostBottle, reports.foundBottle, reports.foundHat]);
  });

  it("members of another school see none of this school's reports", async () => {
    const rows = await as<{ id: string }>("outsider", "select id from public.reports");
    expect(rows.map((r) => r.id)).toEqual([reports.schoolBReport]);
  });

  it.each(["pending", "removed", "stranger"] as const)("%s users see no reports", async (user) => {
    expect(await count(user, "select * from public.reports")).toBe(0);
  });
});

describe("creating and editing reports", () => {
  it("an approved parent can report an item", async () => {
    expect(await insertReport("parent3", SCHOOL_A)).toHaveLength(1);
  });

  it("pending, removed and outside users cannot report in the school", async () => {
    for (const user of ["pending", "removed", "outsider", "stranger"] as const) {
      await expect(insertReport(user, SCHOOL_A)).rejects.toThrow(/row-level security/);
    }
  });

  it("nobody can report on someone else's behalf", async () => {
    await expect(insertReport("parent3", SCHOOL_A, { reporter_id: users.parent1 })).rejects.toThrow(/row-level security/);
  });

  it("new reports always start open", async () => {
    await expect(insertReport("parent3", SCHOOL_A, { status: "returned" })).rejects.toThrow(/permission denied/);
  });

  it("photos must live in the school's folder", async () => {
    await expect(insertReport("parent3", SCHOOL_A, { photo_path: `${SCHOOL_B}/x.jpg` })).rejects.toThrow(/photo_in_school_folder/);
  });

  it("parents can edit their own reports but not other people's", async () => {
    const own = await as("parent1", "update public.reports set details = 'Dino sticker' where id = $1 returning id", [reports.lostBottle]);
    expect(own).toHaveLength(1);
    const other = await as("parent3", "update public.reports set details = 'hacked' where id = $1 returning id", [reports.lostBottle]);
    expect(other).toHaveLength(0);
  });

  it("status cannot be changed by editing a report directly", async () => {
    await expect(
      as("parent1", "update public.reports set status = 'returned' where id = $1", [reports.lostBottle]),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("joining the school", () => {
  let code: string;

  it("only coordinators can create invite links", async () => {
    await expect(as("parent1", "select public.create_invite($1)", [SCHOOL_A])).rejects.toThrow(/Only coordinators/);
    [{ create_invite: code }] = await as<{ create_invite: string }>("coordA", "select public.create_invite($1, 'Year 3')", [SCHOOL_A]);
    expect(code).toMatch(/^[0-9a-f]{24}$/);
  });

  it("invite codes are stored only as a hash", async () => {
    const rows = await as<{ code_hash: string }>("coordA", "select code_hash from public.invites");
    expect(rows.map((r) => r.code_hash)).not.toContain(code);
  });

  it("a valid invite creates a pending membership that sees nothing yet", async () => {
    await as("stranger", "select public.join_school($1)", [code]);
    const [m] = await as<{ status: string }>("stranger", "select status from public.memberships");
    expect(m.status).toBe("pending");
    expect(await count("stranger", "select * from public.reports")).toBe(0);
  });

  it("wrong or revoked invite codes are rejected", async () => {
    await expect(as("stranger", "select public.join_school('nope')")).rejects.toThrow(/not valid/);
    const [{ id }] = await as<{ id: string }>("coordA", "select id from public.invites limit 1");
    await as("coordA", "select public.revoke_invite($1)", [id]);
    await expect(as("outsider", "select public.join_school($1)", [code])).rejects.toThrow(/not valid/);
  });

  it("removed members cannot rejoin with a new link", async () => {
    const [{ create_invite: fresh }] = await as<{ create_invite: string }>("coordA", "select public.create_invite($1)", [SCHOOL_A]);
    await as("removed", "select public.join_school($1)", [fresh]);
    const [m] = await as<{ status: string }>("removed", "select status from public.memberships");
    expect(m.status).toBe("removed");
  });

  it("coordinators see applicants; parents only see their own membership", async () => {
    expect(await count("coordA", "select * from public.memberships where status = 'pending'")).toBe(2);
    expect(await count("parent1", "select * from public.memberships")).toBe(1);
  });

  it("only coordinators can approve, and approval grants access", async () => {
    await expect(
      as("parent1", "select public.set_membership($1, $2, 'approved')", [SCHOOL_A, users.pending]),
    ).rejects.toThrow(/Only coordinators/);
    await as("coordA", "select public.set_membership($1, $2, 'approved')", [SCHOOL_A, users.pending]);
    expect(await count("pending", "select * from public.reports")).toBeGreaterThan(0);
    await as("coordA", "select public.set_membership($1, $2, 'pending')", [SCHOOL_A, users.pending]);
  });

  it("coordinators cannot remove themselves by accident", async () => {
    await expect(
      as("coordA", "select public.set_membership($1, $2, 'removed')", [SCHOOL_A, users.coordA]),
    ).rejects.toThrow(/cannot remove/);
  });

  it("only the service role can create the first coordinator", async () => {
    await expect(
      as("parent1", "select public.bootstrap_coordinator($1, $2)", [SCHOOL_A, users.parent1]),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("profiles and contact details", () => {
  it("members see each other's names; outsiders don't", async () => {
    expect(await count("parent2", "select * from public.profiles where user_id = $1", [users.parent1])).toBe(1);
    expect(await count("outsider", "select * from public.profiles where user_id = $1", [users.parent1])).toBe(0);
  });

  it("applicants are visible to coordinators but not to other parents", async () => {
    expect(await count("coordA", "select * from public.profiles where user_id = $1", [users.pending])).toBe(1);
    expect(await count("parent1", "select * from public.profiles where user_id = $1", [users.pending])).toBe(0);
  });

  it("phone numbers are private to their owner", async () => {
    expect(await count("parent2", "select * from public.contact_details where user_id = $1", [users.parent1])).toBe(0);
    expect(await count("parent1", "select * from public.contact_details")).toBe(1);
  });

  it("parents can't edit someone else's profile", async () => {
    const rows = await as("parent2", "update public.profiles set parent_first_name = 'x' where user_id = $1 returning 1", [users.parent1]);
    expect(rows).toHaveLength(0);
  });
});

describe("matches", () => {
  let matchId: string;

  it("an uninvolved parent cannot dismiss or confirm someone else's pair", async () => {
    await expect(
      as("parent3", "select public.dismiss_suggestion($1, $2)", [reports.lostBottle, reports.foundBottle]),
    ).rejects.toThrow(/Only the parents/);
    await expect(
      as("parent3", "select public.confirm_match($1, $2)", [reports.lostBottle, reports.foundBottle]),
    ).rejects.toThrow(/Only the parents/);
  });

  it("members of another school cannot act on the pair at all", async () => {
    await expect(
      as("outsider", "select public.confirm_match($1, $2)", [reports.lostBottle, reports.foundBottle]),
    ).rejects.toThrow(/not found/);
  });

  it("a dismissed suggestion is hidden for everyone and can be undone", async () => {
    await as("parent1", "select public.dismiss_suggestion($1, $2)", [reports.lostBottle, reports.foundHat]);
    expect(await count("parent3", "select * from public.match_decisions where status = 'dismissed'")).toBe(1);
    await as("parent2", "select public.undo_dismiss($1, $2)", [reports.lostBottle, reports.foundHat]);
    expect(await count("parent3", "select * from public.match_decisions")).toBe(0);
  });

  it("nothing is matched until a parent confirms", async () => {
    expect(await reportStatus(reports.lostBottle)).toBe("open");
    expect(await reportStatus(reports.foundBottle)).toBe("open");
  });

  it("confirming marks both reports matched, visible only to the two parents", async () => {
    [{ confirm_match: matchId }] = await as<{ confirm_match: string }>(
      "parent2",
      "select public.confirm_match($1, $2, 72)",
      [reports.lostBottle, reports.foundBottle],
    );
    expect(await reportStatus(reports.lostBottle)).toBe("matched");
    expect(await reportStatus(reports.foundBottle)).toBe("matched");
    expect(await count("parent1", "select * from public.match_decisions where id = $1", [matchId])).toBe(1);
    expect(await count("parent3", "select * from public.match_decisions where id = $1", [matchId])).toBe(0);
  });

  it("the two parents can see each other's contact details; nobody else can", async () => {
    const rows = await as<{ side: string; email: string; phone: string }>(
      "parent1",
      "select side, email, phone from public.match_contacts($1)",
      [matchId],
    );
    expect(rows).toEqual([
      { side: "missing", email: "parent1@example.com", phone: "07700 900001" },
      { side: "found", email: "parent2@example.com", phone: "07700 900002" },
    ]);
    await expect(as("parent3", "select * from public.match_contacts($1)", [matchId])).rejects.toThrow(/Only the parents/);
  });

  it("a matched item cannot be matched again", async () => {
    await expect(
      as("parent1", "select public.confirm_match($1, $2)", [reports.lostBottle, reports.foundHat]),
    ).rejects.toThrow(/no longer open/);
  });

  it("matched reports can't be edited or deleted by the parent", async () => {
    const rows = await as("parent1", "update public.reports set details = 'x' where id = $1 returning 1", [reports.lostBottle]);
    expect(rows).toHaveLength(0);
    const deleted = await as("parent1", "delete from public.reports where id = $1 returning 1", [reports.lostBottle]);
    expect(deleted).toHaveLength(0);
  });

  it("a confirmation can be undone before the item is returned", async () => {
    await as("parent1", "select public.unconfirm_match($1)", [matchId]);
    expect(await reportStatus(reports.lostBottle)).toBe("open");
    [{ confirm_match: matchId }] = await as<{ confirm_match: string }>(
      "parent1",
      "select public.confirm_match($1, $2)",
      [reports.lostBottle, reports.foundBottle],
    );
  });

  it("only the two parents can mark it returned, which closes both reports", async () => {
    await expect(as("parent3", "select public.mark_returned($1)", [matchId])).rejects.toThrow(/Only the parents/);
    await as("parent1", "select public.mark_returned($1)", [matchId]);
    expect(await reportStatus(reports.lostBottle)).toBe("returned");
    expect(await reportStatus(reports.foundBottle)).toBe("returned");
  });

  it("parents can't write match decisions directly", async () => {
    await expect(
      as("parent1", "update public.match_decisions set status = 'confirmed'"),
    ).rejects.toThrow(/permission denied/);
  });

  it("coordinators can remove any report in their school", async () => {
    const deleted = await as("coordA", "delete from public.reports where id = $1 returning 1", [reports.foundHat]);
    expect(deleted).toHaveLength(1);
  });
});

describe("photo storage", () => {
  const put = (user: User, bucket: string, name: string) =>
    as(user, "insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3) returning id", [bucket, name, users[user]]);

  it("members upload report photos to their own folder in their school", async () => {
    expect(await put("parent1", "report-photos", `${SCHOOL_A}/${users.parent1}/a.jpg`)).toHaveLength(1);
  });

  it("uploads to another school or another parent's folder are refused", async () => {
    await expect(put("parent1", "report-photos", `${SCHOOL_B}/${users.parent1}/b.jpg`)).rejects.toThrow(/row-level security/);
    await expect(put("parent1", "report-photos", `${SCHOOL_A}/${users.parent2}/c.jpg`)).rejects.toThrow(/row-level security/);
    await expect(put("pending", "report-photos", `${SCHOOL_A}/${users.pending}/d.jpg`)).rejects.toThrow(/row-level security/);
  });

  it("report photos are only visible to members of the school", async () => {
    expect(await count("parent3", "select * from storage.objects where bucket_id = 'report-photos'")).toBe(1);
    expect(await count("outsider", "select * from storage.objects where bucket_id = 'report-photos'")).toBe(0);
    expect(await count("stranger", "select * from storage.objects where bucket_id = 'report-photos'")).toBe(0);
  });

  it("profile pictures go in the user's own folder and are seen by fellow members", async () => {
    expect(await put("parent1", "avatars", `${users.parent1}/me.jpg`)).toHaveLength(1);
    await expect(put("parent1", "avatars", `${users.parent2}/me.jpg`)).rejects.toThrow(/row-level security/);
    expect(await count("parent2", "select * from storage.objects where bucket_id = 'avatars'")).toBe(1);
    expect(await count("outsider", "select * from storage.objects where bucket_id = 'avatars'")).toBe(0);
  });
});
