/**
 * Applies new files from supabase/migrations to the hosted database during
 * the Vercel build, so no one has to run SQL by hand. Uses the same tracking
 * table as the Supabase CLI. Skips quietly when no database URL is set
 * (e.g. local builds, which use `npx supabase start` instead).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.SUPABASE_DB_URL;
if (!url) {
  console.log("migrate: no database URL set, skipping.");
  process.exit(0);
}

// Supabase's certificate isn't in Node's default trust store; the connection
// is still encrypted.
const connectionString = url.replace(/[?&]sslmode=[^&]*/g, "");
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
const client = new pg.Client({ connectionString, ssl: local ? false : { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key, statements text[], name text
    );
  `);
  // One build at a time.
  await client.query("select pg_advisory_lock(726412)");
  const { rows } = await client.query("select version from supabase_migrations.schema_migrations");
  const applied = new Set(rows.map((r) => r.version));

  const dir = join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
    if (applied.has(version)) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    console.log(`migrate: applying ${file}`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into supabase_migrations.schema_migrations (version, statements, name) values ($1, $2, $3)",
        [version, [sql], rest.join("_")],
      );
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw new Error(`migrate: ${file} failed: ${err.message}`);
    }
  }
  console.log("migrate: database is up to date.");
} finally {
  await client.end();
}
