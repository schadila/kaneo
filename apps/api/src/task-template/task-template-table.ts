import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { VALID_PRIORITIES } from "../task/validate-task-fields";

export type TaskTemplateItem = {
  title: string;
  description?: string;
  priority: (typeof VALID_PRIORITIES)[number];
  // Due date = start date chosen when applying + this many days; null = none.
  dueOffsetDays: number | null;
  // Workspace label names; resolved to the workspace labels when applied.
  labels: string[];
};

// Workspace task templates ("Vorlagen"). Fork-only, like the page table: not
// in database/schema.ts, created by migrate-task-template-table.ts.
export const taskTemplateTable = pgTable("task_template", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  items: jsonb("items").$type<TaskTemplateItem[]>().default([]).notNull(),
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
