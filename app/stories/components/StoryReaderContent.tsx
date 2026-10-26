"use client";

import { useMemo } from "react";
import {
    Node as TiptapNode,
    type JSONContent,
} from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
    EditorContent,
    useEditor,
} from "@tiptap/react";

import type { StoryTiptapDocument } from "../types";
import classes from "../story-reader.module.css";

/**
 * Remove editor-only annotations without modifying saved content.
 */
function cleanReaderNode(
    node: JSONContent,
): JSONContent | null {
    if (node.type === "editorialCommentAnchor") {
        return null;
    }

    const cleaned: JSONContent = { ...node };

    if (node.marks) {
        cleaned.marks = node.marks.filter(
            (mark) => mark.type !== "editorialComment",
        );
    }

    if (node.content) {
        cleaned.content = node.content
            .map(cleanReaderNode)
            .filter(
                (child): child is JSONContent => child !== null,
            );
    }

    return cleaned;
}

/**
 * Supports both older URL-based images and uploaded Story assets.
 */
const StoryImage = TiptapNode.create({
    name: "storyImage",
    group: "block",
    atom: true,
    draggable: false,

    addAttributes() {
        return {
            assetId: { default: null },
            src: { default: null },
            alt: { default: "" },
            caption: { default: "" },
            align: { default: "center" },
            width: { default: null },
        };
    },

    renderHTML({ HTMLAttributes }) {
        const {
            assetId,
            src,
            alt,
            caption,
            align,
            width,
        } = HTMLAttributes;

        const parsedAssetId = Number(assetId);

        const uploadedImage =
            assetId !== null &&
            assetId !== undefined &&
            Number.isSafeInteger(parsedAssetId) &&
            parsedAssetId > 0;

        const legacySrcIsSafe =
            typeof src === "string" &&
            (
                /^https?:\/\//i.test(src) ||
                (src.startsWith("/") && !src.startsWith("//"))
            );

        const imageSrc = uploadedImage
            ? `/api/stories/assets/${parsedAssetId}`
            : legacySrcIsSafe
                ? src
                : "";

        const alignment =
            align === "left" || align === "right"
                ? align
                : "center";

        const margin =
            alignment === "left"
                ? "1.25rem auto 1.25rem 0"
                : alignment === "right"
                    ? "1.25rem 0 1.25rem auto"
                    : "1.25rem auto";

        const widthValue =
            typeof width === "number" && Number.isFinite(width)
                ? `${width}px`
                : typeof width === "string" &&
                    /^\d+(?:\.\d+)?(?:px|%)?$/.test(width)
                    ? (/^\d+(?:\.\d+)?$/.test(width)
                        ? `${width}px`
                        : width)
                    : "fit-content";

        return [
            "figure",
            {
                "data-story-image": "true",
                "data-align": alignment,
                style: [
                    "max-width: 100%",
                    `width: ${widthValue}`,
                    `margin: ${margin}`,
                    `text-align: ${alignment}`,
                ].join("; "),
            },
            [
                "img",
                {
                    src: imageSrc,
                    alt: typeof alt === "string" ? alt : "",
                    loading: "lazy",
                    style: [
                        "display: block",
                        "width: 100%",
                        "max-width: 100%",
                        "height: auto",
                        "border-radius: 8px",
                        "margin: 0 auto",
                    ].join("; "),
                },
            ],
            ...(typeof caption === "string" && caption.trim()
                ? [
                    [
                        "figcaption",
                        {},
                        caption,
                    ],
                ]
                : []),
        ] as never;
    },
});

/**
 * Preserve the archive record identity attributes attached to links in the
 * editor, so the reader understands the same saved document format.
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
                    const raw = element.getAttribute(
                        "data-archive-record-id",
                    );

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

type StoryReaderContentProps = {
    content: StoryTiptapDocument;
};

export default function StoryReaderContent({
    content,
}: StoryReaderContentProps) {
    const readerContent = useMemo<JSONContent>(() => {
        const cleaned = cleanReaderNode(
            content as unknown as JSONContent,
        );

        return cleaned ?? {
            type: "doc",
            content: [],
        };
    }, [content]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
            }),
            StoryImage,
            TextAlign.configure({
                types: ["heading", "paragraph"],
                alignments: [
                    "left",
                    "center",
                    "right",
                    "justify",
                ],
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

        content: readerContent,
        editable: false,
        immediatelyRender: false,

        editorProps: {
            attributes: {
                class: classes.prose,
                "aria-label": "Story text",
            },
        },
    });

    if (!editor) {
        return null;
    }

    return <EditorContent editor={editor} />;
}