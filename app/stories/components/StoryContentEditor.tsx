"use client";

import { useEffect, useRef, useState } from "react";
import {
    Badge,
    Button,
    Card,
    Collapse,
    Divider,
    Group,
    Modal,
    SegmentedControl,
    Select,
    Stack,
    Text,
    TextInput,
    Textarea,
    Title,
} from "@mantine/core";
import {
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Eye,
    PencilLine,
} from "lucide-react";
import {
    Mark,
    mergeAttributes,
    Node as TiptapNode,
} from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
    EditorContent,
    ReactNodeViewRenderer,
    useEditor,
} from "@tiptap/react";
import StoryImageNodeView from "./StoryImageNodeView";
import { TextSelection } from "@tiptap/pm/state";
import classes from "../story-editor.module.css";
import {
    formatStoryDate,
    type ArchiveRecord,
    type EditorialCommentData,
    type StoryDateEndpoint,
    type StoryDateTypeValue,
    type StoryStatusValue,
    type StoryTiptapDocument,
} from "../types";
import StoryEditorToolbar, {
    StoryBlockShortcuts,
} from "./StoryEditorToolbar";
import ArchiveRecordPickerModal from "./ArchiveRecordPickerModal";
import EditorialCommentModal from "./EditorialCommentModal";

const StoryImage = TiptapNode.create({
    name: "storyImage",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            assetId: {
                default: null,
                parseHTML: (element) => {
                    const raw = (element as HTMLElement).dataset.assetId;
                    const id = Number(raw);
                    return raw && Number.isSafeInteger(id) && id > 0 ? id : null;
                },
            },
            // Compatibility with older documents that used an external URL.
            src: { default: null },
            alt: { default: "" },
            caption: { default: "" },
            align: { default: "center" },
            width: {
                default: null,
                parseHTML: (element) => {
                    const raw = (element as HTMLElement).dataset.width;
                    const width = Number(raw);
                    return raw && Number.isSafeInteger(width) && width > 0
                        ? width
                        : null;
                },
                renderHTML: (attributes) => {
                    const width = attributes.width;
                    return typeof width === "number" && Number.isSafeInteger(width) && width > 0
                        ? { "data-width": String(width) }
                        : {};
                },
            },
        };
    },

    parseHTML() {
        return [{
            tag: "figure[data-story-image]",
            getAttrs: (element) => {
                const figure = element as HTMLElement;
                const image = figure.querySelector("img");
                const rawAssetId = figure.dataset.assetId;
                const assetId = Number(rawAssetId);
                const rawWidth = figure.dataset.width;
                const width = Number(rawWidth);

                return {
                    assetId:
                        rawAssetId && Number.isSafeInteger(assetId) && assetId > 0
                            ? assetId
                            : null,
                    src: image?.getAttribute("src") ?? null,
                    alt: image?.getAttribute("alt") ?? "",
                    caption: figure.querySelector("figcaption")?.textContent ?? "",
                    align: figure.dataset.align ?? "center",
                    width:
                        rawWidth && Number.isSafeInteger(width) && width > 0
                            ? width
                            : null,
                };
            },
        }];
    },

    renderHTML({ HTMLAttributes }) {
        const { assetId, src: legacySrc, alt, caption, align } = HTMLAttributes;
        const id = Number(assetId);
        const src = Number.isSafeInteger(id) && id > 0
            ? `/api/stories/assets/${id}`
            : legacySrc;
        const rawWidth = HTMLAttributes["data-width"];
        const parsedWidth = Number(rawWidth);
        const hasWidth =
            rawWidth !== null &&
            rawWidth !== undefined &&
            rawWidth !== "" &&
            Number.isSafeInteger(parsedWidth) &&
            parsedWidth > 0;
        const width = hasWidth ? parsedWidth : null;
        const alignment = align === "left" || align === "right" ? align : "center";
        const margin = alignment === "left"
            ? "1.25rem auto 1.25rem 0"
            : alignment === "right"
                ? "1.25rem 0 1.25rem auto"
                : "1.25rem auto";

        return [
            "figure",
            {
                "data-story-image": "true",
                "data-asset-id": Number.isSafeInteger(id) && id > 0 ? String(id) : "",
                "data-width": width === null ? "" : String(width),
                "data-align": alignment,
                style: `max-width: 100%; width: ${width === null ? "fit-content" : `${width}px`}; margin: ${margin}; text-align: ${alignment};`,
            },
            ["img", {
                src: src ?? "",
                alt: alt ?? "",
                style: `display: block; width: ${width === null ? "auto" : `${width}px`}; max-width: 100%; height: auto; border-radius: 8px; margin: 0 auto;`,
            }],
            ...(caption ? [[
                "figcaption",
                { style: "margin-top: 0.5rem; color: #a0a0a0; font-size: 0.9rem;" },
                caption,
            ]] : []),
        ] as never;
    },

    addNodeView() {
        return ReactNodeViewRenderer(StoryImageNodeView, { as: "div" });
    },
});

/**
 * A text mark that identifies a passage with a private editorial comment.
 * Its comment text is stored separately in StoryEditorialComment.
 */
const EditorialComment = Mark.create({
    name: "editorialComment",
    priority: 1001,
    inclusive: false,

    addAttributes() {
        return {
            commentId: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute("data-comment-id"),
                renderHTML: (attributes) => ({
                    "data-comment-id": attributes.commentId,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: "span[data-editorial-comment]" }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-editorial-comment": "true",
                class: classes.editorialCommentMark,
                tabindex: 0,
                "aria-label": "Editorial comment",
            }),
            0,
        ];
    },
});

/**
 * An invisible-in-narrative anchor for comments attached to a cursor position.
 */
const EditorialCommentAnchor = TiptapNode.create({
    name: "editorialCommentAnchor",
    group: "inline",
    inline: true,
    atom: true,
    selectable: false,

    addAttributes() {
        return {
            commentId: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute("data-comment-id"),
                renderHTML: (attributes) => ({
                    "data-comment-id": attributes.commentId,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: "span[data-editorial-comment-anchor]" }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-editorial-comment-anchor": "true",
                class: classes.editorialCommentAnchor,
                "aria-label": "Open editorial comment",
                tabindex: 0,
            }),
        ];
    },
});

/**
 * The normal Tiptap link mark with extra attributes that identify an
 * actual archive record. Ordinary external URLs leave these attributes null.
 */
const ArchiveLink = Link.extend({
    addAttributes() {
        return {
            ...this.parent?.(),

            archiveRecordType: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute("data-archive-record-type"),
                renderHTML: (attributes) =>
                    attributes.archiveRecordType
                        ? {
                            "data-archive-record-type":
                                attributes.archiveRecordType,
                        }
                        : {},
            },

            archiveRecordId: {
                default: null,
                parseHTML: (element) => {
                    const raw = element.getAttribute("data-archive-record-id");

                    if (!raw || !/^[1-9]\d*$/.test(raw)) {
                        return null;
                    }

                    return Number(raw);
                },
                renderHTML: (attributes) =>
                    attributes.archiveRecordId != null
                        ? {
                            "data-archive-record-id": String(
                                attributes.archiveRecordId,
                            ),
                        }
                        : {},
            },
        };
    },
});

type StoryContentEditorProps = {
    title: string;
    summary: string;
    storyType: string;
    status: StoryStatusValue;
    dateType: StoryDateTypeValue;
    startDate: StoryDateEndpoint;
    endDate: StoryDateEndpoint;
    tags: string[];
    collections: string[];
    initialContent: StoryTiptapDocument;
    archiveRecords: ArchiveRecord[];
    onContentChange: (content: StoryTiptapDocument) => void;
    editorialComments: EditorialCommentData[];
    onEditorialCommentsChange: (
        comments: EditorialCommentData[],
    ) => void;
};

type CommentRange = {
    from: number;
    to: number;
};

type CommentPreview = {
    id: string;
    text: string;
    left: number;
    top: number;
};

export default function StoryContentEditor({
    title,
    summary,
    storyType,
    status,
    dateType,
    startDate,
    endDate,
    tags,
    collections,
    initialContent,
    archiveRecords,
    onContentChange,
    editorialComments,
    onEditorialCommentsChange,
}: StoryContentEditorProps) {
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [textColor, setTextColor] = useState("#d6d6d6");
    const [wordCount, setWordCount] = useState(0);

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageError, setImageError] = useState("");

    useEffect(() => {
        if (!imageFile) {
            setImagePreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);
    const [imageAlt, setImageAlt] = useState("");
    const [imageCaption, setImageCaption] = useState("");
    const [imageAlignment, setImageAlignment] = useState("center");

    const [externalModalOpen, setExternalModalOpen] = useState(false);
    const [externalUrl, setExternalUrl] = useState("");
    const [externalLabel, setExternalLabel] = useState("");

    const [archiveModalOpen, setArchiveModalOpen] = useState(false);
    const [archiveSelection, setArchiveSelection] =
        useState<CommentRange | null>(null);

    const [commentPreview, setCommentPreview] =
        useState<CommentPreview | null>(null);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [commentSelection, setCommentSelection] =
        useState<CommentRange | null>(null);

    const [editorialNotesCollapsed, setEditorialNotesCollapsed] =
        useState(true);

    const openCommentForSelectionRef = useRef<() => void>(() => { });
    const onContentChangeRef = useRef(onContentChange);

    // Keep callbacks current even though the Tiptap editor instance is stable.
    onContentChangeRef.current = onContentChange;

    const dateDescription =
        dateType === "unknown"
            ? "Date unknown"
            : dateType === "range"
                ? `${formatStoryDate(startDate)} – ${formatStoryDate(endDate)}`
                : formatStoryDate(startDate);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
            }),
            StoryBlockShortcuts,
            StoryImage,
            EditorialComment,
            EditorialCommentAnchor,
            TextAlign.configure({
                types: ["heading", "paragraph"],
                alignments: ["left", "center", "right", "justify"],
            }),
            Underline,
            TextStyle,
            Color.configure({
                types: ["textStyle"],
            }),
            ArchiveLink.configure({
                openOnClick: false,
                autolink: false,
                linkOnPaste: false,
                HTMLAttributes: {
                    rel: "noopener noreferrer",
                    class: "story-link",
                },
            }),
        ],
        content: initialContent,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: classes.editorContent,
                spellcheck: "true",
            },
            handleKeyDown: (_view, event) => {
                if (
                    (event.ctrlKey || event.metaKey) &&
                    event.shiftKey &&
                    event.key.toLowerCase() === "m"
                ) {
                    event.preventDefault();
                    openCommentForSelectionRef.current();
                    return true;
                }

                return false;
            },
        },
        onCreate: ({ editor: createdEditor }) => {
            const text = createdEditor.getText().trim();
            setWordCount(text ? text.split(/\s+/).length : 0);
        },
        onUpdate: ({ editor: updatedEditor }) => {
            const text = updatedEditor.getText().trim();
            setWordCount(text ? text.split(/\s+/).length : 0);

            onContentChangeRef.current(
                updatedEditor.getJSON() as StoryTiptapDocument,
            );
        },
    });

    useEffect(() => {
        editor?.setEditable(viewMode === "edit");

        if (viewMode !== "edit") {
            setCommentPreview(null);
            setCommentModalOpen(false);
            setCommentSelection(null);
        }
    }, [editor, viewMode]);

    async function insertStoryImage() {
        if (!editor || !imageFile || isUploadingImage) return;

        setIsUploadingImage(true);
        setImageError("");

        try {
            const formData = new FormData();
            formData.set("file", imageFile);
            const response = await fetch("/api/stories/assets", {
                method: "POST",
                body: formData,
            });
            const result = await response.json().catch(() => null);

            if (!response.ok || !Number.isSafeInteger(result?.asset?.id)) {
                setImageError(
                    typeof result?.error === "string"
                        ? result.error
                        : "The image could not be uploaded.",
                );
                return;
            }

            editor.chain().focus().insertContent({
                type: "storyImage",
                attrs: {
                    assetId: result.asset.id,
                    alt: imageAlt.trim(),
                    caption: imageCaption.trim(),
                    align: ["left", "center", "right"].includes(imageAlignment)
                        ? imageAlignment
                        : "center",
                },
            }).run();

            setImageModalOpen(false);
            setImageFile(null);
            setImageAlt("");
            setImageCaption("");
            setImageAlignment("center");
        } catch (cause) {
            console.error("Failed to upload story image:", cause);
            setImageError("Something went wrong while uploading the image.");
        } finally {
            setIsUploadingImage(false);
        }
    }

    function applyExternalLink() {
        if (!editor) return;

        const href = externalUrl.trim();
        if (!href) return;

        const safeHref = /^https?:\/\//i.test(href)
            ? href
            : `https://${href}`;

        const attributes = {
            href: safeHref,
            target: "_blank",
            rel: "noopener noreferrer",
            archiveRecordType: null,
            archiveRecordId: null,
        };

        if (editor.state.selection.empty && externalLabel.trim()) {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: "text",
                    text: externalLabel.trim(),
                    marks: [{ type: "link", attrs: attributes }],
                })
                .run();
        } else {
            editor.chain().focus().setLink(attributes).run();
        }

        setExternalModalOpen(false);
        setExternalUrl("");
        setExternalLabel("");
    }

    function openArchivePicker() {
        if (!editor) return;

        const selection = editor.state.selection;

        setArchiveSelection({
            from: selection.from,
            to: selection.to,
        });

        setArchiveModalOpen(true);
    }

    function applyArchiveLink(record: ArchiveRecord) {
        if (!editor) return;

        const state = editor.state;
        const view = editor.view;

        const selection = archiveSelection ?? {
            from: state.selection.from,
            to: state.selection.to,
        };

        const from = selection.from;
        const to = selection.to;
        const hasSelection = from !== to;

        const linkType = state.schema.marks.link;
        const textStyleType = state.schema.marks.textStyle;

        if (!linkType) return;

        let transaction = state.tr;

        if (!hasSelection) {
            transaction.insertText(record.title, from);
        }

        const linkFrom = from;
        const linkTo = hasSelection
            ? to
            : from + record.title.length;

        transaction.removeMark(linkFrom, linkTo, linkType);

        transaction.addMark(
            linkFrom,
            linkTo,
            linkType.create({
                href: record.href,
                target: null,
                rel: "noopener noreferrer",
                archiveRecordType: record.category,
                archiveRecordId: record.id,
            }),
        );

        if (textStyleType) {
            transaction.removeMark(linkFrom, linkTo, textStyleType);

            if (record.color) {
                transaction.addMark(
                    linkFrom,
                    linkTo,
                    textStyleType.create({ color: record.color }),
                );
            }
        }

        transaction.setSelection(
            TextSelection.create(transaction.doc, linkTo),
        );
        transaction.setStoredMarks([]);

        view.dispatch(transaction);
        view.focus();

        setArchiveModalOpen(false);
        setArchiveSelection(null);
    }

    function getCommentRange(commentId: string): CommentRange | null {
        if (!editor) return null;

        let from = Infinity;
        let to = -Infinity;

        editor.state.doc.descendants((node, position) => {
            const hasTextComment =
                node.isText &&
                node.marks.some(
                    (mark) =>
                        mark.type.name === "editorialComment" &&
                        mark.attrs.commentId === commentId,
                );

            const hasCursorAnchor =
                node.type.name === "editorialCommentAnchor" &&
                node.attrs.commentId === commentId;

            if (hasTextComment || hasCursorAnchor) {
                from = Math.min(from, position);
                to = Math.max(to, position + node.nodeSize);
            }
        });

        return Number.isFinite(from) && to > from
            ? { from, to }
            : null;
    }

    function openCommentForSelection() {
        if (!editor || viewMode !== "edit") return;

        const { from, to } = editor.state.selection;

        setCommentSelection({ from, to });
        setActiveCommentId(null);
        setCommentText("");
        setCommentPreview(null);
        setCommentModalOpen(true);
    }

    // The keyboard handler always calls the latest instance of this callback.
    openCommentForSelectionRef.current = openCommentForSelection;

    function openExistingComment(commentId: string) {
        if (viewMode !== "edit") return;

        const comment = editorialComments.find(
            (item) => item.id === commentId,
        );
        const range = getCommentRange(commentId);

        if (!comment || !range) return;

        setCommentSelection(range);
        setActiveCommentId(commentId);
        setCommentText(comment.text);
        setCommentPreview(null);
        setCommentModalOpen(true);
    }

    function closeEditorialCommentModal() {
        setCommentModalOpen(false);
        setCommentSelection(null);
        setActiveCommentId(null);
        setCommentText("");
    }

    function saveEditorialComment() {
        if (!editor || !commentSelection || !commentText.trim()) return;

        const text = commentText.trim();

        if (activeCommentId) {
            onEditorialCommentsChange(
                editorialComments.map((comment) =>
                    comment.id === activeCommentId
                        ? { ...comment, text }
                        : comment,
                ),
            );
        } else {
            const id = crypto.randomUUID();

            const chain = editor
                .chain()
                .focus()
                .setTextSelection(commentSelection);

            const applied =
                commentSelection.from === commentSelection.to
                    ? chain
                        .insertContent({
                            type: "editorialCommentAnchor",
                            attrs: { commentId: id },
                        })
                        .run()
                    : chain
                        .setMark("editorialComment", { commentId: id })
                        .run();

            if (!applied) return;

            onEditorialCommentsChange([
                ...editorialComments,
                { id, text },
            ]);
        }

        closeEditorialCommentModal();
    }

    function deleteEditorialComment() {
        if (!editor || !activeCommentId) return;

        const range = getCommentRange(activeCommentId);

        if (range) {
            const node = editor.state.doc.nodeAt(range.from);

            if (
                node?.type.name === "editorialCommentAnchor" &&
                node.attrs.commentId === activeCommentId
            ) {
                editor.chain().focus().deleteRange(range).run();
            } else {
                editor
                    .chain()
                    .focus()
                    .setTextSelection(range)
                    .unsetMark("editorialComment")
                    .run();
            }
        }

        onEditorialCommentsChange(
            editorialComments.filter(
                (comment) => comment.id !== activeCommentId,
            ),
        );

        closeEditorialCommentModal();
    }

    function showCommentPreview(target: HTMLElement) {
        if (viewMode !== "edit") {
            setCommentPreview(null);
            return;
        }

        const commentElement = target.closest<HTMLElement>(
            "[data-editorial-comment], [data-editorial-comment-anchor]",
        );

        if (!commentElement) {
            setCommentPreview(null);
            return;
        }

        const commentId = commentElement.getAttribute("data-comment-id");
        const comment = editorialComments.find(
            (item) => item.id === commentId,
        );

        if (!comment) {
            setCommentPreview(null);
            return;
        }

        const rects = commentElement.getClientRects();
        const rect = rects[rects.length - 1];

        if (!rect) {
            setCommentPreview(null);
            return;
        }

        const previewWidth = Math.min(240, window.innerWidth - 24);
        const previewHeight = 160;
        const gap = 8;

        let left = rect.right + gap;
        let top = rect.top - 4;

        if (left + previewWidth > window.innerWidth - 12) {
            left = rect.left - previewWidth - gap;
        }

        left = Math.max(
            12,
            Math.min(left, window.innerWidth - previewWidth - 12),
        );

        top = Math.max(
            12,
            Math.min(top, window.innerHeight - previewHeight - 12),
        );

        setCommentPreview({
            id: comment.id,
            text: comment.text,
            left,
            top,
        });
    }

    if (!editor) {
        return (
            <Card withBorder padding="xl" radius="md">
                <Text c="dimmed">Loading story editor…</Text>
            </Card>
        );
    }

    const legacyColors = archiveRecords.flatMap((record) =>
        record.category === "Legacy" && record.color
            ? [{ label: record.title, value: record.color }]
            : [],
    );

    return (
        <>
            <Group justify="flex-end">
                <SegmentedControl
                    value={viewMode}
                    onChange={(value) => {
                        if (value === "edit" || value === "preview") {
                            setViewMode(value);
                        }
                    }}
                    data={[
                        {
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <PencilLine size={15} />
                                    <span>Edit</span>
                                </Group>
                            ),
                            value: "edit",
                        },
                        {
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <Eye size={15} />
                                    <span>Preview</span>
                                </Group>
                            ),
                            value: "preview",
                        },
                    ]}
                    styles={{
                        root: { backgroundColor: "#24201d" },
                        indicator: { backgroundColor: "#A95728" },
                        label: { color: "#d6d6d6" },
                    }}
                />
            </Group>

            <Card
                withBorder
                padding={0}
                radius="md"
                className={classes.editorCard}
            >
                {viewMode === "edit" ? (
                    <>
                        <StoryEditorToolbar
                            editor={editor}
                            textColor={textColor}
                            setTextColor={setTextColor}
                            legacyColors={legacyColors}
                            onInsertImage={() => setImageModalOpen(true)}
                            onLinkArchiveRecord={openArchivePicker}
                            onAddExternalLink={() =>
                                setExternalModalOpen(true)
                            }
                            onAddEditorialComment={openCommentForSelection}
                        />

                        <div
                            className={classes.editorCanvas}
                            onClick={(event) => {
                                const target = event.target as HTMLElement;
                                const commentElement = target.closest(
                                    "[data-editorial-comment], [data-editorial-comment-anchor]",
                                );
                                const commentId =
                                    commentElement?.getAttribute(
                                        "data-comment-id",
                                    );

                                if (commentId) {
                                    setCommentPreview(null);
                                    openExistingComment(commentId);
                                }
                            }}
                            onMouseOver={(event) => {
                                showCommentPreview(
                                    event.target as HTMLElement,
                                );
                            }}
                            onMouseLeave={() => setCommentPreview(null)}
                            onFocusCapture={(event) => {
                                showCommentPreview(
                                    event.target as HTMLElement,
                                );
                            }}
                            onBlurCapture={(event) => {
                                const nextTarget =
                                    event.relatedTarget as HTMLElement | null;

                                if (
                                    !nextTarget?.closest(
                                        "[data-editorial-comment], [data-editorial-comment-anchor]",
                                    )
                                ) {
                                    setCommentPreview(null);
                                }
                            }}
                        >
                            <EditorContent editor={editor} />

                            {commentPreview && (
                                <div
                                    data-comment-preview
                                    className={
                                        classes.editorialCommentPreview
                                    }
                                    style={{
                                        left: commentPreview.left,
                                        top: commentPreview.top,
                                    }}
                                    role="status"
                                >
                                    {commentPreview.text}
                                </div>
                            )}

                            <Group
                                justify="space-between"
                                align="center"
                                px="md"
                                py="sm"
                                wrap="wrap"
                            >
                                <Text size="xs" c="dimmed">
                                    {wordCount} words
                                </Text>

                                <Text size="xs" c="dimmed">
                                    Ctrl + B bold · Ctrl + I italic · Ctrl + U
                                    underline · Ctrl + Z undo · Ctrl + Y redo ·
                                    Alt + ↑ / ↓ move · Ctrl + Shift + D duplicate
                                </Text>
                            </Group>
                        </div>
                    </>
                ) : (
                    <div className={classes.previewCanvas}>
                        <Card
                            withBorder
                            padding="xl"
                            radius="md"
                            bg="#161616"
                            style={{ borderColor: "#292929" }}
                        >
                            <Stack gap="md">
                                <Title order={1}>
                                    {title || "Untitled story"}
                                </Title>

                                {summary.trim() && (
                                    <Text c="dimmed" size="md">
                                        {summary}
                                    </Text>
                                )}

                                <Group gap="xs" align="center" wrap="wrap">
                                    <Badge variant="light" color="mesa">
                                        {storyType}
                                    </Badge>

                                    <Badge
                                        variant="light"
                                        color={
                                            status === "Draft" ? "gray" : "teal"
                                        }
                                    >
                                        {status}
                                    </Badge>

                                    <Group gap={6} align="center" wrap="nowrap">
                                        <CalendarDays
                                            size={16}
                                            color="var(--mantine-color-dimmed)"
                                        />
                                        <Text size="sm" c="dimmed">
                                            {dateDescription}
                                        </Text>
                                    </Group>
                                </Group>

                                {tags.length > 0 && (
                                    <Group gap="xs" align="center" wrap="wrap">
                                        <Text size="sm" c="dimmed">
                                            Tags:
                                        </Text>

                                        {tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                color="gray"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </Group>
                                )}

                                {collections.length > 0 && (
                                    <Group gap="xs" align="center" wrap="wrap">
                                        <Text size="sm" c="dimmed">
                                            Collections:
                                        </Text>

                                        {collections.map((collection) => (
                                            <Badge
                                                key={collection}
                                                variant="light"
                                                color="mesa"
                                            >
                                                {collection}
                                            </Badge>
                                        ))}
                                    </Group>
                                )}
                            </Stack>
                        </Card>

                        <Divider my="xl" />

                        <div className={classes.previewContent}>
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                )}
            </Card>

            <Modal
                opened={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                title="Insert an image"
                centered
                size="md"
            >
                <Stack gap="md">

                    <Text size="sm" c="dimmed">
                        Choose an image from your device. It will be uploaded to the archive and embedded in the story.
                    </Text>

                    <input
                        type="file"
                        accept="image/*"
                        aria-label="Choose an image to insert"
                        disabled={isUploadingImage}
                        onChange={(event) => {
                            const selected = event.currentTarget.files?.[0] ?? null;
                            setImageError("");
                            setImageFile(selected && selected.type.startsWith("image/") ? selected : null);
                            if (selected && !selected.type.startsWith("image/")) {
                                setImageError("Choose an image file.");
                            }
                            event.currentTarget.value = "";
                        }}
                    />

                    {imagePreviewUrl && (
                        <Card withBorder padding="sm" radius="md" bg="#111" style={{ borderColor: "#292929" }}>
                            <img
                                src={imagePreviewUrl}
                                alt={imageAlt.trim() || "Image preview"}
                                style={{ display: "block", maxWidth: "100%", maxHeight: 220, objectFit: "contain", margin: "0 auto", borderRadius: 6 }}
                            />
                        </Card>
                    )}
                    {imageError && <Text size="sm" c="red">{imageError}</Text>}

                    <TextInput
                        label="Alt text"
                        placeholder="Describe the image for accessibility"
                        value={imageAlt}
                        onChange={(event) =>
                            setImageAlt(event.currentTarget.value)
                        }
                    />

                    <TextInput
                        label="Caption (optional)"
                        placeholder="A short description shown below the image"
                        value={imageCaption}
                        onChange={(event) =>
                            setImageCaption(event.currentTarget.value)
                        }
                    />

                    <Select
                        label="Alignment"
                        data={[
                            { label: "Left", value: "left" },
                            { label: "Center", value: "center" },
                            { label: "Right", value: "right" },
                        ]}
                        value={imageAlignment}
                        onChange={(value) =>
                            setImageAlignment(value ?? "center")
                        }
                        allowDeselect={false}
                    />

                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setImageModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="mesa"
                            disabled={!imageFile || isUploadingImage}
                            onClick={insertStoryImage}
                            loading={isUploadingImage}
                        >
                            Insert image
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={externalModalOpen}
                onClose={() => setExternalModalOpen(false)}
                title="Add an external link"
                centered
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Select text in the story to link that text. If no text
                        is selected, enter a label to insert a new link.
                    </Text>

                    <TextInput
                        label="URL"
                        placeholder="https://example.com"
                        value={externalUrl}
                        onChange={(event) =>
                            setExternalUrl(event.currentTarget.value)
                        }
                        required
                    />

                    <TextInput
                        label="Link text (optional)"
                        placeholder="Text to insert when no text is selected"
                        value={externalLabel}
                        onChange={(event) =>
                            setExternalLabel(event.currentTarget.value)
                        }
                    />

                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setExternalModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="mesa"
                            disabled={!externalUrl.trim()}
                            onClick={applyExternalLink}
                        >
                            Add link
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <ArchiveRecordPickerModal
                opened={archiveModalOpen}
                records={archiveRecords}
                onClose={() => {
                    setArchiveModalOpen(false);
                    setArchiveSelection(null);
                }}
                onSelect={applyArchiveLink}
            />

            {viewMode === "edit" && (
                <EditorialCommentModal
                    opened={commentModalOpen}
                    activeCommentId={activeCommentId}
                    commentText={commentText}
                    onCommentTextChange={setCommentText}
                    onClose={closeEditorialCommentModal}
                    onSave={saveEditorialComment}
                    onDelete={deleteEditorialComment}
                />
            )}
        </>
    );
}