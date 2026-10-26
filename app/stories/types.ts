import type { JSONContent } from "@tiptap/core";

export type StoryStatusValue = "Draft" | "Complete";
export type StoryDateTypeValue = "single" | "range" | "unknown";

export type StoryDateEndpoint = {
    day: string;
    month: string;
    year: string;
    approximate: boolean;
};

export type StoryTiptapDocument = JSONContent & {
    type: "doc";
    content?: JSONContent[];
};

export type ArchiveRecordCategory =
    | "Colonist"
    | "Legacy"
    | "Group"
    | "Location"
    | "Relic"
    | "Story";

export type ArchiveRecordKey = `${ArchiveRecordCategory}:${number}`;

export type ArchiveRecord = {
    key: ArchiveRecordKey;
    id: number;
    category: ArchiveRecordCategory;
    title: string;
    href: string;
    color: string | null;
    subtitle: string | null;
};

export type ReferenceMaterialKind = "IMAGE" | "TEXT" | "FILE" | "OTHER";

export type ReferenceMaterialData = {
    id: number;
    title: string;
    kind: ReferenceMaterialKind;
    source: string | null;
    content: string | null;
    asset: {
        id: number;
        originalFileName: string;
        mimeType: string | null;
        sizeBytes: number | null;
    } | null;
};

/** The association between one story and a reusable reference. */
export type StoryReferenceValue = {
    referenceId: number;
    contextNote: string;
};

export type StoryEditorData = {
    id: number;
    title: string;
    summary: string;
    type: string;
    status: StoryStatusValue;
    content: StoryTiptapDocument;
    dateType: StoryDateTypeValue;
    startDate: StoryDateEndpoint;
    endDate: StoryDateEndpoint;
    tags: string[];
    collections: string[];
    manualRelatedRecordKeys: ArchiveRecordKey[];
    references: StoryReferenceValue[];
    editorialNotes: string;
    editorialComments: EditorialCommentData[];
};

export type SaveStoryInput = {
    id: number | null;
    title: string;
    summary: string;
    type: string;
    status: StoryStatusValue;
    contentJson: string;
    dateType: StoryDateTypeValue;
    startDate: StoryDateEndpoint;
    endDate: StoryDateEndpoint;
    tags: string[];
    collections: string[];
    manualRelatedRecordKeys: ArchiveRecordKey[];
    references: StoryReferenceValue[];
    editorialNotes: string;
    editorialComments: EditorialCommentData[];
};

export type EditorialCommentData = {
    id: string;
    text: string;
};

export const ARCHIVE_RECORD_CATEGORIES: ArchiveRecordCategory[] = [
    "Colonist",
    "Legacy",
    "Group",
    "Location",
    "Relic",
    "Story",
];

export const STORY_TYPE_OPTIONS = [
    "Colony history",
    "Personal history",
    "Family history",
    "Major event",
    "Disaster",
    "Rescue",
    "Relic history",
    "Other",
];

export const STORY_DATE_MONTHS = [
    "Aprimay",
    "Jugust",
    "Septober",
    "Decembary",
];

export const EMPTY_STORY_CONTENT: StoryTiptapDocument = {
    type: "doc",
    content: [{ type: "paragraph" }],
};

export function emptyStoryDateEndpoint(): StoryDateEndpoint {
    return {
        day: "",
        month: "",
        year: "",
        approximate: false,
    };
}

export function makeArchiveRecordKey(
    category: ArchiveRecordCategory,
    id: number,
): ArchiveRecordKey {
    return `${category}:${id}`;
}

export function parseArchiveRecordKey(
    value: string,
): { category: ArchiveRecordCategory; id: number } | null {
    const match = /^(Colonist|Legacy|Group|Location|Relic|Story):([1-9]\d*)$/.exec(
        value,
    );

    if (!match) return null;

    const category = match[1] as ArchiveRecordCategory;
    const id = Number(match[2]);

    if (!Number.isSafeInteger(id) || id < 1) return null;

    return { category, id };
}

export function getInlineArchiveRecordKeys(
    document: StoryTiptapDocument,
): ArchiveRecordKey[] {
    const keys = new Set<ArchiveRecordKey>();

    function visit(value: unknown) {
        if (!value || typeof value !== "object") return;

        const node = value as {
            marks?: Array<{
                type?: string;
                attrs?: Record<string, unknown>;
            }>;
            content?: unknown[];
        };

        for (const mark of node.marks ?? []) {
            if (mark.type !== "link" || !mark.attrs) continue;

            const category = mark.attrs.archiveRecordType;
            const id = Number(mark.attrs.archiveRecordId);

            if (
                typeof category === "string" &&
                ARCHIVE_RECORD_CATEGORIES.includes(
                    category as ArchiveRecordCategory,
                ) &&
                Number.isSafeInteger(id) &&
                id > 0
            ) {
                keys.add(
                    makeArchiveRecordKey(category as ArchiveRecordCategory, id),
                );
            }
        }

        for (const child of node.content ?? []) {
            visit(child);
        }
    }

    visit(document);
    return [...keys];
}

export function formatStoryDate(date: StoryDateEndpoint): string {
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

    return date.approximate ? `circa ${formattedDate}` : formattedDate;
}

export function stripEditorialAnnotations(
    document: StoryTiptapDocument,
): StoryTiptapDocument {
    function cleanNode(node: JSONContent): JSONContent | null {
        // Cursor-position comments must not appear in the narrative.
        if (node.type === "editorialCommentAnchor") {
            return null;
        }

        const cleaned: JSONContent = { ...node };

        // Preserve narrative text, but remove its private comment marks.
        if (node.marks) {
            const marks = node.marks.filter(
                (mark) => mark.type !== "editorialComment",
            );

            if (marks.length > 0) {
                cleaned.marks = marks;
            } else {
                delete cleaned.marks;
            }
        }

        // Recursively remove anchors while keeping the remaining content.
        if (node.content) {
            cleaned.content = node.content
                .map(cleanNode)
                .filter(
                    (child): child is JSONContent => child !== null,
                );
        }

        return cleaned;
    }

    return cleanNode(document) as StoryTiptapDocument;
}