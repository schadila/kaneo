import { createContext, useContext } from "react";
import type { DropZone } from "./page-move";

export type DropIndicator = { overId: string; zone: DropZone } | null;

export type PageTreeContextValue = {
  activePageId?: string;
  expanded: ReadonlySet<string>;
  canEdit: boolean;
  draggingId: string | null;
  dropIndicator: DropIndicator;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
};

export const PageTreeContext = createContext<PageTreeContextValue | null>(null);

export function usePageTree() {
  const value = useContext(PageTreeContext);
  if (!value) throw new Error("usePageTree outside PageTreeContext");
  return value;
}
