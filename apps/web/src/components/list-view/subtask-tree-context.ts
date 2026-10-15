import { createContext, useContext } from "react";
import type Task from "@/types/task";

export type SubtaskTreeContextValue = {
  hasNesting: boolean;
  childrenOf: (taskId: string) => Task[];
  isNested: (taskId: string) => boolean;
  isOpen: (taskId: string) => boolean;
  toggle: (taskId: string) => void;
};

const empty: SubtaskTreeContextValue = {
  hasNesting: false,
  childrenOf: () => [],
  isNested: () => false,
  isOpen: () => false,
  toggle: () => {},
};

export const SubtaskTreeContext = createContext<SubtaskTreeContextValue>(empty);

export function useSubtaskTree() {
  return useContext(SubtaskTreeContext);
}
