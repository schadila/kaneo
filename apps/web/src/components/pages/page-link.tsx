import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type PageLinkProps = {
  workspaceId: string;
  projectId: string | null;
  pageId: string;
  className?: string;
  children: ReactNode;
};

// Wiki pages open in the workspace wiki, project pages in the project's docs.
export function PageLink({
  workspaceId,
  projectId,
  pageId,
  className,
  children,
}: PageLinkProps) {
  return projectId ? (
    <Link
      to="/dashboard/workspace/$workspaceId/project/$projectId/docs"
      params={{ workspaceId, projectId }}
      search={{ page: pageId }}
      className={className}
    >
      {children}
    </Link>
  ) : (
    <Link
      to="/dashboard/workspace/$workspaceId/wiki"
      params={{ workspaceId }}
      search={{ page: pageId }}
      className={className}
    >
      {children}
    </Link>
  );
}
