import {
  apiRouter,
  createRoute,
  errorResponse,
  jsonResponse,
} from "../openapi";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createPage from "./controllers/create-page";
import deletePage from "./controllers/delete-page";
import getPage from "./controllers/get-page";
import getPages from "./controllers/get-pages";
import getRecentPages from "./controllers/get-recent-pages";
import movePage from "./controllers/move-page";
import updatePage from "./controllers/update-page";
import { pageAccess } from "./page-access";
import { pageListSchema, pageSchema, recentPageListSchema } from "./response";
import {
  createPageBody,
  listPagesQuery,
  movePageBody,
  pageParam,
  updatePageBody,
  workspaceIdParam,
} from "./schema";

// Pages reuse the task permissions instead of adding a new resource to the
// role statement: whoever may edit tasks may edit the wiki, viewers only read.
const PAGE_WRITE = { task: ["update"] };

const listPagesRoute = createRoute({
  method: "get",
  operationId: "listPages",
  path: "/workspace/{workspaceId}",
  tags: ["Pages"],
  summary: "List pages",
  description:
    "List the page tree (without content) of the workspace wiki, or of a project's docs when projectId is given",
  middleware: [workspaceAccess.fromParam()] as const,
  request: { params: workspaceIdParam, query: listPagesQuery },
  responses: {
    200: jsonResponse("Pages in tree order", pageListSchema),
    403: errorResponse("No access to the project"),
    404: errorResponse("Workspace or project not found"),
  },
});

const listRecentPagesRoute = createRoute({
  method: "get",
  operationId: "listRecentPages",
  path: "/recent",
  tags: ["Pages"],
  summary: "List my recent pages",
  description:
    "Pages the caller recently created or edited, across all of their workspaces",
  responses: {
    200: jsonResponse("Recent pages, newest first", recentPageListSchema),
  },
});

const getPageRoute = createRoute({
  method: "get",
  operationId: "getPage",
  path: "/{id}",
  tags: ["Pages"],
  summary: "Get page",
  description: "Get a page including its markdown content",
  middleware: [pageAccess()] as const,
  request: { params: pageParam },
  responses: {
    200: jsonResponse("Page details", pageSchema),
    403: errorResponse("No access to the project"),
    404: errorResponse("Page not found"),
  },
});

const createPageRoute = createRoute({
  method: "post",
  operationId: "createPage",
  path: "/",
  tags: ["Pages"],
  summary: "Create page",
  description:
    "Create a wiki page, a project doc (projectId) or a subpage (parentId)",
  middleware: [
    workspaceAccess.fromBody(),
    requireWorkspacePermission(PAGE_WRITE),
  ] as const,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: createPageBody } },
    },
  },
  responses: {
    200: jsonResponse("Page created", pageSchema),
    400: errorResponse("Parent page belongs to a different project"),
    403: errorResponse("No access to the project, or missing task:update"),
    404: errorResponse("Workspace, project or parent page not found"),
  },
});

const updatePageRoute = createRoute({
  method: "put",
  operationId: "updatePage",
  path: "/{id}",
  tags: ["Pages"],
  summary: "Update page",
  description: "Update a page's title, icon or markdown content",
  middleware: [pageAccess(), requireWorkspacePermission(PAGE_WRITE)] as const,
  request: {
    params: pageParam,
    body: {
      required: true,
      content: { "application/json": { schema: updatePageBody } },
    },
  },
  responses: {
    200: jsonResponse("Page updated", pageSchema),
    403: errorResponse("No access to the project, or missing task:update"),
    404: errorResponse("Page not found"),
  },
});

const movePageRoute = createRoute({
  method: "put",
  operationId: "movePage",
  path: "/{id}/move",
  tags: ["Pages"],
  summary: "Move page",
  description:
    "Move a page to another parent (null = top level) and/or position within the same wiki or project docs",
  middleware: [pageAccess(), requireWorkspacePermission(PAGE_WRITE)] as const,
  request: {
    params: pageParam,
    body: {
      required: true,
      content: { "application/json": { schema: movePageBody } },
    },
  },
  responses: {
    200: jsonResponse("Page moved", pageSchema),
    400: errorResponse(
      "Target is outside the page's wiki/docs, or would nest the page in itself",
    ),
    403: errorResponse("No access to the project, or missing task:update"),
    404: errorResponse("Page not found"),
  },
});

const deletePageRoute = createRoute({
  method: "delete",
  operationId: "deletePage",
  path: "/{id}",
  tags: ["Pages"],
  summary: "Delete page",
  description: "Delete a page together with all of its subpages",
  middleware: [pageAccess(), requireWorkspacePermission(PAGE_WRITE)] as const,
  request: { params: pageParam },
  responses: {
    200: jsonResponse("Page deleted", pageSchema),
    403: errorResponse("No access to the project, or missing task:update"),
    404: errorResponse("Page not found"),
  },
});

const page = apiRouter()
  .openapi(listPagesRoute, async (c) => {
    const { workspaceId } = c.req.valid("param");
    const { projectId } = c.req.valid("query");
    return c.json(await getPages(c.get("userId"), workspaceId, projectId), 200);
  })
  // Registered before /{id} so "recent" is not taken for a page id.
  .openapi(listRecentPagesRoute, async (c) => {
    return c.json(await getRecentPages(c.get("userId")), 200);
  })
  .openapi(getPageRoute, async (c) => {
    const { id } = c.req.valid("param");
    return c.json(await getPage(id), 200);
  })
  .openapi(createPageRoute, async (c) => {
    const body = c.req.valid("json");
    return c.json(await createPage(c.get("userId"), body), 200);
  })
  .openapi(updatePageRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    return c.json(await updatePage(id, c.get("userId"), body), 200);
  })
  .openapi(movePageRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    return c.json(await movePage(id, c.get("userId"), body), 200);
  })
  .openapi(deletePageRoute, async (c) => {
    const { id } = c.req.valid("param");
    return c.json(await deletePage(id), 200);
  });

export default page;
