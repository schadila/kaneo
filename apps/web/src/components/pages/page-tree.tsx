import {
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FileText, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { buildPageTree, pageAncestorIds } from "./build-page-tree";
import { dropZoneAt, pointerClientY } from "./drop-zone";
import { type MoveTarget, resolveDrop } from "./page-move";
import {
  type DropIndicator,
  PageTreeContext,
  type PageTreeContextValue,
} from "./page-tree-context";
import { PageTreeItem } from "./page-tree-item";
import type { PageListItem } from "./page-types";

// Droppable area below the tree: "move to the top level, at the end".
const ROOT_DROP_ID = "__page-tree-root__";

type PageTreeProps = {
  pages: PageListItem[];
  activePageId?: string;
  canEdit: boolean;
  creating: boolean;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onMove: (id: string, target: MoveTarget) => void;
};

export function PageTree({
  pages,
  activePageId,
  canEdit,
  creating,
  onSelect,
  onCreate,
  onMove,
}: PageTreeProps) {
  const { t } = useTranslation();
  const tree = useMemo(() => buildPageTree(pages), [pages]);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
  const [overRoot, setOverRoot] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  // Keep the open page visible, e.g. after following a link to a subpage.
  useEffect(() => {
    const ancestors = pageAncestorIds(pages, activePageId);
    if (ancestors.length === 0) return;
    setExpanded((current) =>
      ancestors.every((id) => current.has(id))
        ? current
        : new Set([...current, ...ancestors]),
    );
  }, [pages, activePageId]);

  const context = useMemo<PageTreeContextValue>(
    () => ({
      activePageId,
      expanded,
      canEdit,
      draggingId,
      dropIndicator,
      onToggle: (id) =>
        setExpanded((current) => {
          const next = new Set(current);
          if (!next.delete(id)) next.add(id);
          return next;
        }),
      onSelect,
      onAddChild: (parentId) => {
        setExpanded((current) => new Set([...current, parentId]));
        onCreate(parentId);
      },
    }),
    [
      activePageId,
      expanded,
      canEdit,
      draggingId,
      dropIndicator,
      onSelect,
      onCreate,
    ],
  );

  // Where the current drag would land, or null if that drop is not allowed.
  const targetFor = (
    event: DragMoveEvent | DragEndEvent,
  ): { target: MoveTarget; indicator: DropIndicator } | null => {
    const activeId = String(event.active.id);
    const over = event.over;
    if (!over) return null;
    if (over.id === ROOT_DROP_ID) {
      const target = resolveDrop(pages, activeId, null, "after");
      return target ? { target, indicator: null } : null;
    }
    const startY = pointerClientY(event.activatorEvent);
    if (startY === null) return null;
    const zone = dropZoneAt(startY + event.delta.y, over.rect);
    const overId = String(over.id);
    const target = resolveDrop(pages, activeId, overId, zone);
    return target ? { target, indicator: { overId, zone } } : null;
  };

  const handleDragStart = (event: DragStartEvent) =>
    setDraggingId(String(event.active.id));

  const handleDragMove = (event: DragMoveEvent) => {
    const result = targetFor(event);
    setOverRoot(event.over?.id === ROOT_DROP_ID && Boolean(result));
    setDropIndicator((current) => {
      const next = result?.indicator ?? null;
      return current?.overId === next?.overId && current?.zone === next?.zone
        ? current
        : next;
    });
  };

  const reset = () => {
    setDraggingId(null);
    setDropIndicator(null);
    setOverRoot(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const result = targetFor(event);
    reset();
    if (!result) return;
    const { parentId } = result.target;
    if (parentId)
      setExpanded((current) =>
        current.has(parentId) ? current : new Set([...current, parentId]),
      );
    onMove(String(event.active.id), result.target);
  };

  const dragging = draggingId
    ? pages.find((page) => page.id === draggingId)
    : undefined;

  return (
    <PageTreeContext.Provider value={context}>
      <nav
        aria-label={t("workspace:pages.treeLabel")}
        className="flex flex-col gap-1"
      >
        {canEdit && (
          <Button
            variant="ghost"
            size="xs"
            className="justify-start gap-1.5 text-muted-foreground"
            disabled={creating}
            onClick={() => onCreate(null)}
          >
            <Plus className="size-3.5" />
            {t("workspace:pages.newPage")}
          </Button>
        )}
        {tree.length === 0 ? (
          <p className="px-2 py-1 text-muted-foreground text-xs">
            {t("workspace:pages.noPages")}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={reset}
          >
            <ul>
              {tree.map((node) => (
                <PageTreeItem key={node.id} node={node} depth={0} />
              ))}
            </ul>
            {canEdit && (
              <RootDropArea active={Boolean(draggingId)} over={overRoot} />
            )}
            {createPortal(
              <DragOverlay dropAnimation={null}>
                {dragging && (
                  <div className="flex h-7 max-w-60 items-center gap-1.5 rounded-md border border-border bg-popover px-2 text-sm shadow-md">
                    {dragging.icon ?? <FileText className="size-3.5" />}
                    <span className="truncate">
                      {dragging.title.trim() || t("workspace:pages.untitled")}
                    </span>
                  </div>
                )}
              </DragOverlay>,
              document.body,
            )}
          </DndContext>
        )}
      </nav>
    </PageTreeContext.Provider>
  );
}

function RootDropArea({ active, over }: { active: boolean; over: boolean }) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({ id: ROOT_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-1 flex h-8 items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs transition-opacity",
        active ? "opacity-100" : "pointer-events-none opacity-0",
        over ? "border-primary bg-primary/10 text-foreground" : "border-border",
      )}
    >
      {t("workspace:pages.dropToTopLevel")}
    </div>
  );
}
