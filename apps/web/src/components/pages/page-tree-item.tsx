import { useDraggable, useDroppable } from "@dnd-kit/core";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import type { PageNode } from "./build-page-tree";
import { usePageTree } from "./page-tree-context";
import type { PageListItem } from "./page-types";

type PageTreeItemProps = {
  node: PageNode<PageListItem>;
  depth: number;
};

export function PageTreeItem({ node, depth }: PageTreeItemProps) {
  const { t } = useTranslation();
  const tree = usePageTree();
  const isOpen = tree.expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const title = node.title.trim() || t("workspace:pages.untitled");
  const isDragging = tree.draggingId === node.id;
  const indicator =
    tree.dropIndicator?.overId === node.id ? tree.dropIndicator.zone : null;

  const drag = useDraggable({ id: node.id, disabled: !tree.canEdit });
  const drop = useDroppable({ id: node.id, disabled: !tree.canEdit });

  return (
    <li>
      <div
        ref={(element) => {
          drag.setNodeRef(element);
          drop.setNodeRef(element);
        }}
        {...drag.attributes}
        {...drag.listeners}
        // dnd-kit makes the row a focusable button; the inner buttons stay
        // the keyboard targets.
        tabIndex={-1}
        className={cn(
          "group/page relative flex h-7 items-center gap-0.5 rounded-md pr-1 text-sm",
          node.id === tree.activePageId
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          isDragging && "opacity-40",
          indicator === "inside" && "bg-primary/10 ring-1 ring-primary/50",
          indicator === "before" &&
            "before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-primary",
          indicator === "after" &&
            "after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
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
          onClick={() => tree.onToggle(node.id)}
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
          aria-current={node.id === tree.activePageId ? "page" : undefined}
          onClick={() => tree.onSelect(node.id)}
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
        {tree.canEdit && (
          <button
            type="button"
            aria-label={t("workspace:pages.addSubpage")}
            onClick={() => tree.onAddChild(node.id)}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/page:opacity-100"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <ul>
          {node.children.map((child) => (
            <PageTreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
