import { migratePageTable } from "./page/migrate-page-table";
import { migrateTaskTemplateTable } from "./task-template/migrate-task-template-table";

// Eden fork: idempotent schema for fork-only tables, run at startup after
// Kaneo's own Drizzle migrations. One entry point keeps the fork's footprint
// in index.ts to a single line. See EDEN.md → Datenbank.
export async function runEdenMigrations() {
  await migratePageTable();
  await migrateTaskTemplateTable();
}
