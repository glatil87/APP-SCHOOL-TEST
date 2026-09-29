import { execSync } from "node:child_process";

/** Start every run from an empty local database (needs `npx supabase start`). */
export default function globalSetup() {
  execSync("npx supabase db reset --local", { stdio: "inherit" });
}
