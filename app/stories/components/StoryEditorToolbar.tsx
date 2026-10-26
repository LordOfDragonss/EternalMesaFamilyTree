"use client";

import type { ReactNode } from "react";
import {
    ActionIcon,
    Group,
    Select,
    Text,
    Tooltip,
} from "@mantine/core";
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    ArrowDown,
    ArrowUp,
    Bold,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    ImagePlus,
    Italic,
    List,
    LinkIcon,
    ListOrdered,
    MessageSquare, // Add this
    Quote,
    Redo2,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
    Unlink,
    X,
} from "lucide-react";
import {
    Extension,
    type Editor,
} from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import classes from "../story-editor.module.css";

const APP_COLOR_PRESET = {
    label: "App accent",
    value: "#E9904F",
};

function ToolbarButton({
    label,
    active = false,
    disabled = false,
    onClick,
    children,
}: {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <Tooltip label={label} withArrow>
            <ActionIcon
                type="button"
                variant={active ? "light" : "subtle"}
                color={active ? "mesa" : "gray"}
                disabled={disabled}
                aria-label={label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={onClick}
                className={classes.toolbarButton}
            >
                {children}
            </ActionIcon>
        </Tooltip>
    );
}

function ToolbarDivider() {
    return <span className={classes.toolbarDivider} />;
}

export function moveSelectedBlock(
    editor: Editor,
    direction: -1 | 1,
): boolean {
    const { state, view } = editor;
    const { doc, selection } = state;

    const blocks: Array<{
        node: ProseMirrorNode;
        offset: number;
    }> = [];

    doc.forEach((node, offset) => {
        blocks.push({ node, offset });
    });

    if (blocks.length < 2) return false;

    const currentIndex = blocks.findIndex(({ node, offset }) => {
        return (
            selection.from >= offset &&
            selection.from <= offset + node.nodeSize
        );
    });

    if (currentIndex < 0) return false;

    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= blocks.length) return false;

    const current = blocks[currentIndex];
    const target = blocks[targetIndex];

    if (!current || !target) return false;

    const start = Math.min(current.offset, target.offset);

    const end = Math.max(
        current.offset + current.node.nodeSize,
        target.offset + target.node.nodeSize,
    );

    const replacement =
        direction === -1
            ? Fragment.fromArray([current.node, target.node])
            : Fragment.fromArray([target.node, current.node]);

    const transaction = state.tr.replaceWith(start, end, replacement);

    const newBlockStart =
        direction === -1
            ? target.offset
            : current.offset + target.node.nodeSize;

    const relativePosition = Math.max(
        1,
        Math.min(
            selection.from - current.offset,
            current.node.nodeSize - 1,
        ),
    );

    const newCursorPosition = Math.min(
        newBlockStart + relativePosition,
        transaction.doc.content.size,
    );

    transaction.setSelection(
        TextSelection.near(
            transaction.doc.resolve(newCursorPosition),
        ),
    );

    view.dispatch(transaction);
    view.focus();

    return true;
}

function duplicateSelectedBlock(editor: Editor): boolean {
    const { state, view } = editor;
    const selectionPosition = state.selection.from;

    const blocks: Array<{
        node: ProseMirrorNode;
        offset: number;
    }> = [];

    state.doc.forEach((node, offset) => {
        blocks.push({ node, offset });
    });

    const current = blocks.find(({ node, offset }) =>
        selectionPosition >= offset &&
        selectionPosition <= offset + node.nodeSize
    );

    if (!current) return false;

    const insertPosition = current.offset + current.node.nodeSize;
    const transaction = state.tr.insert(insertPosition, current.node);

    transaction.setSelection(
        TextSelection.near(
            transaction.doc.resolve(
                Math.min(insertPosition + 1, transaction.doc.content.size),
            ),
        ),
    );

    view.dispatch(transaction);
    view.focus();

    return true;
}

export const StoryBlockShortcuts = Extension.create({
    name: "storyBlockShortcuts",

    addKeyboardShortcuts() {
        return {
            "Alt-ArrowUp": () => moveSelectedBlock(this.editor, -1),
            "Alt-ArrowDown": () => moveSelectedBlock(this.editor, 1),
            "Mod-Shift-d": () => duplicateSelectedBlock(this.editor),
        };
    },
});

type StoryEditorToolbarProps = {
    editor: Editor;
    textColor: string;
    setTextColor: (color: string) => void;
    legacyColors: { label: string; value: string }[];
    onInsertImage: () => void;
    onAddExternalLink: () => void;
    onLinkArchiveRecord: () => void;
    onAddEditorialComment: () => void;
};

export default function StoryEditorToolbar({
    editor,
    textColor,
    setTextColor,
    onInsertImage,
    legacyColors,
    onAddExternalLink,
    onLinkArchiveRecord,
    onAddEditorialComment,
}: StoryEditorToolbarProps) {
    const hasLinkInSelection = useEditorState({
        editor,
        selector: ({ editor }) => {
            const { state } = editor;
            const { selection, doc, storedMarks } = state;

            // When the cursor is inside a link, allow removing it.
            if (selection.empty) {
                const marks = storedMarks ?? selection.$from.marks();

                if (marks.some((mark) => mark.type.name === "link")) {
                    return true;
                }

                // Also handle a cursor directly beside a link.
                const adjacentNodes = [
                    selection.$from.nodeBefore,
                    selection.$from.nodeAfter,
                ];

                return adjacentNodes.some((node) =>
                    node?.marks.some((mark) => mark.type.name === "link"),
                );
            }

            // When text is selected, check whether any part is linked.
            let found = false;

            doc.nodesBetween(selection.from, selection.to, (node) => {
                if (
                    node.isText &&
                    node.marks.some((mark) => mark.type.name === "link")
                ) {
                    found = true;
                }
            });

            return found;
        },
    });
    function removeLink() {
        editor.chain().focus().unsetLink().unsetColor().run();
    }
    const legacyColorPresets = [
        ...legacyColors,
        APP_COLOR_PRESET,
    ];
    return (
        <div className={classes.toolbar}>
            <Group gap={3} wrap="wrap">
                <ToolbarButton
                    label="Bold"
                    active={editor.isActive("bold")}
                    onClick={() =>
                        editor.chain().focus().toggleBold().run()
                    }
                >
                    <Bold size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Italic"
                    active={editor.isActive("italic")}
                    onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                    }
                >
                    <Italic size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Underline"
                    active={editor.isActive("underline")}
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                >
                    <UnderlineIcon size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Strikethrough"
                    active={editor.isActive("strike")}
                    onClick={() =>
                        editor.chain().focus().toggleStrike().run()
                    }
                >
                    <Strikethrough size={16} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Heading 1"
                    active={editor.isActive("heading", { level: 1 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                >
                    <Heading1 size={17} />
                </ToolbarButton>

                <ToolbarButton
                    label="Heading 2"
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    <Heading2 size={17} />
                </ToolbarButton>

                <ToolbarButton
                    label="Heading 3"
                    active={editor.isActive("heading", { level: 3 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                >
                    <Heading3 size={17} />
                </ToolbarButton>

                <ToolbarButton
                    label="Heading 4"
                    active={editor.isActive("heading", { level: 4 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 4 }).run()
                    }
                >
                    <Heading4 size={17} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Bulleted list"
                    active={editor.isActive("bulletList")}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    <List size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Numbered list"
                    active={editor.isActive("orderedList")}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                >
                    <ListOrdered size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Blockquote"
                    active={editor.isActive("blockquote")}
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                >
                    <Quote size={16} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Align text left"
                    active={editor.isActive({ textAlign: "left" })}
                    onClick={() =>
                        editor.chain().focus().setTextAlign("left").run()
                    }
                >
                    <AlignLeft size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Center text"
                    active={editor.isActive({ textAlign: "center" })}
                    onClick={() =>
                        editor.chain().focus().setTextAlign("center").run()
                    }
                >
                    <AlignCenter size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Align text right"
                    active={editor.isActive({ textAlign: "right" })}
                    onClick={() =>
                        editor.chain().focus().setTextAlign("right").run()
                    }
                >
                    <AlignRight size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Justify text"
                    active={editor.isActive({ textAlign: "justify" })}
                    onClick={() =>
                        editor.chain().focus().setTextAlign("justify").run()
                    }
                >
                    <AlignJustify size={16} />
                </ToolbarButton>

                <ToolbarDivider />

                <Tooltip label="Custom text color" withArrow>
                    <input
                        aria-label="Custom text color"
                        type="color"
                        value={textColor}
                        onChange={(event) => {
                            const nextColor = event.currentTarget.value;
                            setTextColor(nextColor);
                            editor.chain().focus().setColor(nextColor).run();
                        }}
                        style={{
                            width: 30,
                            height: 30,
                            padding: 2,
                            border: "1px solid #393939",
                            borderRadius: 6,
                            background: "#191919",
                            cursor: "pointer",
                        }}
                    />
                </Tooltip>

                <Select
                    aria-label="Legacy color presets"
                    placeholder="Legacy colors"
                    data={legacyColorPresets}
                    renderOption={({ option }) => {
                        const preset = legacyColorPresets.find(
                            (item) => item.value === option.value,
                        );

                        return (
                            <Text
                                size="sm"
                                style={{
                                    color: preset?.value ?? "inherit",
                                    fontWeight: 500,
                                }}
                            >
                                {option.label}
                            </Text>
                        );
                    }}
                    value={
                        legacyColorPresets.some(
                            (preset) =>
                                preset.value.toLowerCase() ===
                                textColor.toLowerCase(),
                        )
                            ? textColor
                            : null
                    }
                    onChange={(value) => {
                        if (!value) return;
                        setTextColor(value);
                        editor.chain().focus().setColor(value).run();
                    }}
                    size="xs"
                    w={150}
                    searchable
                    comboboxProps={{ withinPortal: true }}
                />

                <ToolbarButton
                    label="Reset text color"
                    onClick={() => {
                        setTextColor("#d6d6d6");
                        editor.chain().focus().unsetColor().run();
                    }}
                >
                    <X size={16} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Insert image"
                    onClick={onInsertImage}
                >
                    <ImagePlus size={16} />
                </ToolbarButton>
                <ToolbarButton
                    label="Add comment (Ctrl + Shift + M)"
                    onClick={onAddEditorialComment}
                >
                    <MessageSquare size={16} />
                </ToolbarButton>
                <ToolbarButton
                    label="Link to archive record"
                    onClick={onLinkArchiveRecord}
                >
                    <LinkIcon size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Add external link"
                    onClick={onAddExternalLink}
                >
                    <Unlink size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Remove link"
                    disabled={!hasLinkInSelection}
                    onClick={removeLink}
                >
                    <X size={16} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Move block up"
                    onClick={() => moveSelectedBlock(editor, -1)}
                >
                    <ArrowUp size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Move block down"
                    onClick={() => moveSelectedBlock(editor, 1)}
                >
                    <ArrowDown size={16} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Undo"
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo2 size={16} />
                </ToolbarButton>

                <ToolbarButton
                    label="Redo"
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo2 size={16} />
                </ToolbarButton>
            </Group>
        </div>
    );
}