import { ChevronRight, FileText, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import type { PageNode } from "./build-page-tree";
import type { PageListItem } from "./page-types";

type PageTreeItemProps = {
  node: PageNode<PageListItem>;
  depth: number;
  activePageId?: string;
  expanded: ReadonlySet<string>;
  canEdit: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
};

export function PageTreeItem({
  node,
  depth,
  activePageId,
  expanded,
  canEdit,
  onToggle,
  onSelect,
  onAddChild,
}: PageTreeItemProps) {
  const { t } = useTranslation();
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const title = node.title.trim() || t("workspace:pages.untitled");

  return (
    <li>
      <div
        className={cn(
          "group/page flex h-7 items-center gap-0.5 rounded-md pr-1 text-sm",
          node.id === activePageId
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
        style={{ paddingLeft: depth * 12 + 2 }}
      >
        <button
          type="button"
          aria-label={
            isOpen ? t("workspace:pages.collapse") : t("workspace:pages.expand")
          }
          aria-expanded={hasChildren ? isOpen : undefined}
          disabled={!hasChildren}
          onClick={() => onToggle(node.id)}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-0"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform",
              isOpen && "rotate-90",
            )}
          />
        </button>
        <button
          type="button"
          aria-current={node.id === activePageId ? "page" : undefined}
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {node.icon ? (
            <span className="w-4 shrink-0 text-center text-[13px]">
              {node.icon}
            </span>
          ) : (
            <FileText className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{title}</span>
        </button>
        {canEdit && (
          <button
            type="button"
            aria-label={t("workspace:pages.addSubpage")}
            onClick={() => onAddChild(node.id)}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/page:opacity-100"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <ul>
          {node.children.map((child) => (
            <PageTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activePageId={activePageId}
              expanded={expanded}
              canEdit={canEdit}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
