import { sql } from "drizzle-orm";
import db from "../database";

// Idempotent schema for the fork-only page table, run at startup after
// Kaneo's Drizzle migrations. Kept out of the Drizzle journal on purpose: a
// fork migration numbered next to upstream's would collide on every upstream
// merge, and Drizzle skips migrations older than the last applied one.
// Later changes: append ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
export async function migratePageTable() {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('eden-page-table'))`,
    );
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS "page" (
        "id" text PRIMARY KEY NOT NULL,
        "workspace_id" text NOT NULL
          REFERENCES "workspace"("id") ON DELETE cascade ON UPDATE cascade,
        "project_id" text,
        "parent_id" text
          REFERENCES "page"("id") ON DELETE cascade ON UPDATE cascade,
        "title" text DEFAULT '' NOT NULL,
        "icon" text,
        "content" text DEFAULT '' NOT NULL,
        "position" integer DEFAULT 0 NOT NULL,
        "created_by" text
          REFERENCES "user"("id") ON DELETE set null ON UPDATE cascade,
        "updated_by" text
          REFERENCES "user"("id") ON DELETE set null ON UPDATE cascade,
        "created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc') NOT NULL,
        "updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc') NOT NULL,
        FOREIGN KEY ("workspace_id", "project_id")
          REFERENCES "project"("workspace_id", "id")
          ON DELETE cascade ON UPDATE cascade
      )
    `);
    await tx.execute(sql`
      CREATE INDEX IF NOT EXISTS "page_workspace_project_idx"
        ON "page" ("workspace_id", "project_id")
    `);
    await tx.execute(sql`
      CREATE INDEX IF NOT EXISTS "page_parent_id_idx" ON "page" ("parent_id")
    `);
  });
}
