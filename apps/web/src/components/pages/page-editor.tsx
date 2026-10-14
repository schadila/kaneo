import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  ListTodo,
  type LucideIcon,
  Strikethrough,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BubbleLinkEditor } from "@/components/editor/bubble-link-editor";
import { createEditorExtensions } from "@/components/editor/extensions";
import { selectionStartAnchor } from "@/components/editor/selection-start-anchor";
import { useEditorHighlighter } from "@/components/editor/use-editor-highlighter";
import { KaneoMention } from "@/components/task/extensions/kaneo-mention";
import type { MentionMember } from "@/components/task/extensions/mention-list";
import { MentionSuggestion } from "@/components/task/extensions/mention-suggestion";
import { ResizableImage } from "@/components/task/extensions/resizable-image";
import { SHIKI_CODEBLOCK_REFRESH_META } from "@/components/task/extensions/shiki-code-block";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { pasteMarkdown } from "@/lib/paste-markdown";
import { PageSlashMenu } from "./page-slash-menu";
import { usePageSlashMenu } from "./use-page-slash-menu";
import "tippy.js/dist/tippy.css";

const SHIKI_LANGUAGE_ALIASES: Record<string, string> = {
  excel: "csv",
  plaintext: "text",
  reasonml: "ocaml",
};

function formatMarkdown(markdown: string) {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n{2,}$/g, "\n");
}

type PageEditorProps = {
  // Read once on mount; remount (key={pageId}) to load another page.
  initialMarkdown: string;
  canEdit: boolean;
  mentionMembers: MentionMember[];
  onChange: (markdown: string) => void;
};

type BubbleAction = {
  icon: LucideIcon;
  label: string;
  active: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

export function PageEditor({
  initialMarkdown,
  canEdit,
  mentionMembers,
  onChange,
}: PageEditorProps) {
  const { t } = useTranslation();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mentionMembersRef = useRef(mentionMembers);
  mentionMembersRef.current = mentionMembers;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastMarkdownRef = useRef(formatMarkdown(initialMarkdown));
  const [isEditingLink, setIsEditingLink] = useState(false);
  const { highlighter, highlighterRef } = useEditorHighlighter();
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    content: initialMarkdown,
    contentType: "markdown",
    extensions: createEditorExtensions({
      placeholder: t("workspace:pages.editorPlaceholder"),
      highlighter: () => highlighterRef.current,
      resolveLanguage: (language) =>
        SHIKI_LANGUAGE_ALIASES[language] || language,
      image: ResizableImage,
      extra: [
        KaneoMention,
        MentionSuggestion.configure({
          getMembers: () => mentionMembersRef.current,
        }),
      ],
    }),
    editorProps: {
      attributes: { class: "kaneo-tiptap-prose" },
      handlePaste: (_view, event): boolean =>
        editorRef.current ? pasteMarkdown(editorRef.current, event) : false,
    },
    onUpdate: ({ editor: active }) => {
      const markdown = formatMarkdown(active.getMarkdown());
      if (markdown === lastMarkdownRef.current) return;
      lastMarkdownRef.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

  // Re-highlight code blocks once shiki is loaded and on theme switches.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const refresh = () =>
      editor.view.dispatch(
        editor.state.tr.setMeta(SHIKI_CODEBLOCK_REFRESH_META, true),
      );
    if (highlighter) refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [editor, highlighter]);

  const slash = usePageSlashMenu(editor, shellRef);

  const bubbleActions = useMemo<BubbleAction[]>(
    () => [
      {
        icon: Heading2,
        label: t("tasks:detail.editor.slash.commands.heading-2"),
        active: (e) => e.isActive("heading", { level: 2 }),
        run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        icon: Bold,
        label: t("workspace:pages.format.bold"),
        active: (e) => e.isActive("bold"),
        run: (e) => e.chain().focus().toggleBold().run(),
      },
      {
        icon: Italic,
        label: t("workspace:pages.format.italic"),
        active: (e) => e.isActive("italic"),
        run: (e) => e.chain().focus().toggleItalic().run(),
      },
      {
        icon: Strikethrough,
        label: t("workspace:pages.format.strike"),
        active: (e) => e.isActive("strike"),
        run: (e) => e.chain().focus().toggleStrike().run(),
      },
      {
        icon: Code,
        label: t("workspace:pages.format.code"),
        active: (e) => e.isActive("code"),
        run: (e) => e.chain().focus().toggleCode().run(),
      },
      {
        icon: List,
        label: t("tasks:detail.editor.slash.commands.bullet-list"),
        active: (e) => e.isActive("bulletList"),
        run: (e) => e.chain().focus().toggleBulletList().run(),
      },
      {
        icon: ListTodo,
        label: t("tasks:detail.editor.slash.commands.task-list"),
        active: (e) => e.isActive("taskList"),
        run: (e) => e.chain().focus().toggleTaskList().run(),
      },
    ],
    [t],
  );

  const bubbleAnchor = useCallback(
    () => (editor ? selectionStartAnchor(editor) : null),
    [editor],
  );
  const bubbleOptions = useMemo(
    () => ({ onHide: () => setIsEditingLink(false) }),
    [],
  );

  return (
    <div ref={shellRef} className="kaneo-tiptap-shell relative">
      {editor && canEdit && (
        <BubbleMenu
          editor={editor}
          className="kaneo-tiptap-bubble"
          getReferencedVirtualElement={bubbleAnchor}
          options={bubbleOptions}
          shouldShow={({ editor: active, from, to }) =>
            !active.isActive("image") && from !== to
          }
        >
          {isEditingLink ? (
            <BubbleLinkEditor
              editor={editor}
              buttonClassName="kaneo-tiptap-bubble-btn"
              onClose={() => setIsEditingLink(false)}
            />
          ) : (
            <>
              {bubbleActions.map((action) => (
                <Button
                  key={action.label}
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={action.label}
                  className={cn(
                    "kaneo-tiptap-bubble-btn",
                    action.active(editor) && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => action.run(editor)}
                >
                  <action.icon className="size-3.5" />
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                aria-label={t("workspace:pages.format.link")}
                className={cn(
                  "kaneo-tiptap-bubble-btn",
                  editor.isActive("link") && "bg-accent text-accent-foreground",
                )}
                onClick={() => setIsEditingLink(true)}
              >
                <Link2 className="size-3.5" />
              </Button>
            </>
          )}
        </BubbleMenu>
      )}

      {editor && canEdit && slash.menu && (
        <PageSlashMenu
          menu={slash.menu}
          commands={slash.filtered}
          onHover={(index) =>
            slash.setMenu((current) =>
              current ? { ...current, selectedIndex: index } : current,
            )
          }
          onRun={slash.run}
        />
      )}

      <EditorContent editor={editor} className="kaneo-tiptap-content" />
    </div>
  );
}
