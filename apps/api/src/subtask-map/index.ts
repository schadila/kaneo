import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import db, { schema } from "../database";
import {
  apiRouter,
  createRoute,
  errorResponse,
  jsonResponse,
  z,
} from "../openapi";
import { workspaceAccess } from "../utils/workspace-access-middleware";

// Eden: parent → subtask pairs of one project in a single query, so the list
// view can nest subtasks under their parent (the board payload only carries
// per-task subtask counts).
const subtaskPairSchema = z
  .object({ parentId: z.string(), childId: z.string() })
  .openapi("SubtaskPair");

const projectSubtasksRoute = createRoute({
  method: "get",
  operationId: "listProjectSubtaskPairs",
  path: "/project/{projectId}",
  tags: ["Tasks"],
  summary: "List subtask pairs of a project",
  description:
    "Parent/subtask pairs where both tasks belong to the project (relation type subtask)",
  middleware: [workspaceAccess.fromProject("projectId")] as const,
  request: { params: z.object({ projectId: z.string() }) },
  responses: {
    200: jsonResponse("Subtask pairs", z.array(subtaskPairSchema)),
    403: errorResponse("No access to the project"),
    404: errorResponse("Project not found"),
  },
});

const subtaskMap = apiRouter().openapi(projectSubtasksRoute, async (c) => {
  const { projectId } = c.req.valid("param");
  const parent = alias(schema.taskTable, "subtask_parent");
  const child = alias(schema.taskTable, "subtask_child");
  const pairs = await db
    .select({
      parentId: schema.taskRelationTable.sourceTaskId,
      childId: schema.taskRelationTable.targetTaskId,
    })
    .from(schema.taskRelationTable)
    .innerJoin(parent, eq(schema.taskRelationTable.sourceTaskId, parent.id))
    .innerJoin(child, eq(schema.taskRelationTable.targetTaskId, child.id))
    .where(
      and(
        eq(schema.taskRelationTable.relationType, "subtask"),
        eq(parent.projectId, projectId),
        eq(child.projectId, projectId),
      ),
    );
  return c.json(pairs, 200);
});

export default subtaskMap;
