
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Collapse,
    Divider,
    Group,
    Modal,
    MultiSelect,
    NativeSelect,
    ScrollArea,
    SegmentedControl,
    Select,
    Stack,
    TagsInput,
    Text,
    TextInput,
    Textarea,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Bold,
    Check,
    PencilLine,
    Plus,
    Eye,
    FileText,
    Download,
    Paperclip,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Italic,
    ImagePlus,
    Link as LinkIcon,
    MessageSquare,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Save,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
    Unlink,
    X,
} from "lucide-react";
import {
    Extension,
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
    useEditor,
    type Editor as TiptapEditor,
} from "@tiptap/react";
import { Fragment } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import classes from "../story-editor.module.css";

type ArchiveCategory =
    | "Colonist"
    | "Legacy"
    | "Group"
    | "Location"
    | "Relic"
    | "Story";

type ArchiveRecord = {
    id: string;
    title: string;
    category: ArchiveCategory;
    href: string;
    color?: string;
    subtitle?: string;
};

type StoryDateEndpoint = {
    day: string;
    month: string;
    year: string;
    approximate: boolean;
};

const storyDateMonths = [
    "Aprimay",
    "Jugust",
    "Septober",
    "Decembary",
];

function formatStoryDate(date: StoryDateEndpoint): string {
    const day = date.day.trim();
    const month = date.month.trim();
    const year = date.year.trim();

    const parts = [
        ...(day && month ? [day] : []),
        ...(month ? [month] : []),
        ...(year ? [year] : []),
    ];

    const formattedDate = parts.join(" ");

    if (!formattedDate) return "Date unknown";

    return date.approximate
        ? `circa ${formattedDate}`
        : formattedDate;
}

function StoryDateFields({
    label,
    value,
    onChange,
}: {
    label: string;
    value: StoryDateEndpoint;
    onChange: (date: StoryDateEndpoint) => void;
}) {
    return (
        <Stack gap="xs">
            <Text size="sm" c="dimmed">
                {label}
            </Text>

            <Group grow align="flex-start">
                <NativeSelect
                    label="Day"
                    value={value.day}
                    disabled={!value.month}
                    onChange={(event) =>
                        onChange({
                            ...value,
                            day: event.currentTarget.value,
                        })
                    }
                    data={[
                        { value: "", label: "Not set" },
                        ...Array.from({ length: 15 }, (_, index) => {
                            const day = String(index + 1);
                            return { value: day, label: day };
                        }),
                    ]}
                />

                <NativeSelect
                    label="Month"
                    value={value.month}
                    onChange={(event) => {
                        const month = event.currentTarget.value;
                        onChange({
                            ...value,
                            month,
                            day: month ? value.day : "",
                        });
                    }}
                    data={[
                        { value: "", label: "Not set" },
                        ...storyDateMonths.map((month) => ({
                            value: month,
                            label: month,
                        })),
                    ]}
                />

                <TextInput
                    label="Year"
                    value={value.year}
                    onChange={(event) =>
                        onChange({
                            ...value,
                            year: event.currentTarget.value,
                        })
                    }
                    inputMode="numeric"
                />
            </Group>

            <Select
                label="Certainty"
                data={[
                    { value: "exact", label: "Exact" },
                    { value: "approximate", label: "Approximate" },
                ]}
                value={value.approximate ? "approximate" : "exact"}
                onChange={(next) => {
                    if (next === "exact" || next === "approximate") {
                        onChange({
                            ...value,
                            approximate: next === "approximate",
                        });
                    }
                }}
                allowDeselect={false}
            />
        </Stack>
    );
}

type ReferenceKind = "Screenshot" | "Text reference" | "File attachment" | "Other";

type ReferenceMaterial = {
    id: string;
    kind: ReferenceKind;
    title: string;
    source: string;
    content: string;
    contextNote: string;
    imageUrl?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
    attachmentSize?: number;
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const initialReferenceLibrary: ReferenceMaterial[] = [
    {
        id: "founding-screenshot",
        kind: "Screenshot",
        title: "Early Predatus settlement",
        source: "Predatus_5506-03-03.png",
        content: "Screenshot of the settlement shortly after its founding.",
        contextNote:
            "Use this to reconstruct the initial settlement layout before the colony expanded.",
    },
    {
        id: "founding-message",
        kind: "Text reference",
        title: "Founding entry in colony notes",
        source: "Old colony notes · founding entry",
        content:
            "Anna Mesa and Merulo Jay are recorded as the first settlers of Predatus.",
        contextNote:
            "A written clue for the founders section; compare it with other records before treating every detail as certain.",
    },
    {
        id: "maia-surgery-screenshot",
        kind: "Screenshot",
        title: "Maia's surgery aftermath",
        source: "Maia_surgery_5501.png",
        content: "Screenshot associated with Maia's kidney surgery.",
        contextNote:
            "This source may also be useful for a separate story about Maia's personal history.",
    },
    {
        id: "lab-fire-message",
        kind: "Text reference",
        title: "Laboratory fire recollection",
        source: "Old colony message · event notes",
        content: "A note mentioning the laboratory fire while insects were inside.",
        contextNote:
            "Potential source for a future story about the lab fire and Vesper Locust.",
    },
];

const legacyColorPresets = [
    { label: "Mesa", value: "#A95728" },
    { label: "Grate", value: "#3BD1FF" },
    { label: "Leer", value: "#610B1B" },
    { label: "Shape", value: "#73D06F" },
    { label: "Tranporteur", value: "#5B7185" },
    { label: "Brainiac", value: "#6957A8" },
    { label: "Cairo", value: "#7B3F8C" },
    { label: "Kisa", value: "#A47791" },
    { label: "Zle'ruah Forsaken", value: "#453B00" },
    { label: "Shimada", value: "#5A253B" },
    { label: "Cunningham", value: "#416D73" },
    { label: "King", value: "#B58B32" },
    { label: "Rebel", value: "#3F464B" },
    { label: "Romilia", value: "#77736D" },
    { label: "Leroy", value: "#7C4B3D" },
    { label: "App accent", value: "#E9904F" },
];

const archiveRecords: ArchiveRecord[] = [
    {
        id: "maia-grate",
        title: "Maia Grate",
        category: "Colonist",
        href: "/colonists/maia-grate",
        color: "#3BD1FF",
        subtitle: "Grate family",
    },
    {
        id: "anna-mesa",
        title: "Anna Mesa",
        category: "Colonist",
        href: "/colonists/anna-mesa",
        color: "#A95728",
        subtitle: "Mesa family",
    },
    {
        id: "mesa-legacy",
        title: "Mesa",
        category: "Legacy",
        href: "/legacies/mesa",
        color: "#A95728",
        subtitle: "Legacy",
    },
    {
        id: "grate-legacy",
        title: "Grate",
        category: "Legacy",
        href: "/legacies/grate",
        color: "#3BD1FF",
        subtitle: "Legacy",
    },
    {
        id: "predatus",
        title: "Predatus",
        category: "Location",
        href: "/locations/predatus",
        subtitle: "Main colony",
    },
    {
        id: "memento-of-mesa",
        title: "Memento of Mesa",
        category: "Relic",
        href: "/relics/memento-of-mesa",
        color: "#A95728",
        subtitle: "Relic",
    },
    {
        id: "founding-story",
        title: "The Founding of Predatus",
        category: "Story",
        href: "/stories/founding-of-predatus",
        subtitle: "Story",
    },
    {
        id: "founders",
        title: "The Founders",
        category: "Group",
        href: "/groups/founders",
        subtitle: "Group",
    },
];

const archiveCategories: ArchiveCategory[] = [
    "Colonist",
    "Legacy",
    "Group",
    "Location",
    "Relic",
    "Story",
];

function moveSelectedBlock(
    editor: TiptapEditor,
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

    const selectionPosition = selection.from;

    const currentIndex = blocks.findIndex(({ node, offset }) => {
        return (
            selectionPosition >= offset &&
            selectionPosition <= offset + node.nodeSize
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

function duplicateSelectedBlock(editor: TiptapEditor): boolean {
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
        selectionPosition <= offset + node.nodeSize,
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

const StoryBlockShortcuts = Extension.create({
    name: "storyBlockShortcuts",

    addKeyboardShortcuts() {
        return {
            "Alt-ArrowUp": () => moveSelectedBlock(this.editor, -1),
            "Alt-ArrowDown": () => moveSelectedBlock(this.editor, 1),
            "Mod-Shift-d": () => duplicateSelectedBlock(this.editor),
        };
    },
});
const EditorialComment = Mark.create({
    name: "editorialComment",

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

const StoryImage = TiptapNode.create({
    name: "storyImage",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            src: { default: null },
            alt: { default: "" },
            caption: { default: "" },
            align: { default: "center" },
        };
    },

    parseHTML() {
        return [
            {
                tag: "figure[data-story-image]",

                getAttrs: (element) => {
                    const figure = element as HTMLElement;
                    const image = figure.querySelector("img");

                    return {
                        src: image?.getAttribute("src") ?? "",
                        alt: image?.getAttribute("alt") ?? "",
                        caption:
                            figure.querySelector("figcaption")?.textContent ?? "",
                        align: figure.dataset.align ?? "center",
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const { src, alt, caption, align } = HTMLAttributes;

        const alignment =
            align === "left" || align === "right" ? align : "center";

        const margin =
            alignment === "left"
                ? "1.25rem auto 1.25rem 0"
                : alignment === "right"
                    ? "1.25rem 0 1.25rem auto"
                    : "1.25rem auto";

        const image: any[] = [
            "img",
            {
                src,
                alt: alt ?? "",
                style:
                    "display: block; max-width: 100%; height: auto; border-radius: 8px; margin: 0 auto;",
            },
        ];

        return [
            "figure",
            {
                "data-story-image": "true",
                "data-align": alignment,
                style: `max-width: 100%; width: fit-content; margin: ${margin}; text-align: ${alignment};`,
            },
            image,
            ...(caption
                ? [
                    [
                        "figcaption",
                        {
                            style:
                                "margin-top: 0.5rem; color: #a0a0a0; font-size: 0.9rem;",
                        },
                        caption,
                    ],
                ]
                : []),
        ] as any;
    },
});

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
function getInlineArchiveRecordIds(editor: TiptapEditor): string[] {
    const linkedIds = new Set<string>();

    editor.state.doc.descendants((node) => {
        if (!node.isText) return;

        for (const mark of node.marks) {
            if (mark.type.name !== "link") continue;

            const href = mark.attrs.href;

            const record = archiveRecords.find(
                (candidate) => candidate.href === href,
            );

            if (record) {
                linkedIds.add(record.id);
            }
        }
    });

    return [...linkedIds];
}

type EditorialCommentData = {
    id: string;
    text: string;
};

type EditorialCommentPreview = {
    id: string;
    text: string;
    left: number;
    top: number;
};

export default function StoryEditorPrototype() {
    const [title, setTitle] = useState("The Founding of Predatus");

    const [summary, setSummary] = useState(
        "The events that led to the founding of the colony.",
    );

    const [tags, setTags] = useState<string[]>([
        "Founding",
        "Predatus",
        "Family History",
        "Major Event",
    ]);

    const [collections, setCollections] = useState<string[]>([
        "Founding of Predatus",
        "Mesa Family History",
        "Major Colony Events",
    ]);

    const [availableCollections, setAvailableCollections] = useState([
        "Founding of Predatus",
        "Mesa Family History",
        "Major Colony Events",
        "Notable Colonists",
        "Colony Disasters",
        "Relic Histories",
    ]);

    const [creatingCollection, setCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");

    const [storyType, setStoryType] = useState("Colony history");
    const [status, setStatus] = useState<"Draft" | "Complete">("Draft");
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [textColor, setTextColor] = useState("#d6d6d6");

    const [dateType, setDateType] = useState("single");
    const [startDate, setStartDate] = useState<StoryDateEndpoint>({
        day: "3",
        month: "Jugust",
        year: "5506",
        approximate: false,
    });
    const [endDate, setEndDate] = useState<StoryDateEndpoint>({
        day: "3",
        month: "Jugust",
        year: "5506",
        approximate: false,
    });

    const [archiveModalOpen, setArchiveModalOpen] = useState(false);
    const [archiveCategory, setArchiveCategory] =
        useState<ArchiveCategory | "All">("All");
    const [archiveSearch, setArchiveSearch] = useState("");

    const [externalModalOpen, setExternalModalOpen] = useState(false);
    const [externalUrl, setExternalUrl] = useState("");
    const [externalLabel, setExternalLabel] = useState("");

    const [saveMessage, setSaveMessage] = useState("");
    const [wordCount, setWordCount] = useState(0);

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [imageAlt, setImageAlt] = useState("");
    const [imageCaption, setImageCaption] = useState("");
    const [imageAlignment, setImageAlignment] = useState("center");

    const [archiveSelection, setArchiveSelection] = useState<{
        from: number;
        to: number;
    } | null>(null);

    const [metadataCollapsed, setMetadataCollapsed] = useState(false);
    const [relatedRecordsCollapsed, setRelatedRecordsCollapsed] = useState(true);

    const [manualRelatedRecordIds, setManualRelatedRecordIds] =
        useState<string[]>([]);

    const [inlineRelatedRecordIds, setInlineRelatedRecordIds] =
        useState<string[]>([]);

    const [editorialComments, setEditorialComments] = useState<
        EditorialCommentData[]
    >([]);
    const [commentPreview, setCommentPreview] =
        useState<EditorialCommentPreview | null>(null);

    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

    const [commentSelection, setCommentSelection] = useState<{
        from: number;
        to: number;
    } | null>(null);

    const [editorialNotes, setEditorialNotes] = useState("");
    const [editorialNotesCollapsed, setEditorialNotesCollapsed] = useState(true);

    const [referenceLibrary, setReferenceLibrary] = useState<ReferenceMaterial[]>(
        initialReferenceLibrary,
    );
    const [storyReferenceIds, setStoryReferenceIds] = useState<string[]>([
        "founding-screenshot",
        "founding-message",
    ]);
    const [referenceSectionCollapsed, setReferenceSectionCollapsed] =
        useState(false);
    const [referenceToAdd, setReferenceToAdd] = useState<string | null>(null);
    const [referenceModalOpen, setReferenceModalOpen] = useState(false);
    const [referenceKind, setReferenceKind] = useState<ReferenceKind>("Screenshot");
    const [referenceTitle, setReferenceTitle] = useState("");
    const [referenceSource, setReferenceSource] = useState("");
    const [referenceContent, setReferenceContent] = useState("");
    const [referenceContextNote, setReferenceContextNote] = useState("");
    const [referenceImageUrl, setReferenceImageUrl] = useState("");
    const [referenceFileUrl, setReferenceFileUrl] = useState("");
    const [referenceFileName, setReferenceFileName] = useState("");
    const [referenceFileType, setReferenceFileType] = useState("");
    const [referenceFileSize, setReferenceFileSize] = useState(0);

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
            Link.configure({
                openOnClick: false,
                autolink: false,
                linkOnPaste: false,
                HTMLAttributes: {
                    rel: "noopener noreferrer",
                    class: "story-link",
                },
            }),
        ],

        content: `
            <p>Every colony has a beginning. For Predatus, that beginning is tied to the people who came together to build a lasting home.</p>
            <h2>The first settlers</h2>
            <p><a href="/colonists/anna-mesa" style="color: #A95728">Anna Mesa</a> and Merulo Jay are remembered as the founders of the colony. Their early decisions shaped the community that followed.</p>
            <p>As the settlement grew, the <a href="/legacies/mesa" style="color: #A95728">Mesa legacy</a> became closely associated with its identity.</p>
            <blockquote><p>A colony is more than the place where people live. It is the history they leave behind.</p></blockquote>
            <h2>A lasting home</h2>
            <p>The colony would eventually become <a href="/locations/predatus">Predatus</a>, a place with a history shaped by its founders, their descendants, and the events that followed.</p>
            <ul>
                <li>Record the people involved.</li>
                <li>Preserve the events that shaped the colony.</li>
                <li>Connect the story to the wider archive.</li>
            </ul>
        `,

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
                    openCommentForSelection();
                    return true;
                }

                return false;
            },
        },

        onCreate: ({ editor: createdEditor }) => {
            const text = createdEditor.getText().trim();
            setWordCount(text ? text.split(/\s+/).length : 0);
            setInlineRelatedRecordIds(getInlineArchiveRecordIds(createdEditor));
        },

        onUpdate: ({ editor: updatedEditor }) => {
            setSaveMessage("");

            const text = updatedEditor.getText().trim();
            setWordCount(text ? text.split(/\s+/).length : 0);

            setInlineRelatedRecordIds(getInlineArchiveRecordIds(updatedEditor));
        },
    });

    const filteredArchiveRecords = useMemo(() => {
        const query = archiveSearch.trim().toLowerCase();

        return archiveRecords.filter((record) => {
            const matchesCategory =
                archiveCategory === "All" ||
                record.category === archiveCategory;

            const matchesSearch =
                !query ||
                record.title.toLowerCase().includes(query) ||
                record.category.toLowerCase().includes(query) ||
                record.subtitle?.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    }, [archiveCategory, archiveSearch]);

    const dateDescription = useMemo(() => {
        if (dateType === "unknown") return "Date unknown";

        const start = formatStoryDate(startDate);

        if (dateType === "range") {
            return `${start} – ${formatStoryDate(endDate)}`;
        }

        return start;
    }, [dateType, startDate, endDate]);

    const relatedRecords = useMemo(() => {
        const associatedIds = new Set([
            ...manualRelatedRecordIds,
            ...inlineRelatedRecordIds,
        ]);

        return archiveRecords
            .filter((record) => associatedIds.has(record.id))
            .sort(
                (a, b) =>
                    archiveCategories.indexOf(a.category) -
                    archiveCategories.indexOf(b.category),
            );
    }, [manualRelatedRecordIds, inlineRelatedRecordIds]);

    const relatedRecordOptions = useMemo(
        () =>
            archiveRecords
                .slice()
                .sort(
                    (a, b) =>
                        archiveCategories.indexOf(a.category) -
                        archiveCategories.indexOf(b.category),
                )
                .map((record) => ({
                    value: record.id,
                    label: `${record.title} · ${record.category}`,
                })),
        [],
    );

    const attachedReferences = useMemo(
        () => referenceLibrary.filter((reference) => storyReferenceIds.includes(reference.id)),
        [referenceLibrary, storyReferenceIds],
    );

    const availableReferenceOptions = useMemo(
        () =>
            referenceLibrary
                .filter((reference) => !storyReferenceIds.includes(reference.id))
                .map((reference) => ({
                    value: reference.id,
                    label: `${reference.title} · ${reference.kind}`,
                })),
        [referenceLibrary, storyReferenceIds],
    );

    if (!editor) {
        return (
            <Card withBorder padding="xl" radius="md">
                <Text c="dimmed">Loading story editor…</Text>
            </Card>
        );
    }

    function applyArchiveLink(record: ArchiveRecord) {
        if (!editor) return;

        const selection = archiveSelection ?? {
            from: editor.state.selection.from,
            to: editor.state.selection.to,
        };

        const { from, to } = selection;
        const hasSelection = from !== to;
        const linkText = hasSelection ? null : record.title;
        const linkStart = from;
        const linkEnd = hasSelection ? to : from + record.title.length;

        const { state, view } = editor;
        const linkType = state.schema.marks.link;
        const textStyleType = state.schema.marks.textStyle;

        if (!linkType) {
            console.error("The editor schema does not contain a link mark.");
            return;
        }

        let tr = state.tr;

        if (!hasSelection) {
            tr.insertText(linkText!, from);
        }

        tr.removeMark(linkStart, linkEnd, linkType);

        tr.addMark(
            linkStart,
            linkEnd,
            linkType.create({
                href: record.href,
                target: null,
                rel: "noopener noreferrer",
            }),
        );

        if (textStyleType && record.color) {
            tr.addMark(
                linkStart,
                linkEnd,
                textStyleType.create({ color: record.color }),
            );
        }

        tr.setSelection(TextSelection.create(tr.doc, linkEnd));
        tr.setStoredMarks([]);

        view.dispatch(tr);
        view.focus();

        setArchiveModalOpen(false);
        setArchiveSelection(null);
        setArchiveSearch("");
        setArchiveCategory("All");
    }

    function removeLink() {
        if (!editor) return;

        editor.chain().focus().unsetLink().unsetColor().run();
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

    function insertStoryImage() {
        if (!editor || !imageUrl.trim()) return;

        const safeAlignment = ["left", "center", "right"].includes(imageAlignment)
            ? imageAlignment
            : "center";

        editor
            .chain()
            .focus()
            .insertContent({
                type: "storyImage",
                attrs: {
                    src: imageUrl.trim(),
                    alt: imageAlt.trim(),
                    caption: imageCaption.trim(),
                    align: safeAlignment,
                },
            })
            .run();

        setImageModalOpen(false);
        setImageUrl("");
        setImageAlt("");
        setImageCaption("");
        setImageAlignment("center");
    }
    function getCommentRange(commentId: string) {
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
    function showCommentPreview(target: HTMLElement) {
        // Keep the preview visible while moving the pointer onto it.
        if (target.closest("[data-comment-preview]")) {
            return;
        }

        // Editorial comments are only interactive in the editor, not the preview.
        if (target.closest(".previewContent")) {
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

        const commentRects = commentElement.getClientRects();
        const rect = commentRects[commentRects.length - 1];

        if (!rect) {
            setCommentPreview(null);
            return;
        }

        const previewWidth = Math.min(240, window.innerWidth - 24);
        const previewHeight = 160;
        const gap = 8;

        // Prefer the top-right of the commented text.
        let left = rect.right + gap;
        let top = rect.top - 4;

        // If there isn't enough room on the right, use the left.
        if (left + previewWidth > window.innerWidth - 12) {
            left = rect.left - previewWidth - gap;
        }

        // Keep the preview inside the viewport.
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

    function openCommentForSelection() {
        if (!editor) return;

        const { from, to } = editor.state.selection;

        setCommentSelection({ from, to });
        setActiveCommentId(null);
        setCommentText("");
        setCommentModalOpen(true);
    }

    function openExistingComment(commentId: string) {
        const comment = editorialComments.find(
            (item) => item.id === commentId,
        );

        const range = getCommentRange(commentId);

        if (!comment || !range) return;

        setCommentSelection(range);
        setActiveCommentId(commentId);
        setCommentText(comment.text);
        setCommentModalOpen(true);
    }
    function saveEditorialComment() {
        if (!editor || !commentSelection || !commentText.trim()) return;

        if (activeCommentId) {
            setEditorialComments((current) =>
                current.map((comment) =>
                    comment.id === activeCommentId
                        ? { ...comment, text: commentText.trim() }
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

            setEditorialComments((current) => [
                ...current,
                { id, text: commentText.trim() },
            ]);
        }

        setCommentModalOpen(false);
        setCommentSelection(null);
        setActiveCommentId(null);
        setCommentText("");
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

        setEditorialComments((current) =>
            current.filter((comment) => comment.id !== activeCommentId),
        );

        setCommentModalOpen(false);
        setCommentSelection(null);
        setActiveCommentId(null);
        setCommentText("");
    }

    function createCollection() {
        const name = newCollectionName.trim();
        if (!name) return;

        const existing = availableCollections.find(
            (collection) =>
                collection.toLowerCase() === name.toLowerCase(),
        );

        const collection = existing ?? name;

        if (!existing) {
            setAvailableCollections((current) => [...current, collection]);
        }

        setCollections((current) =>
            current.includes(collection) ? current : [...current, collection],
        );

        setNewCollectionName("");
        setCreatingCollection(false);
    }

    function resetReferenceForm() {
        if (referenceImageUrl.startsWith("blob:")) {
            URL.revokeObjectURL(referenceImageUrl);
        }
        if (referenceFileUrl.startsWith("blob:")) {
            URL.revokeObjectURL(referenceFileUrl);
        }
        setReferenceKind("Screenshot");
        setReferenceTitle("");
        setReferenceSource("");
        setReferenceContent("");
        setReferenceContextNote("");
        setReferenceImageUrl("");
        setReferenceFileUrl("");
        setReferenceFileName("");
        setReferenceFileType("");
        setReferenceFileSize(0);
    }

    function closeReferenceModal() {
        setReferenceModalOpen(false);
        resetReferenceForm();
    }

    function changeReferenceKind(nextKind: ReferenceKind) {
        if (referenceKind === "Screenshot" && nextKind !== "Screenshot") {
            if (referenceImageUrl.startsWith("blob:")) {
                URL.revokeObjectURL(referenceImageUrl);
            }
            setReferenceImageUrl("");
        }
        if (referenceKind === "File attachment" && nextKind !== "File attachment") {
            if (referenceFileUrl.startsWith("blob:")) {
                URL.revokeObjectURL(referenceFileUrl);
            }
            setReferenceFileUrl("");
            setReferenceFileName("");
            setReferenceFileType("");
            setReferenceFileSize(0);
        }
        setReferenceKind(nextKind);
    }

    function createReferenceMaterial() {
        const nextTitle = referenceTitle.trim();
        if (!nextTitle) return;

        const reference: ReferenceMaterial = {
            id: crypto.randomUUID(),
            kind: referenceKind,
            title: nextTitle,
            source: referenceSource.trim(),
            content: referenceContent.trim(),
            contextNote: referenceContextNote.trim(),
            ...(referenceKind === "Screenshot" && referenceImageUrl
                ? { imageUrl: referenceImageUrl }
                : {}),
            ...(referenceKind === "File attachment" && referenceFileUrl
                ? {
                    attachmentUrl: referenceFileUrl,
                    attachmentName: referenceFileName,
                    attachmentType: referenceFileType,
                    attachmentSize: referenceFileSize,
                }
                : {}),
        };

        setReferenceLibrary((current) => [reference, ...current]);
        setStoryReferenceIds((current) => [reference.id, ...current]);
        setReferenceModalOpen(false);

        // Any selected object URL now belongs to the new library item for this prototype session.
        setReferenceKind("Screenshot");
        setReferenceTitle("");
        setReferenceSource("");
        setReferenceContent("");
        setReferenceContextNote("");
        setReferenceImageUrl("");
        setReferenceFileUrl("");
        setReferenceFileName("");
        setReferenceFileType("");
        setReferenceFileSize(0);
    }

    function handleSavePlaceholder() {
        setSaveMessage(
            "Saving isn't connected yet. Your changes have not been saved to the database.",
        );
    }

    return (
        <Stack
            gap="lg"
            className={classes.page}
            style={{
                maxWidth: 1200,
                width: "100%",
                marginInline: "auto",
            }}
        >
            <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                    <Group gap="xs">
                        <Button
                            component="a"
                            href="/stories"
                            variant="subtle"
                            color="gray"
                            leftSection={<ArrowLeft size={16} />}
                            size="compact-sm"
                        >
                            Stories
                        </Button>

                        <Text c="dimmed" size="sm">
                            / Prototype editor
                        </Text>
                    </Group>

                    <Text fw={700} size="xl">
                        Story editor prototype
                    </Text>

                    <Text c="dimmed" size="sm">
                        Explore the editing workflow before connecting it to
                        the database.
                    </Text>
                </Stack>
            </Group>

            <Card
                withBorder
                padding="lg"
                radius="md"
                className={classes.metadataCard}
            >
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Text fw={600}>Story details</Text>

                        <Group gap="xs" wrap="nowrap">
                            {!metadataCollapsed && (
                                <Badge
                                    color={status === "Draft" ? "gray" : "teal"}
                                    variant="light"
                                >
                                    {status}
                                </Badge>
                            )}

                            <Button
                                variant="subtle"
                                color="mesa"
                                size="compact-sm"
                                rightSection={
                                    metadataCollapsed ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronUp size={16} />
                                    )
                                }
                                onClick={() =>
                                    setMetadataCollapsed((collapsed) => !collapsed)
                                }
                                aria-expanded={!metadataCollapsed}
                            >
                                {metadataCollapsed ? "Show details" : "Hide details"}
                            </Button>
                        </Group>
                    </Group>

                    {metadataCollapsed && (
                        <Stack gap="xs">
                            <Group gap="xs" align="center">
                                <Text fw={600} lineClamp={2}>
                                    {title || "Untitled story"}
                                </Text>

                                {storyType && (
                                    <Badge variant="light" color="gray">
                                        {storyType}
                                    </Badge>
                                )}

                                <Badge
                                    color={status === "Draft" ? "gray" : "teal"}
                                    variant="light"
                                >
                                    {status}
                                </Badge>
                            </Group>

                            <Text size="sm" c="dimmed">
                                {dateDescription}
                            </Text>
                        </Stack>
                    )}

                    <Collapse expanded={!metadataCollapsed}>
                        <Stack gap="md">
                            <TextInput
                                label="Title"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.currentTarget.value)
                                }
                                placeholder="Give this story a title"
                            />

                            <Textarea
                                label="Summary"
                                description="Optional. A short introduction for story listings."
                                value={summary}
                                onChange={(event) =>
                                    setSummary(event.currentTarget.value)
                                }
                                minRows={2}
                                autosize
                            />

                            <Group grow align="flex-start">
                                <Select
                                    label="Story type"
                                    data={[
                                        "Colony history",
                                        "Personal history",
                                        "Family history",
                                        "Major event",
                                        "Disaster",
                                        "Rescue",
                                        "Relic history",
                                        "Other",
                                    ]}
                                    value={storyType}
                                    onChange={(value) => {
                                        if (value) setStoryType(value);
                                    }}
                                    allowDeselect={false}
                                />

                                <Stack gap={6}>
                                    <Text fw={500} size="sm">
                                        Publication status
                                    </Text>

                                    <SegmentedControl
                                        fullWidth
                                        value={status}
                                        onChange={(value) => {
                                            if (
                                                value === "Draft" ||
                                                value === "Complete"
                                            ) {
                                                setStatus(value);
                                            }
                                        }}
                                        data={[
                                            { label: "Draft", value: "Draft" },
                                            { label: "Complete", value: "Complete" },
                                        ]}
                                        styles={{
                                            root: {
                                                backgroundColor: "#24201d",
                                            },
                                            indicator: {
                                                backgroundColor: "#A95728",
                                            },
                                            label: {
                                                color: "#d6d6d6",
                                            },
                                        }}
                                    />
                                </Stack>
                            </Group>

                            <TagsInput
                                label="Tags"
                                description="Add tags to help categorize and find this story."
                                placeholder={
                                    tags.length === 0
                                        ? "Type a tag and press Enter"
                                        : "Add another tag"
                                }
                                value={tags}
                                onChange={setTags}
                                splitChars={[","]}
                                clearable
                            />

                            {creatingCollection ? (
                                <Stack gap="md">
                                    <div>
                                        <Text fw={600}>Create new collection</Text>
                                        <Text size="xs" c="dimmed">
                                            Create a collection to group related stories together.
                                        </Text>
                                    </div>

                                    <TextInput
                                        label="Name"
                                        placeholder="Collection name"
                                        value={newCollectionName}
                                        onChange={(event) =>
                                            setNewCollectionName(event.currentTarget.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                createCollection();
                                            }
                                        }}
                                        required
                                    />

                                    <Group>
                                        <Button
                                            type="button"
                                            variant="light"
                                            color="mesa"
                                            leftSection={<X size={16} />}
                                            onClick={() => {
                                                setCreatingCollection(false);
                                                setNewCollectionName("");
                                            }}
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            type="button"
                                            color="mesa"
                                            leftSection={<Plus size={16} />}
                                            disabled={!newCollectionName.trim()}
                                            onClick={createCollection}
                                        >
                                            Create collection
                                        </Button>
                                    </Group>
                                </Stack>
                            ) : (
                                <Group align="flex-end" gap="sm" wrap="nowrap">
                                    <MultiSelect
                                        label="Collections"
                                        description="Group this story into one or more collections."
                                        placeholder={
                                            collections.length === 0
                                                ? "Select collections"
                                                : "Add another collection"
                                        }
                                        data={availableCollections}
                                        value={collections}
                                        onChange={setCollections}
                                        searchable
                                        clearable
                                        hidePickedOptions
                                        style={{ flex: 1, minWidth: 0 }}
                                    />

                                    <Button
                                        type="button"
                                        variant="light"
                                        color="mesa"
                                        leftSection={<Plus size={16} />}
                                        onClick={() => setCreatingCollection(true)}
                                        style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                                    >
                                        Create collection
                                    </Button>
                                </Group>
                            )}
                        </Stack>

                        <Divider my="md" />

                        <Stack gap="md">
                            <Text fw={500} size="sm">
                                Story date
                            </Text>

                            <SegmentedControl
                                fullWidth
                                value={dateType}
                                onChange={setDateType}
                                data={[
                                    { label: "Single date", value: "single" },
                                    { label: "Date range", value: "range" },
                                    { label: "Unknown", value: "unknown" },
                                ]}
                                styles={{
                                    root: { backgroundColor: "#24201d" },
                                    indicator: { backgroundColor: "#A95728" },
                                    label: { color: "#d6d6d6" },
                                }}
                            />

                            {dateType !== "unknown" && (
                                <Stack gap="md">
                                    <StoryDateFields
                                        label={dateType === "range" ? "Start date" : "Date"}
                                        value={startDate}
                                        onChange={setStartDate}
                                    />

                                    {dateType === "range" && (
                                        <StoryDateFields
                                            label="End date"
                                            value={endDate}
                                            onChange={setEndDate}
                                        />
                                    )}
                                </Stack>
                            )}

                            <Text size="xs" c="dimmed">
                                Displayed date: {dateDescription}
                            </Text>
                        </Stack>
                    </Collapse>
                </Stack>
            </Card>

            <Card
                withBorder
                radius="md"
                p="md"
                className={classes.refrenceCard}
            >
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Stack gap={2}>
                            <Text fw={600}>Related archive records</Text>
                            <Text size="sm" c="dimmed">
                                {relatedRecords.length === 0
                                    ? "No associated records"
                                    : `${relatedRecords.length} associated ${relatedRecords.length === 1 ? "record" : "records"
                                    }`}
                            </Text>
                        </Stack>

                        <Button
                            variant="subtle"
                            color="gray"
                            size="compact-sm"
                            rightSection={
                                relatedRecordsCollapsed ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronUp size={16} />
                                )
                            }
                            onClick={() =>
                                setRelatedRecordsCollapsed((collapsed) => !collapsed)
                            }
                            aria-expanded={!relatedRecordsCollapsed}
                        >
                            {relatedRecordsCollapsed ? "Show records" : "Hide records"}
                        </Button>
                    </Group>

                    <Collapse expanded={!relatedRecordsCollapsed}>
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Records associated with this story, either through inline
                                links or by manual selection.
                            </Text>

                            <MultiSelect
                                label="Manual associations"
                                description="Select records that are relevant even if they aren't linked in the story text."
                                placeholder="Search archive records..."
                                data={relatedRecordOptions}
                                value={manualRelatedRecordIds}
                                onChange={setManualRelatedRecordIds}
                                searchable
                                clearable
                                hidePickedOptions
                            />

                            {relatedRecords.length > 0 ? (
                                <Stack gap="xs">
                                    {relatedRecords.map((record) => {
                                        const isManual = manualRelatedRecordIds.includes(
                                            record.id,
                                        );
                                        const isInline = inlineRelatedRecordIds.includes(
                                            record.id,
                                        );

                                        const associationLabel =
                                            isManual && isInline
                                                ? "Inline + manual"
                                                : isInline
                                                    ? "Inline link"
                                                    : "Manual";

                                        return (
                                            <Group
                                                key={record.id}
                                                justify="space-between"
                                                align="center"
                                                wrap="nowrap"
                                                p="sm"
                                                style={{
                                                    border: "1px solid var(--mantine-color-dark-4)",
                                                    borderRadius: "var(--mantine-radius-md)",
                                                }}
                                            >
                                                <Stack gap={2} style={{ minWidth: 0 }}>
                                                    <Text
                                                        component="a"
                                                        href={record.href}
                                                        fw={500}
                                                        size="sm"
                                                        c={record.color ?? "mesa"}
                                                        style={{
                                                            overflowWrap: "anywhere",
                                                        }}
                                                    >
                                                        {record.title}
                                                    </Text>

                                                    <Text size="xs" c="dimmed">
                                                        {record.category}
                                                        {record.subtitle
                                                            ? ` · ${record.subtitle}`
                                                            : ""}
                                                    </Text>
                                                </Stack>

                                                <Group gap="xs" wrap="nowrap">
                                                    <Badge
                                                        variant="light"
                                                        color={
                                                            isManual && isInline
                                                                ? "teal"
                                                                : "gray"
                                                        }
                                                    >
                                                        {associationLabel}
                                                    </Badge>

                                                    {isManual && (
                                                        <Tooltip
                                                            label="Remove manual association"
                                                            withArrow
                                                        >
                                                            <ActionIcon
                                                                type="button"
                                                                variant="subtle"
                                                                color="gray"
                                                                aria-label={`Remove manual association for ${record.title}`}
                                                                onClick={() =>
                                                                    setManualRelatedRecordIds(
                                                                        (current) =>
                                                                            current.filter(
                                                                                (id) =>
                                                                                    id !==
                                                                                    record.id,
                                                                            ),
                                                                    )
                                                                }
                                                            >
                                                                <X size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Group>
                                        );
                                    })}
                                </Stack>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    No related records yet. Link records in the story or add
                                    manual associations above.
                                </Text>
                            )}
                        </Stack>
                    </Collapse>
                </Stack>
            </Card>


            <Group justify="flex-end">
                <SegmentedControl
                    value={viewMode}
                    onChange={(value) =>
                        setViewMode(value as "edit" | "preview")
                    }
                    data={[
                        {
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <PencilIcon />
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

                                <span className={classes.toolbarDivider} />

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

                                <span className={classes.toolbarDivider} />

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

                                <span className={classes.toolbarDivider} />

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

                                <span className={classes.toolbarDivider} />

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

                                <span className={classes.toolbarDivider} />

                                <ToolbarButton
                                    label="Insert image"
                                    onClick={() => setImageModalOpen(true)}
                                >
                                    <ImagePlus size={16} />
                                </ToolbarButton>

                                <ToolbarButton
                                    label="Add comment (Ctrl + Shift + M)"
                                    onClick={openCommentForSelection}
                                >
                                    <MessageSquare size={16} />
                                </ToolbarButton>

                                <ToolbarButton
                                    label="Link to archive record"
                                    onClick={() => {
                                        const selection = editor.state.selection;
                                        setArchiveSelection({
                                            from: selection.from,
                                            to: selection.to,
                                        });
                                        setArchiveModalOpen(true);
                                    }}
                                >
                                    <LinkIcon size={16} />
                                </ToolbarButton>

                                <ToolbarButton
                                    label="Add external link"
                                    onClick={() => setExternalModalOpen(true)}
                                >
                                    <Unlink size={16} />
                                </ToolbarButton>

                                <ToolbarButton
                                    label="Remove link"
                                    disabled={!editor.isActive("link")}
                                    onClick={removeLink}
                                >
                                    <X size={16} />
                                </ToolbarButton>

                                <span className={classes.toolbarDivider} />

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

                                <span className={classes.toolbarDivider} />

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

                        <div
                            className={classes.editorCanvas}
                            onClick={(event) => {
                                const target = event.target as HTMLElement;

                                const commentMark = target.closest(
                                    "[data-editorial-comment], [data-editorial-comment-anchor]",
                                );

                                const commentId = commentMark?.getAttribute("data-comment-id");
                                if (commentId) {
                                    setCommentPreview(null);
                                    openExistingComment(commentId);
                                }
                            }}
                            onMouseOver={(event) => {
                                showCommentPreview(event.target as HTMLElement);
                            }}
                            onMouseLeave={() => {
                                setCommentPreview(null);
                            }}
                            onFocusCapture={(event) => {
                                const target = event.target as HTMLElement;

                                if (
                                    target.closest(
                                        "[data-editorial-comment], [data-editorial-comment-anchor]",
                                    )
                                ) {
                                    showCommentPreview(target);
                                }
                            }}
                            onBlurCapture={(event) => {
                                const nextTarget = event.relatedTarget as HTMLElement | null;

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
                                    className={classes.editorialCommentPreview}
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
                                        color={status === "Draft" ? "gray" : "teal"}
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

                                        {tags.map((tag, index) => (
                                            <Badge
                                                key={`${tag}-${index}`}
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

                        {relatedRecords.length > 0 && (
                            <>
                                <Divider my="xl" />

                                <Stack gap="sm">
                                    <Title order={3}>Related archive records</Title>

                                    <Group gap="sm" align="stretch" wrap="wrap">
                                        {relatedRecords.map((record) => (
                                            <Card
                                                key={record.id}
                                                component="a"
                                                href={record.href}
                                                withBorder
                                                padding="sm"
                                                radius="md"
                                                bg="#161616"
                                                style={{
                                                    borderColor: "#292929",
                                                    textDecoration: "none",
                                                    minWidth: 160,
                                                    maxWidth: "100%",
                                                    flex: "0 1 auto",
                                                }}
                                            >
                                                <Stack gap={4}>
                                                    <Text
                                                        fw={500}
                                                        size="sm"
                                                        c={record.color ?? "mesa"}
                                                        style={{ overflowWrap: "anywhere" }}
                                                    >
                                                        {record.title}
                                                    </Text>

                                                    <Text size="xs" c="dimmed">
                                                        {record.category}
                                                        {record.subtitle
                                                            ? ` · ${record.subtitle}`
                                                            : ""}
                                                    </Text>
                                                </Stack>
                                            </Card>
                                        ))}
                                    </Group>
                                </Stack>
                            </>
                        )}

                    </div>
                )}
            </Card>
            {viewMode === "edit" && (
                <Card
                    withBorder
                    padding="md"
                    radius="md"
                    bg="#161616"
                    style={{ borderColor: "#292929" }}
                >
                    <Stack gap="md">
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
                                <Group gap="xs" align="center">
                                    <Text fw={600}>Reference material</Text>
                                    <Badge variant="light" color="gray">
                                        {attachedReferences.length} attached
                                    </Badge>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    Reusable sources and clues used to reconstruct this story.
                                    Removing an item here only detaches it from this story;
                                    it remains in the prototype reference library.
                                </Text>
                            </Stack>

                            <Button
                                variant="subtle"
                                color="gray"
                                size="compact-sm"
                                rightSection={
                                    referenceSectionCollapsed
                                        ? <ChevronDown size={16} />
                                        : <ChevronUp size={16} />
                                }
                                onClick={() =>
                                    setReferenceSectionCollapsed((collapsed) => !collapsed)
                                }
                                aria-expanded={!referenceSectionCollapsed}
                            >
                                {referenceSectionCollapsed ? "Show references" : "Hide references"}
                            </Button>
                        </Group>

                        <Collapse expanded={!referenceSectionCollapsed}>
                            <Stack gap="md">
                                <Group align="flex-end" gap="sm" wrap="nowrap">
                                    <Select
                                        label="Attach an existing reference"
                                        placeholder={
                                            availableReferenceOptions.length > 0
                                                ? "Search the reference library..."
                                                : "All references are attached"
                                        }
                                        data={availableReferenceOptions}
                                        value={referenceToAdd}
                                        onChange={(value) => {
                                            if (value) {
                                                setStoryReferenceIds((current) =>
                                                    current.includes(value)
                                                        ? current
                                                        : [...current, value],
                                                );
                                            }
                                            setReferenceToAdd(null);
                                        }}
                                        searchable
                                        clearable
                                        disabled={availableReferenceOptions.length === 0}
                                        style={{ flex: 1, minWidth: 0 }}
                                    />

                                    <Button
                                        type="button"
                                        color="mesa"
                                        variant="light"
                                        leftSection={<Plus size={16} />}
                                        onClick={() => setReferenceModalOpen(true)}
                                        style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                                    >
                                        New reference
                                    </Button>
                                </Group>

                                {attachedReferences.length > 0 ? (
                                    <Stack gap="sm">
                                        {attachedReferences.map((reference) => (
                                            <Card
                                                key={reference.id}
                                                withBorder
                                                padding="sm"
                                                radius="md"
                                                bg="#121212"
                                                style={{ borderColor: "#292929" }}
                                            >
                                                <Stack gap="sm">
                                                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                                                        <Group gap="sm" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                                                            <div
                                                                style={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    flex: "0 0 36px",
                                                                    borderRadius: 8,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    background: "#202020",
                                                                    color: "#b8b8b8",
                                                                }}
                                                            >
                                                                {reference.kind === "Screenshot" ? (
                                                                    <ImagePlus size={18} />
                                                                ) : reference.kind === "File attachment" ? (
                                                                    <Paperclip size={18} />
                                                                ) : (
                                                                    <FileText size={18} />
                                                                )}
                                                            </div>

                                                            <Stack gap={3} style={{ minWidth: 0 }}>
                                                                <Group gap="xs" align="center" wrap="wrap">
                                                                    <Text fw={600} size="sm" style={{ overflowWrap: "anywhere" }}>
                                                                        {reference.title}
                                                                    </Text>
                                                                    <Badge variant="outline" color="gray">
                                                                        {reference.kind}
                                                                    </Badge>
                                                                </Group>
                                                                {reference.source && (
                                                                    <Text size="xs" c="dimmed" style={{ overflowWrap: "anywhere" }}>
                                                                        Source: {reference.source}
                                                                    </Text>
                                                                )}
                                                            </Stack>
                                                        </Group>

                                                        <Tooltip label="Remove from this story" withArrow>
                                                            <ActionIcon
                                                                type="button"
                                                                variant="subtle"
                                                                color="gray"
                                                                aria-label={`Remove ${reference.title} from this story`}
                                                                onClick={() =>
                                                                    setStoryReferenceIds((current) =>
                                                                        current.filter((id) => id !== reference.id),
                                                                    )
                                                                }
                                                            >
                                                                <X size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>

                                                    {reference.imageUrl ? (
                                                        <img
                                                            src={reference.imageUrl}
                                                            alt={reference.title}
                                                            style={{
                                                                display: "block",
                                                                maxWidth: "100%",
                                                                maxHeight: 260,
                                                                objectFit: "contain",
                                                                objectPosition: "left center",
                                                                borderRadius: 6,
                                                                background: "#0d0d0d",
                                                            }}
                                                        />
                                                    ) : reference.kind === "Screenshot" ? (
                                                        <Group
                                                            gap="xs"
                                                            p="sm"
                                                            wrap="nowrap"
                                                            style={{
                                                                background: "#0d0d0d",
                                                                border: "1px dashed #333",
                                                                borderRadius: 6,
                                                            }}
                                                        >
                                                            <ImagePlus size={16} color="#888" />
                                                            <Text size="xs" c="dimmed">
                                                                Screenshot reference · {reference.source || "No filename recorded"}
                                                            </Text>
                                                        </Group>
                                                    ) : null}

                                                    {reference.kind === "File attachment" && (
                                                        <Group
                                                            gap="sm"
                                                            align="center"
                                                            justify="space-between"
                                                            wrap="wrap"
                                                            p="sm"
                                                            style={{
                                                                background: "#0d0d0d",
                                                                border: "1px solid #292929",
                                                                borderRadius: 6,
                                                            }}
                                                        >
                                                            <Group gap="sm" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                                                                <Paperclip size={18} color="#a0a0a0" />
                                                                <Stack gap={2} style={{ minWidth: 0 }}>
                                                                    <Text size="sm" fw={500} style={{ overflowWrap: "anywhere" }}>
                                                                        {reference.attachmentName || "No file attached"}
                                                                    </Text>
                                                                    {(reference.attachmentType || reference.attachmentSize !== undefined) && (
                                                                        <Text size="xs" c="dimmed">
                                                                            {reference.attachmentType || "File"}
                                                                            {reference.attachmentSize !== undefined
                                                                                ? ` · ${formatFileSize(reference.attachmentSize)}`
                                                                                : ""}
                                                                        </Text>
                                                                    )}
                                                                </Stack>
                                                            </Group>
                                                            {reference.attachmentUrl && reference.attachmentName ? (
                                                                <Button
                                                                    component="a"
                                                                    href={reference.attachmentUrl}
                                                                    download={reference.attachmentName}
                                                                    variant="light"
                                                                    color="gray"
                                                                    size="xs"
                                                                    leftSection={<Download size={14} />}
                                                                >
                                                                    Download
                                                                </Button>
                                                            ) : (
                                                                <Text size="xs" c="dimmed">
                                                                    No prototype file attached
                                                                </Text>
                                                            )}
                                                        </Group>
                                                    )}

                                                    {reference.content && (
                                                        <Stack gap={3}>
                                                            <Text size="xs" fw={600} c="dimmed">
                                                                {reference.kind === "Screenshot"
                                                                    ? "Caption / description"
                                                                    : reference.kind === "File attachment"
                                                                        ? "File description"
                                                                        : reference.kind === "Other"
                                                                            ? "Details"
                                                                            : "Source excerpt / details"}
                                                            </Text>
                                                            <Text size="sm" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                                                {reference.content}
                                                            </Text>
                                                        </Stack>
                                                    )}

                                                    {reference.contextNote && (
                                                        <Stack gap={3}>
                                                            <Text size="xs" fw={600} c="dimmed">
                                                                Why it's relevant
                                                            </Text>
                                                            <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                                                {reference.contextNote}
                                                            </Text>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            </Card>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Text size="sm" c="dimmed">
                                        No references attached yet. Add an existing item from the library or create a new reference.
                                    </Text>
                                )}
                            </Stack>
                        </Collapse>
                    </Stack>
                </Card>
            )}

            {viewMode === "edit" && (
                <Card
                    withBorder
                    padding="md"
                    radius="md"
                    bg="#161616"
                    style={{ borderColor: "#292929" }}
                >
                    <Group justify="space-between" align="center">
                        <Stack gap={2}>
                            <Text fw={600}>Private editorial notes</Text>
                            <Text size="sm" c="dimmed">
                                General reminders and ideas that aren't tied to a
                                particular passage.
                            </Text>
                        </Stack>

                        <Button
                            variant="subtle"
                            color="gray"
                            size="compact-sm"
                            rightSection={
                                editorialNotesCollapsed
                                    ? <ChevronDown size={16} />
                                    : <ChevronUp size={16} />
                            }
                            onClick={() =>
                                setEditorialNotesCollapsed((collapsed) => !collapsed)
                            }
                        >
                            {editorialNotesCollapsed ? "Show notes" : "Hide notes"}
                        </Button>
                    </Group>

                    <Collapse expanded={!editorialNotesCollapsed}>
                        <Textarea
                            mt="md"
                            aria-label="Private editorial notes"
                            placeholder="Things to revisit, research, or remember while writing..."
                            value={editorialNotes}
                            onChange={(event) =>
                                setEditorialNotes(event.currentTarget.value)
                            }
                            minRows={4}
                            autosize
                        />
                    </Collapse>
                </Card>
            )}

            <div className={classes.stickyActions}>
                <Group
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    className={classes.stickyActionsInner}
                >
                    <Group gap="xs">
                        <Badge
                            variant="light"
                            color={status === "Draft" ? "gray" : "teal"}
                        >
                            {status}
                        </Badge>

                        <Text size="sm" c="dimmed">
                            {saveMessage ||
                                "Prototype only — changes are not persisted."}
                        </Text>
                    </Group>

                    <Button
                        leftSection={<Save size={16} />}
                        onClick={handleSavePlaceholder}
                    >
                        Save
                    </Button>
                </Group>
            </div>
            <Modal
                opened={referenceModalOpen}
                onClose={closeReferenceModal}
                title="Create a reference"
                centered
                size="lg"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Create a reusable source in the prototype library and attach it to this story.
                        The source material and your contextual note are kept separate.
                    </Text>

                    <Select
                        label="Reference format"
                        data={[
                            { value: "Screenshot", label: "Screenshot / image" },
                            { value: "Text reference", label: "Text / written reference" },
                            { value: "File attachment", label: "File attachment" },
                            { value: "Other", label: "Other" },
                        ]}
                        value={referenceKind}
                        onChange={(value) => {
                            if (
                                value === "Screenshot" ||
                                value === "Text reference" ||
                                value === "File attachment" ||
                                value === "Other"
                            ) {
                                changeReferenceKind(value);
                            }
                        }}
                        allowDeselect={false}
                    />

                    <TextInput
                        label="Title"
                        placeholder={
                            referenceKind === "Screenshot"
                                ? "e.g. Predatus shortly after founding"
                                : referenceKind === "Text reference"
                                    ? "e.g. Founding entry in colony notes"
                                    : referenceKind === "File attachment"
                                        ? "e.g. Original colony save"
                                        : "Give this reference a useful title"
                        }
                        value={referenceTitle}
                        onChange={(event) => setReferenceTitle(event.currentTarget.value)}
                        required
                        autoFocus
                    />

                    <TextInput
                        label="Source / identifier (optional)"
                        placeholder={
                            referenceKind === "Screenshot"
                                ? "Where the screenshot came from"
                                : referenceKind === "Text reference"
                                    ? "Where this reference came from"
                                    : referenceKind === "File attachment"
                                        ? "Optional source or original location of the file"
                                        : "Any useful source or identifying details"
                        }
                        value={referenceSource}
                        onChange={(event) => setReferenceSource(event.currentTarget.value)}
                    />

                    {referenceKind === "Screenshot" && (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Screenshot file (optional)</Text>
                            <input
                                type="file"
                                accept="image/*"
                                aria-label="Choose a screenshot file"
                                onChange={(event) => {
                                    const file = event.currentTarget.files?.[0];
                                    if (!file) return;
                                    if (referenceImageUrl.startsWith("blob:")) {
                                        URL.revokeObjectURL(referenceImageUrl);
                                    }
                                    setReferenceImageUrl(URL.createObjectURL(file));
                                    setReferenceSource((current) => current.trim() ? current : file.name);
                                    event.currentTarget.value = "";
                                }}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    border: "1px solid #393939",
                                    borderRadius: 6,
                                    background: "#191919",
                                    color: "#d6d6d6",
                                }}
                            />
                            {referenceImageUrl && (
                                <Card
                                    withBorder
                                    padding="sm"
                                    radius="md"
                                    bg="#111"
                                    style={{ borderColor: "#292929" }}
                                >
                                    <Text size="xs" c="dimmed" mb="xs">Image preview</Text>
                                    <img
                                        src={referenceImageUrl}
                                        alt={referenceTitle || "Reference screenshot preview"}
                                        style={{
                                            display: "block",
                                            maxWidth: "100%",
                                            maxHeight: 220,
                                            objectFit: "contain",
                                            margin: "0 auto",
                                            borderRadius: 6,
                                        }}
                                    />
                                </Card>
                            )}
                            <Text size="xs" c="dimmed">
                                The local image is only kept in this prototype session; it is not uploaded or saved to the database.
                            </Text>
                        </Stack>
                    )}

                    {referenceKind === "File attachment" && (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Choose a file (optional)</Text>
                            <input
                                type="file"
                                aria-label="Choose a reference file"
                                onChange={(event) => {
                                    const file = event.currentTarget.files?.[0];
                                    if (!file) return;
                                    if (referenceFileUrl.startsWith("blob:")) {
                                        URL.revokeObjectURL(referenceFileUrl);
                                    }
                                    setReferenceFileUrl(URL.createObjectURL(file));
                                    setReferenceFileName(file.name);
                                    setReferenceFileType(file.type || "Unknown file type");
                                    setReferenceFileSize(file.size);
                                    event.currentTarget.value = "";
                                }}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    border: "1px solid #393939",
                                    borderRadius: 6,
                                    background: "#191919",
                                    color: "#d6d6d6",
                                }}
                            />
                            {referenceFileName && (
                                <Card
                                    withBorder
                                    padding="sm"
                                    radius="md"
                                    bg="#111"
                                    style={{ borderColor: "#292929" }}
                                >
                                    <Group gap="sm" align="center" wrap="nowrap">
                                        <Paperclip size={18} color="#a0a0a0" />
                                        <Stack gap={2} style={{ minWidth: 0 }}>
                                            <Text size="sm" fw={500} style={{ overflowWrap: "anywhere" }}>
                                                {referenceFileName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {referenceFileType || "File"} · {formatFileSize(referenceFileSize)}
                                            </Text>
                                        </Stack>
                                    </Group>
                                </Card>
                            )}
                            <Text size="xs" c="dimmed">
                                Any file type can be selected, including .docx, .txt and .rws. In this prototype it is kept locally for download until the page is refreshed; it is not uploaded to MinIO or saved to the database.
                            </Text>
                        </Stack>
                    )}

                    <Textarea
                        label={
                            referenceKind === "Screenshot"
                                ? "Caption / description"
                                : referenceKind === "Text reference"
                                    ? "Source excerpt / details"
                                    : referenceKind === "File attachment"
                                        ? "File description (optional)"
                                        : "Details (optional)"
                        }
                        placeholder={
                            referenceKind === "Screenshot"
                                ? "What does the screenshot show?"
                                : referenceKind === "Text reference"
                                    ? "Paste a relevant excerpt, record an identifying detail, or describe the source..."
                                    : referenceKind === "File attachment"
                                        ? "What is this file, and which part of it is relevant?"
                                        : "Describe this reference and why you are keeping it..."
                        }
                        value={referenceContent}
                        onChange={(event) => setReferenceContent(event.currentTarget.value)}
                        minRows={3}
                        autosize
                    />

                    <Textarea
                        label="Why it's relevant (optional)"
                        description="Your interpretation or a reminder of how this source helps reconstruct the story."
                        placeholder="What does this help establish, and what still needs checking?"
                        value={referenceContextNote}
                        onChange={(event) => setReferenceContextNote(event.currentTarget.value)}
                        minRows={2}
                        autosize
                    />

                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={closeReferenceModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="mesa"
                            leftSection={<Plus size={16} />}
                            onClick={createReferenceMaterial}
                            disabled={!referenceTitle.trim()}
                        >
                            Create and attach
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={commentModalOpen}
                onClose={() => setCommentModalOpen(false)}
                title={activeCommentId ? "Edit editorial comment" : "Add editorial comment"}
                centered
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        This comment is private and will not appear in the published story.
                    </Text>

                    <Textarea
                        label="Comment"
                        placeholder="What needs attention in this passage?"
                        value={commentText}
                        onChange={(event) =>
                            setCommentText(event.currentTarget.value)
                        }
                        minRows={3}
                        autosize
                        autoFocus
                    />

                    <Group justify="space-between">
                        <Group>
                            {activeCommentId && (
                                <Button
                                    variant="subtle"
                                    color="red"
                                    onClick={deleteEditorialComment}
                                >
                                    Delete comment
                                </Button>
                            )}
                        </Group>

                        <Group>
                            <Button
                                variant="subtle"
                                color="gray"
                                onClick={() => setCommentModalOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={saveEditorialComment}
                                disabled={!commentText.trim()}
                            >
                                Save comment
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={archiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                title="Link to an archive record"
                centered
                size="lg"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Select text to link that wording, or leave the cursor
                        in place to insert the record title as a new link.
                    </Text>

                    <Select
                        label="Record type"
                        value={archiveCategory}
                        onChange={(value) =>
                            setArchiveCategory(
                                (value as ArchiveCategory | "All") || "All",
                            )
                        }
                        data={[
                            { label: "All record types", value: "All" },
                            ...archiveCategories.map((category) => ({
                                label: category,
                                value: category,
                            })),
                        ]}
                        allowDeselect={false}
                    />

                    <TextInput
                        label="Search records"
                        placeholder="Search by name..."
                        value={archiveSearch}
                        onChange={(event) =>
                            setArchiveSearch(event.currentTarget.value)
                        }
                        leftSection={<LinkIcon size={15} />}
                    />

                    <ScrollArea.Autosize mah={320} type="auto">
                        <Stack gap="xs">
                            {filteredArchiveRecords.map((record) => (
                                <button
                                    type="button"
                                    key={record.id}
                                    className={classes.archiveRecord}
                                    onClick={() => applyArchiveLink(record)}
                                >
                                    <span
                                        className={classes.recordColor}
                                        style={{
                                            backgroundColor: record.color ?? "#e9904f",
                                        }}
                                    />

                                    <span className={classes.recordText}>
                                        <span className={classes.recordTitle}>
                                            {record.title}
                                        </span>

                                        <span className={classes.recordSubtitle}>
                                            {record.category}
                                            {record.subtitle ? ` · ${record.subtitle}` : ""}
                                        </span>
                                    </span>

                                    <Check
                                        size={16}
                                        className={classes.recordAction}
                                    />
                                </button>
                            ))}

                            {filteredArchiveRecords.length === 0 && (
                                <Text c="dimmed" size="sm" ta="center" py="lg">
                                    No matching records.
                                </Text>
                            )}
                        </Stack>
                    </ScrollArea.Autosize>
                </Stack>
            </Modal>

            <Modal
                opened={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                title="Insert an image"
                centered
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        This prototype inserts an image from a URL. Image
                        uploads and reusable archive storage can be added later.
                    </Text>

                    <TextInput
                        label="Image URL"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.currentTarget.value)}
                        required
                    />

                    {imageUrl.trim() && (
                        <Card
                            withBorder
                            padding="sm"
                            radius="md"
                            bg="#111"
                            style={{ borderColor: "#292929" }}
                        >
                            <Text size="xs" c="dimmed" mb="xs">
                                Preview
                            </Text>

                            <img
                                src={imageUrl.trim()}
                                alt={imageAlt.trim() || "Image preview"}
                                style={{
                                    display: "block",
                                    maxWidth: "100%",
                                    maxHeight: 220,
                                    objectFit: "contain",
                                    margin: "0 auto",
                                    borderRadius: 6,
                                }}
                            />
                        </Card>
                    )}

                    <TextInput
                        label="Alt text"
                        placeholder="Describe the image for accessibility"
                        value={imageAlt}
                        onChange={(event) => setImageAlt(event.currentTarget.value)}
                    />

                    <TextInput
                        label="Caption (optional)"
                        placeholder="A short description shown below the image"
                        value={imageCaption}
                        onChange={(event) => setImageCaption(event.currentTarget.value)}
                    />

                    <Select
                        label="Alignment"
                        data={[
                            { label: "Left", value: "left" },
                            { label: "Center", value: "center" },
                            { label: "Right", value: "right" },
                        ]}
                        value={imageAlignment}
                        onChange={(value) => setImageAlignment(value ?? "center")}
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
                            onClick={insertStoryImage}
                            disabled={!imageUrl.trim()}
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
                        Use this for a source or website outside the colony
                        archive. Select text in the story first to link that
                        text; otherwise, enter a label to insert.
                    </Text>

                    <TextInput
                        label="URL"
                        placeholder="https://example.com"
                        value={externalUrl}
                        onChange={(event) => setExternalUrl(event.currentTarget.value)}
                        required
                    />

                    <TextInput
                        label="Link text (optional)"
                        placeholder="Text to insert when no text is selected"
                        value={externalLabel}
                        onChange={(event) => setExternalLabel(event.currentTarget.value)}
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
                            onClick={applyExternalLink}
                            disabled={!externalUrl.trim()}
                        >
                            Add link
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

function PencilIcon() {
    return <PencilLine size={15} />;
}
