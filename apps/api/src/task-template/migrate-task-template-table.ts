import { sql } from "drizzle-orm";
import db from "../database";

// Idempotent schema for the fork-only task_template table (see
// page/migrate-page-table.ts for why this is not a Drizzle migration).
export async function migrateTaskTemplateTable() {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('eden-task-template-table'))`,
    );
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS "task_template" (
        "id" text PRIMARY KEY NOT NULL,
        "workspace_id" text NOT NULL
          REFERENCES "workspace"("id") ON DELETE cascade ON UPDATE cascade,
        "name" text NOT NULL,
        "description" text DEFAULT '' NOT NULL,
        "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "created_by" text
          REFERENCES "user"("id") ON DELETE set null ON UPDATE cascade,
        "updated_by" text
          REFERENCES "user"("id") ON DELETE set null ON UPDATE cascade,
        "created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc') NOT NULL,
        "updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc') NOT NULL
      )
    `);
    await tx.execute(sql`
      CREATE INDEX IF NOT EXISTS "task_template_workspace_idx"
        ON "task_template" ("workspace_id")
    `);
  });
}
