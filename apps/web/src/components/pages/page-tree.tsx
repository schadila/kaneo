import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { buildPageTree, pageAncestorIds } from "./build-page-tree";
import { PageTreeItem } from "./page-tree-item";
import type { PageListItem } from "./page-types";

type PageTreeProps = {
  pages: PageListItem[];
  activePageId?: string;
  canEdit: boolean;
  creating: boolean;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
};

export function PageTree({
  pages,
  activePageId,
  canEdit,
  creating,
  onSelect,
  onCreate,
}: PageTreeProps) {
  const { t } = useTranslation();
  const tree = useMemo(() => buildPageTree(pages), [pages]);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

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

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const addChild = (parentId: string) => {
    setExpanded((current) => new Set([...current, parentId]));
    onCreate(parentId);
  };

  return (
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
        <ul>
          {tree.map((node) => (
            <PageTreeItem
              key={node.id}
              node={node}
              depth={0}
              activePageId={activePageId}
              expanded={expanded}
              canEdit={canEdit}
              onToggle={toggle}
              onSelect={onSelect}
              onAddChild={addChild}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}
