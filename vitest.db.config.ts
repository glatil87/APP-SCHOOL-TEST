import { defineConfig } from "vitest/config";

// Database access-rule tests. Needs a local Postgres; see scripts/test-db.sh.
export default defineConfig({
  test: { include: ["db-tests/**/*.test.ts"], fileParallelism: false, sequence: { concurrent: false } },
});
