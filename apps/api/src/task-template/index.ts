import {
  apiRouter,
  createRoute,
  errorResponse,
  jsonResponse,
} from "../openapi";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import applyTemplate from "./controllers/apply-template";
import createTemplate from "./controllers/create-template";
import deleteTemplate from "./controllers/delete-template";
import listTemplates from "./controllers/list-templates";
import updateTemplate from "./controllers/update-template";
import {
  applyTemplateResultSchema,
  templateListSchema,
  templateSchema,
} from "./response";
import {
  applyTemplateBody,
  createTemplateBody,
  templateParam,
  updateTemplateBody,
  workspaceIdParam,
} from "./schema";
import { templateAccess } from "./template-access";

// Like wiki pages, templates reuse task permissions instead of a new role
// resource: whoever may edit tasks may maintain templates; applying one
// creates tasks and therefore needs task:create.
const TEMPLATE_WRITE = { task: ["update"] };
const TEMPLATE_APPLY = { task: ["create"] };

const listTemplatesRoute = createRoute({
  method: "get",
  operationId: "listTaskTemplates",
  path: "/workspace/{workspaceId}",
  tags: ["Task templates"],
  summary: "List task templates",
  description: "List the task templates of a workspace",
  middleware: [workspaceAccess.fromParam()] as const,
  request: { params: workspaceIdParam },
  responses: {
    200: jsonResponse("Task templates", templateListSchema),
    404: errorResponse("Workspace not found"),
  },
});

const createTemplateRoute = createRoute({
  method: "post",
  operationId: "createTaskTemplate",
  path: "/",
  tags: ["Task templates"],
  summary: "Create task template",
  description: "Create a workspace task template (a list of tasks)",
  middleware: [
    workspaceAccess.fromBody(),
    requireWorkspacePermission(TEMPLATE_WRITE),
  ] as const,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: createTemplateBody } },
    },
  },
  responses: {
    200: jsonResponse("Template created", templateSchema),
    403: errorResponse("Missing task:update permission"),
    404: errorResponse("Workspace not found"),
  },
});

const updateTemplateRoute = createRoute({
  method: "put",
  operationId: "updateTaskTemplate",
  path: "/{id}",
  tags: ["Task templates"],
  summary: "Update task template",
  description: "Replace a template's name, description and tasks",
  middleware: [
    templateAccess(),
    requireWorkspacePermission(TEMPLATE_WRITE),
  ] as const,
  request: {
    params: templateParam,
    body: {
      required: true,
      content: { "application/json": { schema: updateTemplateBody } },
    },
  },
  responses: {
    200: jsonResponse("Template updated", templateSchema),
    403: errorResponse("Missing task:update permission"),
    404: errorResponse("Template not found"),
  },
});

const deleteTemplateRoute = createRoute({
  method: "delete",
  operationId: "deleteTaskTemplate",
  path: "/{id}",
  tags: ["Task templates"],
  summary: "Delete task template",
  description: "Delete a template; tasks created from it stay",
  middleware: [
    templateAccess(),
    requireWorkspacePermission(TEMPLATE_WRITE),
  ] as const,
  request: { params: templateParam },
  responses: {
    200: jsonResponse("Template deleted", templateSchema),
    403: errorResponse("Missing task:update permission"),
    404: errorResponse("Template not found"),
  },
});

const applyTemplateRoute = createRoute({
  method: "post",
  operationId: "applyTaskTemplate",
  path: "/{id}/apply",
  tags: ["Task templates"],
  summary: "Apply task template",
  description:
    "Create the template's tasks in a project of the same workspace. Due dates are the start date plus each item's day offset; labels are matched to workspace labels by name.",
  middleware: [
    templateAccess(),
    requireWorkspacePermission(TEMPLATE_APPLY),
  ] as const,
  request: {
    params: templateParam,
    body: {
      required: true,
      content: { "application/json": { schema: applyTemplateBody } },
    },
  },
  responses: {
    200: jsonResponse("Tasks created", applyTemplateResultSchema),
    400: errorResponse("Invalid status, assignee or required custom fields"),
    403: errorResponse("No access to the project, or missing task:create"),
    404: errorResponse("Template or project not found"),
  },
});

const taskTemplate = apiRouter()
  .openapi(listTemplatesRoute, async (c) => {
    const { workspaceId } = c.req.valid("param");
    return c.json(await listTemplates(workspaceId), 200);
  })
  .openapi(createTemplateRoute, async (c) => {
    return c.json(
      await createTemplate(c.get("userId"), c.req.valid("json")),
      200,
    );
  })
  .openapi(updateTemplateRoute, async (c) => {
    const { id } = c.req.valid("param");
    return c.json(
      await updateTemplate(id, c.get("userId"), c.req.valid("json")),
      200,
    );
  })
  .openapi(deleteTemplateRoute, async (c) => {
    const { id } = c.req.valid("param");
    return c.json(await deleteTemplate(id), 200);
  })
  .openapi(applyTemplateRoute, async (c) => {
    const { id } = c.req.valid("param");
    return c.json(
      await applyTemplate(id, c.get("userId"), c.req.valid("json")),
      200,
    );
  });

export default taskTemplate;
