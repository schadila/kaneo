import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  richTextCommands,
  type SlashCommand,
} from "@/components/editor/slash-commands";

export type SlashMenuState = {
  from: number;
  to: number;
  query: string;
  top: number;
  left: number;
  selectedIndex: number;
};

// "/" command menu, same trigger rules and commands as the task description.
export function usePageSlashMenu(
  editor: Editor | null,
  shellRef: React.RefObject<HTMLElement | null>,
) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<SlashMenuState | null>(null);
  const menuRef = useRef(menu);
  menuRef.current = menu;

  const commands = useMemo(
    () =>
      richTextCommands.map((command) => ({
        ...command,
        label: t(`tasks:detail.editor.slash.commands.${command.id}`, {
          defaultValue: command.label,
        }),
      })),
    [t],
  );

  const filtered = useMemo(() => {
    const query = menu?.query.trim().toLowerCase() || "";
    if (!query) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(query) ||
        command.search.includes(query),
    );
  }, [commands, menu?.query]);
  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;

  const run = useCallback(
    (command: SlashCommand) => {
      const current = menuRef.current;
      if (!editor || !current) return;
      command.run(editor, { from: current.from, to: current.to });
      setMenu(null);
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const { state, view } = editor;
      const { $from } = state.selection;
      if (!state.selection.empty || $from.parent.type.name === "codeBlock") {
        setMenu(null);
        return;
      }
      const before = state.doc.textBetween(
        $from.start(),
        $from.pos,
        "\n",
        "\0",
      );
      const match = /(?:^|\s)\/([^\s/]*)$/.exec(before);
      if (!match) {
        setMenu(null);
        return;
      }
      const query = match[1] || "";
      const coords = view.coordsAtPos($from.pos);
      const shell = shellRef.current?.getBoundingClientRect();
      setMenu((current) => ({
        from: $from.pos - query.length - 1,
        to: $from.pos,
        query,
        top: coords.bottom - (shell?.top ?? 0) + 6,
        left: coords.left - (shell?.left ?? 0),
        selectedIndex: current?.query === query ? current.selectedIndex : 0,
      }));
    };
    editor.on("selectionUpdate", sync);
    editor.on("update", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("update", sync);
    };
  }, [editor, shellRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = menuRef.current;
      if (!editor || !current || !editor.isFocused) return;
      const list = filteredRef.current;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setMenu(null);
        return;
      }
      if (!list.length) return;
      const move = (delta: number) =>
        setMenu((value) =>
          value
            ? {
                ...value,
                selectedIndex:
                  (value.selectedIndex + delta + list.length) % list.length,
              }
            : value,
        );
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const command = list[current.selectedIndex] ?? list[0];
        if (command) run(command);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [editor, run]);

  return { menu, setMenu, filtered, run };
}
