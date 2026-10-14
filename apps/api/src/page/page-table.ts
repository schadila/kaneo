import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Wiki pages: projectId null = workspace wiki, otherwise the project's docs.
// parentId nests pages; children always share the parent's workspace/project.
//
// Deliberately NOT part of database/schema.ts: this fork-only table is created
// by migrate-page-table.ts instead of a Drizzle migration, so upstream Kaneo
// migrations never collide with it. Constraints and indexes live there.
export const pageTable = pgTable("page", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  projectId: text("project_id"),
  parentId: text("parent_id"),
  title: text("title").default("").notNull(),
  icon: text("icon"),
  content: text("content").default("").notNull(),
  position: integer("position").default(0).notNull(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { mode: "date" })
    .default(sql`(now() AT TIME ZONE 'utc')`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .default(sql`(now() AT TIME ZONE 'utc')`)
    .$onUpdate(() => new Date())
    .notNull(),
});
