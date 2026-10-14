import { useTranslation } from "react-i18next";
import type { SlashCommand } from "@/components/editor/slash-commands";
import { ShortcutKeys } from "@/components/shortcuts/shortcut-keys";
import { cn } from "@/lib/cn";
import type { SlashMenuState } from "./use-page-slash-menu";

const GROUPS = ["text", "lists", "insert"] as const;

type PageSlashMenuProps = {
  menu: SlashMenuState;
  commands: SlashCommand[];
  onHover: (index: number) => void;
  onRun: (command: SlashCommand) => void;
};

export function PageSlashMenu({
  menu,
  commands,
  onHover,
  onRun,
}: PageSlashMenuProps) {
  const { t } = useTranslation();

  return (
    <div
      className="kaneo-tiptap-slash-menu"
      style={{ top: menu.top, left: menu.left, position: "absolute" }}
    >
      {commands.length === 0 ? (
        <div className="kaneo-tiptap-slash-empty">
          {t("tasks:detail.editor.slash.empty")}
        </div>
      ) : (
        GROUPS.map((group) => {
          const items = commands.filter((command) => command.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="kaneo-tiptap-slash-group">
              <div className="kaneo-tiptap-slash-group-title">
                {t(`tasks:detail.editor.slash.groups.${group}`)}
              </div>
              {items.map((command) => {
                const index = commands.indexOf(command);
                return (
                  <button
                    key={command.id}
                    type="button"
                    className={cn(
                      "kaneo-tiptap-slash-item",
                      menu.selectedIndex === index && "is-selected",
                    )}
                    onMouseEnter={() => onHover(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onRun(command);
                    }}
                  >
                    <span className="kaneo-tiptap-slash-label">
                      {command.label}
                    </span>
                    {command.shortcutId && (
                      <span className="kaneo-tiptap-slash-shortcut">
                        <ShortcutKeys id={command.shortcutId} tone="muted" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
