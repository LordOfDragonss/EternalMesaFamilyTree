"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
    STORY_DATE_MONTHS,
    STORY_TYPE_OPTIONS,
    parseArchiveRecordKey,
    getInlineArchiveRecordKeys,
    type ArchiveRecordCategory,
    type ArchiveRecordKey,
    type EditorialCommentData,
    type SaveStoryInput,
    type StoryDateEndpoint,
    type StoryTiptapDocument,
    type ReferenceMaterialData,
    type ReferenceMaterialKind,
    type StoryReferenceValue,
} from "./types";

export type SaveStoryResult =
    | { ok: true; id: number }
    | { ok: false; error: string };

export type CreateStoryCollectionResult =
    | { ok: true; name: string }
    | { ok: false; error: string };

type ParsedStoryDate = {
    day: number | null;
    month: number | null;
    year: number | null;
    approximate: boolean;
};

type ParsedArchiveAssociation = {
    category: ArchiveRecordCategory;
    id: number;
    isManual: boolean;
    isInline: boolean;
};

function parsePositiveInteger(
    value: string,
    label: string,
    max?: number,
): number | null {
    const trimmed = value.trim();

    if (!trimmed) return null;

    if (!/^\d+$/.test(trimmed)) {
        throw new Error(`${label} must be a whole number.`);
    }

    const parsed = Number(trimmed);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed < 1 ||
        (max !== undefined && parsed > max)
    ) {
        throw new Error(
            max === undefined
                ? `${label} must be a positive whole number.`
                : `${label} must be between 1 and ${max}.`,
        );
    }

    return parsed;
}

function parseDateEndpoint(
    endpoint: StoryDateEndpoint,
    label: string,
): ParsedStoryDate {
    const day = parsePositiveInteger(endpoint.day, `${label} day`, 15);
    const year = parsePositiveInteger(endpoint.year, `${label} year`);

    let month: number | null = null;

    if (endpoint.month.trim()) {
        const monthIndex = STORY_DATE_MONTHS.indexOf(
            endpoint.month.trim(),
        );

        if (monthIndex === -1) {
            throw new Error(`${label} has an invalid month.`);
        }

        month = monthIndex + 1;
    }

    if (day !== null && month === null) {
        throw new Error(`${label}: select a month before selecting a day.`);
    }

    const hasDate = day !== null || month !== null || year !== null;

    return {
        day,
        month,
        year,
        approximate: hasDate && endpoint.approximate,
    };
}

function isTiptapDocument(
    value: unknown,
): value is StoryTiptapDocument {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const document = value as {
        type?: unknown;
        content?: unknown;
    };

    return (
        document.type === "doc" &&
        Array.isArray(document.content)
    );
}

function normalizeNames(value: unknown, label: string): string[] {
    if (
        !Array.isArray(value) ||
        !value.every((item) => typeof item === "string")
    ) {
        throw new Error(`${label} must be a list of names.`);
    }

    const result: string[] = [];
    const seen = new Set<string>();

    for (const rawName of value as string[]) {
        const name = rawName.trim();
        if (!name) continue;

        const key = name.toLocaleLowerCase();

        if (!seen.has(key)) {
            seen.add(key);
            result.push(name);
        }
    }

    return result;
}

function normalizeArchiveRecordKeys(
    value: unknown,
): ArchiveRecordKey[] {
    if (
        !Array.isArray(value) ||
        !value.every((item) => typeof item === "string")
    ) {
        throw new Error("Manual archive associations are invalid.");
    }

    const result = new Set<ArchiveRecordKey>();

    for (const key of value as string[]) {
        if (!parseArchiveRecordKey(key)) {
            throw new Error("One of the selected archive records is invalid.");
        }

        result.add(key as ArchiveRecordKey);
    }

    return [...result];
}

function normalizeEditorialComments(
    value: unknown,
): EditorialCommentData[] {
    if (!Array.isArray(value)) {
        throw new Error("Editorial comments must be a list.");
    }

    const comments: EditorialCommentData[] = [];
    const seen = new Set<string>();

    for (const item of value) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("An editorial comment is invalid.");
        }

        const candidate = item as {
            id?: unknown;
            text?: unknown;
        };

        if (
            typeof candidate.id !== "string" ||
            candidate.id.length < 1 ||
            candidate.id.length > 128 ||
            !/^[A-Za-z0-9_-]+$/.test(candidate.id) ||
            typeof candidate.text !== "string"
        ) {
            throw new Error("An editorial comment is invalid.");
        }

        const text = candidate.text.trim();

        // Empty comments are not persisted.
        if (!text) continue;

        if (seen.has(candidate.id)) {
            throw new Error("Duplicate editorial comment IDs were submitted.");
        }

        seen.add(candidate.id);
        comments.push({
            id: candidate.id,
            text,
        });
    }

    return comments;
}
function normalizeStoryReferences(value: unknown): StoryReferenceValue[] {
    if (!Array.isArray(value)) {
        throw new Error("Story references must be a list.");
    }

    const result: StoryReferenceValue[] = [];
    const seen = new Set<number>();

    for (const item of value) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("One of the story references is invalid.");
        }

        const candidate = item as {
            referenceId?: unknown;
            contextNote?: unknown;
        };

        if (
            typeof candidate.referenceId !== "number" ||
            !Number.isSafeInteger(candidate.referenceId) ||
            candidate.referenceId < 1 ||
            typeof candidate.contextNote !== "string"
        ) {
            throw new Error("One of the story references is invalid.");
        }

        if (seen.has(candidate.referenceId)) {
            throw new Error("A reference cannot be attached twice.");
        }

        seen.add(candidate.referenceId);

        result.push({
            referenceId: candidate.referenceId,
            contextNote: candidate.contextNote.trim(),
        });
    }

    return result;
}

async function resolveTagIds(
    tx: Prisma.TransactionClient,
    names: string[],
): Promise<number[]> {
    const ids: number[] = [];

    for (const name of names) {
        const existing = await tx.tag.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });

        const tag =
            existing ??
            await tx.tag.create({
                data: { name },
                select: { id: true },
            });

        ids.push(tag.id);
    }

    return ids;
}

async function resolveCollectionIds(
    tx: Prisma.TransactionClient,
    names: string[],
): Promise<number[]> {
    const ids: number[] = [];

    for (const name of names) {
        const existing = await tx.storyCollection.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });

        const collection =
            existing ??
            await tx.storyCollection.create({
                data: { name },
                select: { id: true },
            });

        ids.push(collection.id);
    }

    return ids;
}

async function validateArchiveTargets(
    tx: Prisma.TransactionClient,
    storyId: number,
    associations: ParsedArchiveAssociation[],
): Promise<void> {
    const idsByCategory = new Map<ArchiveRecordCategory, number[]>();

    for (const association of associations) {
        const current = idsByCategory.get(association.category) ?? [];
        current.push(association.id);
        idsByCategory.set(association.category, current);
    }

    for (const [category, rawIds] of idsByCategory) {
        const ids = [...new Set(rawIds)];

        if (category === "Story" && ids.includes(storyId)) {
            throw new Error("A story cannot link to itself.");
        }

        let existingIds: number[];

        switch (category) {
            case "Colonist":
                existingIds = (
                    await tx.colonist.findMany({
                        where: { id: { in: ids } },
                        select: { id: true },
                    })
                ).map((record) => record.id);
                break;

            case "Legacy":
                existingIds = (
                    await tx.legacy.findMany({
                        where: { id: { in: ids } },
                        select: { id: true },
                    })
                ).map((record) => record.id);
                break;

            case "Group":
                existingIds = (
                    await tx.group.findMany({
                        where: { id: { in: ids } },
                        select: { id: true },
                    })
                ).map((record) => record.id);
                break;

            case "Location":
                existingIds = (
                    await tx.location.findMany({
                        where: { id: { in: ids } },
                        select: { id: true },
                    })
                ).map((record) => record.id);
                break;

            case "Relic":
                existingIds = (
                    await tx.relic.findMany({
                        where: { id: { in: ids } },
                        select: { id: true },
                    })
                ).map((record) => record.id);
                break;

            case "Story":
                existingIds = (
                    await tx.story.findMany({
                        where: { id: { in: ids } },
                        select: { id: true },
                    })
                ).map((record) => record.id);
                break;
        }

        if (existingIds.length !== ids.length) {
            throw new Error(
                `One or more associated ${category.toLowerCase()} records no longer exist.`,
            );
        }
    }
}

async function syncArchiveAssociations(
    tx: Prisma.TransactionClient,
    storyId: number,
    manualKeys: ArchiveRecordKey[],
    inlineKeys: ArchiveRecordKey[],
): Promise<void> {
    const manualSet = new Set<string>(manualKeys);
    const inlineSet = new Set<string>(inlineKeys);

    const allKeys = new Set([...manualKeys, ...inlineKeys]);
    const associations: ParsedArchiveAssociation[] = [];

    for (const key of allKeys) {
        const parsed = parseArchiveRecordKey(key);
        if (!parsed) continue;

        associations.push({
            ...parsed,
            isManual: manualSet.has(key),
            isInline: inlineSet.has(key),
        });
    }

    await validateArchiveTargets(tx, storyId, associations);

    await tx.storyColonist.deleteMany({ where: { storyId } });
    await tx.storyLegacy.deleteMany({ where: { storyId } });
    await tx.storyGroup.deleteMany({ where: { storyId } });
    await tx.storyLocation.deleteMany({ where: { storyId } });
    await tx.storyRelic.deleteMany({ where: { storyId } });
    await tx.storyRelatedStory.deleteMany({ where: { storyId } });

    const colonists = associations.filter((item) => item.category === "Colonist");
    const legacies = associations.filter((item) => item.category === "Legacy");
    const groups = associations.filter((item) => item.category === "Group");
    const locations = associations.filter((item) => item.category === "Location");
    const relics = associations.filter((item) => item.category === "Relic");
    const stories = associations.filter((item) => item.category === "Story");

    if (colonists.length) {
        await tx.storyColonist.createMany({
            data: colonists.map((item) => ({
                storyId,
                colonistId: item.id,
                isManual: item.isManual,
                isInline: item.isInline,
            })),
        });
    }

    if (legacies.length) {
        await tx.storyLegacy.createMany({
            data: legacies.map((item) => ({
                storyId,
                legacyId: item.id,
                isManual: item.isManual,
                isInline: item.isInline,
            })),
        });
    }

    if (groups.length) {
        await tx.storyGroup.createMany({
            data: groups.map((item) => ({
                storyId,
                groupId: item.id,
                isManual: item.isManual,
                isInline: item.isInline,
            })),
        });
    }

    if (locations.length) {
        await tx.storyLocation.createMany({
            data: locations.map((item) => ({
                storyId,
                locationId: item.id,
                isManual: item.isManual,
                isInline: item.isInline,
            })),
        });
    }

    if (relics.length) {
        await tx.storyRelic.createMany({
            data: relics.map((item) => ({
                storyId,
                relicId: item.id,
                isManual: item.isManual,
                isInline: item.isInline,
            })),
        });
    }

    if (stories.length) {
        await tx.storyRelatedStory.createMany({
            data: stories.map((item) => ({
                storyId,
                relatedStoryId: item.id,
                isManual: item.isManual,
                isInline: item.isInline,
            })),
        });
    }
}

async function syncEditorialComments(
    tx: Prisma.TransactionClient,
    storyId: number,
    comments: EditorialCommentData[],
): Promise<void> {
    for (const comment of comments) {
        const existing = await tx.storyEditorialComment.findUnique({
            where: { id: comment.id },
            select: { storyId: true },
        });

        if (existing && existing.storyId !== storyId) {
            throw new Error(
                "An editorial comment belongs to another story.",
            );
        }

        if (existing) {
            await tx.storyEditorialComment.update({
                where: { id: comment.id },
                data: { text: comment.text },
            });
        } else {
            await tx.storyEditorialComment.create({
                data: {
                    id: comment.id,
                    storyId,
                    text: comment.text,
                },
            });
        }
    }

    const retainedIds = comments.map((comment) => comment.id);

    await tx.storyEditorialComment.deleteMany({
        where: {
            storyId,
            ...(retainedIds.length > 0
                ? { id: { notIn: retainedIds } }
                : {}),
        },
    });
}

async function syncStoryReferences(
    tx: Prisma.TransactionClient,
    storyId: number,
    references: StoryReferenceValue[],
): Promise<void> {
    const referenceIds = references.map(
        (reference) => reference.referenceId,
    );

    if (referenceIds.length > 0) {
        const existingReferences = await tx.referenceMaterial.findMany({
            where: {
                id: { in: referenceIds },
            },
            select: { id: true },
        });

        if (existingReferences.length !== referenceIds.length) {
            throw new Error(
                "One or more reference materials no longer exist.",
            );
        }
    }

    // Replace only this story's associations, not the reusable references.
    await tx.storyReference.deleteMany({
        where: { storyId },
    });

    if (references.length === 0) return;

    await tx.storyReference.createMany({
        data: references.map((reference) => ({
            storyId,
            referenceId: reference.referenceId,
            contextNote: reference.contextNote || null,
        })),
    });
}
function collectInlineStoryAssetIds(value: unknown): number[] {
    const found = new Set<number>();

    function visit(node: unknown) {
        if (!node || typeof node !== "object" || Array.isArray(node)) return;
        const record = node as { type?: unknown; attrs?: unknown; content?: unknown };

        if (record.type === "storyImage" && record.attrs && typeof record.attrs === "object") {
            const assetId = (record.attrs as { assetId?: unknown }).assetId;
            if (assetId !== null && assetId !== undefined) {
                if (typeof assetId !== "number" || !Number.isSafeInteger(assetId) || assetId < 1) {
                    throw new Error("One of the inline story image assets is invalid.");
                }
                found.add(assetId);
            }
        }

        if (Array.isArray(record.content)) {
            for (const child of record.content) visit(child);
        }
    }

    visit(value);
    return [...found];
}

async function syncStoryInlineAssets(
    tx: Prisma.TransactionClient,
    storyId: number,
    content: StoryTiptapDocument,
): Promise<void> {
    const assetIds = collectInlineStoryAssetIds(content);

    if (assetIds.length > 0) {
        const existing = await tx.storedAsset.findMany({
            where: { id: { in: assetIds } },
            select: { id: true },
        });
        if (existing.length !== assetIds.length) {
            throw new Error("One or more inline story image assets no longer exist.");
        }
    }

    await tx.storyInlineAsset.deleteMany({ where: { storyId } });
    if (assetIds.length > 0) {
        await tx.storyInlineAsset.createMany({
            data: assetIds.map((assetId) => ({ storyId, assetId })),
        });
    }
}

export async function createStoryCollection(
    inputName: string,
): Promise<CreateStoryCollectionResult> {
    const name = inputName.trim();

    if (!name) {
        return { ok: false, error: "Enter a collection name." };
    }

    try {
        const existing = await prisma.storyCollection.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
            select: { name: true },
        });

        if (existing) {
            return { ok: true, name: existing.name };
        }

        const collection = await prisma.storyCollection.create({
            data: { name },
            select: { name: true },
        });

        revalidatePath("/stories/create");
        revalidatePath("/stories");
        revalidatePath("/stories/collections");

        return { ok: true, name: collection.name };
    } catch (error) {
        console.error("Failed to create story collection:", error);

        return {
            ok: false,
            error: "The collection could not be created.",
        };
    }
}
export type CreateReferenceMaterialResult =
    | { ok: true; reference: ReferenceMaterialData }
    | { ok: false; error: string };

export async function createReferenceMaterial(input: {
    title: string;
    kind: ReferenceMaterialKind;
    source: string;
    content: string;
}): Promise<CreateReferenceMaterialResult> {
    if (
        !input ||
        typeof input.title !== "string" ||
        typeof input.source !== "string" ||
        typeof input.content !== "string"
    ) {
        return {
            ok: false,
            error: "The reference details are invalid.",
        };
    }

    const title = input.title.trim();

    if (!title) {
        return {
            ok: false,
            error: "A reference title is required.",
        };
    }

    const validKinds: ReferenceMaterialKind[] = [
        "IMAGE",
        "TEXT",
        "FILE",
        "OTHER",
    ];

    if (!validKinds.includes(input.kind)) {
        return {
            ok: false,
            error: "Select a valid reference type.",
        };
    }

    try {
        const reference = await prisma.referenceMaterial.create({
            data: {
                title,
                kind: input.kind,
                source: input.source.trim() || null,
                content: input.content.trim() || null,
            },
            select: {
                id: true,
                title: true,
                kind: true,
                source: true,
                content: true,
                asset: {
                    select: {
                        id: true,
                        originalFileName: true,
                        mimeType: true,
                        sizeBytes: true,
                    },
                },
            },
        });

        revalidatePath("/stories/create");

        return { ok: true, reference };
    } catch (error) {
        console.error("Failed to create reference material:", error);

        return {
            ok: false,
            error: "The reference could not be created.",
        };
    }
}

export async function saveStory(
    input: SaveStoryInput,
): Promise<SaveStoryResult> {
    const title = input.title.trim();
    const summary = input.summary.trim();
    const storyType = input.type.trim();

    if (!title) {
        return { ok: false, error: "A story title is required." };
    }

    if (!STORY_TYPE_OPTIONS.includes(storyType)) {
        return { ok: false, error: "Select a valid story type." };
    }

    if (input.status !== "Draft" && input.status !== "Complete") {
        return { ok: false, error: "Select a valid publication status." };
    }

    if (
        input.dateType !== "single" &&
        input.dateType !== "range" &&
        input.dateType !== "unknown"
    ) {
        return { ok: false, error: "Select a valid story date type." };
    }

    if (
        input.id !== null &&
        (!Number.isSafeInteger(input.id) || input.id < 1)
    ) {
        return { ok: false, error: "The story ID is invalid." };
    }

    if (typeof input.contentJson !== "string") {
        return { ok: false, error: "The story content could not be parsed." };
    }

    let content: StoryTiptapDocument;

    try {
        content = JSON.parse(input.contentJson) as StoryTiptapDocument;
    } catch {
        return { ok: false, error: "The story content could not be parsed." };
    }

    if (!isTiptapDocument(content)) {
        return {
            ok: false,
            error: "The story content is not a valid Tiptap document.",
        };
    }

    if (typeof input.editorialNotes !== "string") {
        return { ok: false, error: "The editorial notes are invalid." };
    }

    let tags: string[];
    let collections: string[];
    let manualKeys: ArchiveRecordKey[];
    let editorialComments: EditorialCommentData[];
    let references: StoryReferenceValue[];
    let startDate: ParsedStoryDate;
    let endDate: ParsedStoryDate;

    try {
        tags = normalizeNames(input.tags, "Tags");
        collections = normalizeNames(input.collections, "Collections");
        manualKeys = normalizeArchiveRecordKeys(input.manualRelatedRecordKeys);
        editorialComments = normalizeEditorialComments(input.editorialComments);
        references = normalizeStoryReferences(input.references);

        if (input.dateType === "unknown") {
            startDate = {
                day: null,
                month: null,
                year: null,
                approximate: false,
            };
            endDate = { ...startDate };
        } else {
            startDate = parseDateEndpoint(input.startDate, "Start date");

            endDate =
                input.dateType === "range"
                    ? parseDateEndpoint(input.endDate, "End date")
                    : {
                        day: null,
                        month: null,
                        year: null,
                        approximate: false,
                    };
        }
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Some story fields are invalid.",
        };
    }

    // Keep editorial marks/anchors in the saved document so the editor can
    // restore their positions. The reader-facing renderer must strip them.
    const inlineKeys = getInlineArchiveRecordKeys(content);

    const data = {
        title,
        summary: summary || null,
        type: storyType,
        status:
            input.status === "Draft"
                ? ("DRAFT" as const)
                : ("COMPLETE" as const),
        content: JSON.parse(JSON.stringify(content)) as Prisma.InputJsonValue,
        editorialNotes: input.editorialNotes.trim()
            ? input.editorialNotes
            : null,
        dateType:
            input.dateType === "single"
                ? ("SINGLE" as const)
                : input.dateType === "range"
                    ? ("RANGE" as const)
                    : ("UNKNOWN" as const),
        dateStartDay: startDate.day,
        dateStartMonth: startDate.month,
        dateStartYear: startDate.year,
        dateStartApproximate: startDate.approximate,
        dateEndDay: endDate.day,
        dateEndMonth: endDate.month,
        dateEndYear: endDate.year,
        dateEndApproximate: endDate.approximate,
    };

    try {
        const storyId = await prisma.$transaction(async (tx) => {
            const story =
                input.id === null
                    ? await tx.story.create({
                        data,
                        select: { id: true },
                    })
                    : await tx.story.update({
                        where: { id: input.id },
                        data,
                        select: { id: true },
                    });

            const tagIds = await resolveTagIds(tx, tags);
            const collectionIds = await resolveCollectionIds(tx, collections);

            await tx.storyTag.deleteMany({
                where: { storyId: story.id },
            });

            await tx.storyCollectionMembership.deleteMany({
                where: { storyId: story.id },
            });

            if (tagIds.length > 0) {
                await tx.storyTag.createMany({
                    data: tagIds.map((tagId) => ({
                        storyId: story.id,
                        tagId,
                    })),
                    skipDuplicates: true,
                });
            }

            if (collectionIds.length > 0) {
                await tx.storyCollectionMembership.createMany({
                    data: collectionIds.map((collectionId) => ({
                        storyId: story.id,
                        collectionId,
                    })),
                    skipDuplicates: true,
                });
            }

            await syncArchiveAssociations(
                tx,
                story.id,
                manualKeys,
                inlineKeys,
            );

            await syncEditorialComments(
                tx,
                story.id,
                editorialComments,
            );
            await syncStoryReferences(tx, story.id, references);
            await syncStoryInlineAssets(tx, story.id, content);

            return story.id;
        });

        revalidatePath(`/stories/${storyId}/edit`);
        revalidateStoryTagViews();

        return { ok: true, id: storyId };
    } catch (error) {
        console.error("Failed to save story:", error);

        const message =
            error instanceof Error ? error.message : "";

        if (
            message.includes("cannot link to itself") ||
            message.includes("no longer exist") ||
            message.includes("belongs to another story") ||
            message.includes("reference materials no longer exist")
        ) {
            return { ok: false, error: message };
        }

        return {
            ok: false,
            error: "The story could not be saved. Check the server logs for details.",
        };
    }
}
export type StoryTagManagementResult =
    | { ok: true; tagName: string }
    | { ok: false; error: string };

function revalidateStoryTagViews() {
    revalidatePath("/stories");
    revalidatePath("/stories/tags");
    revalidatePath("/stories/create");
}

export async function renameStoryTag(
    tagId: number,
    inputName: string,
): Promise<StoryTagManagementResult> {
    if (!Number.isSafeInteger(tagId) || tagId < 1) {
        return { ok: false, error: "The tag ID is invalid." };
    }

    if (typeof inputName !== "string" || !inputName.trim()) {
        return { ok: false, error: "Enter a tag name." };
    }

    const name = inputName.trim();

    try {
        const existingTag = await prisma.tag.findUnique({
            where: { id: tagId },
            select: { id: true },
        });

        if (!existingTag) {
            return { ok: false, error: "This tag no longer exists." };
        }

        const duplicate = await prisma.tag.findFirst({
            where: {
                id: { not: tagId },
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });

        if (duplicate) {
            return {
                ok: false,
                error: "A tag with that name already exists. Merge the tags instead.",
            };
        }

        const tag = await prisma.tag.update({
            where: { id: tagId },
            data: { name },
            select: { name: true },
        });

        revalidateStoryTagViews();

        return { ok: true, tagName: tag.name };
    } catch (error) {
        console.error("Failed to rename story tag:", error);

        return {
            ok: false,
            error: "The tag could not be renamed.",
        };
    }
}

export async function deleteStoryTag(
    tagId: number,
): Promise<StoryTagManagementResult> {
    if (!Number.isSafeInteger(tagId) || tagId < 1) {
        return { ok: false, error: "The tag ID is invalid." };
    }

    try {
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
            select: { name: true },
        });

        if (!tag) {
            return { ok: false, error: "This tag no longer exists." };
        }

        // The StoryTag relation cascades, so stories themselves remain intact.
        await prisma.tag.delete({
            where: { id: tagId },
        });

        revalidateStoryTagViews();

        return { ok: true, tagName: tag.name };
    } catch (error) {
        console.error("Failed to delete story tag:", error);

        return {
            ok: false,
            error: "The tag could not be removed.",
        };
    }
}

export async function mergeStoryTags(
    sourceTagId: number,
    targetTagId: number,
): Promise<StoryTagManagementResult> {
    if (
        !Number.isSafeInteger(sourceTagId) ||
        sourceTagId < 1 ||
        !Number.isSafeInteger(targetTagId) ||
        targetTagId < 1
    ) {
        return { ok: false, error: "One of the tag IDs is invalid." };
    }

    if (sourceTagId === targetTagId) {
        return { ok: false, error: "Choose two different tags." };
    }

    try {
        const targetName = await prisma.$transaction(async (tx) => {
            const source = await tx.tag.findUnique({
                where: { id: sourceTagId },
                select: { id: true },
            });

            const target = await tx.tag.findUnique({
                where: { id: targetTagId },
                select: { id: true, name: true },
            });

            if (!source || !target) {
                throw new Error("One or both selected tags no longer exist.");
            }

            const sourceAssignments = await tx.storyTag.findMany({
                where: { tagId: sourceTagId },
                select: { storyId: true },
            });

            if (sourceAssignments.length > 0) {
                await tx.storyTag.createMany({
                    data: sourceAssignments.map(({ storyId }) => ({
                        storyId,
                        tagId: targetTagId,
                    })),
                    skipDuplicates: true,
                });
            }

            // Removes the source tag and its old assignments.
            // The target tag and all stories are preserved.
            await tx.tag.delete({
                where: { id: sourceTagId },
            });

            return target.name;
        });

        revalidateStoryTagViews();

        return { ok: true, tagName: targetName };
    } catch (error) {
        console.error("Failed to merge story tags:", error);

        return {
            ok: false,
            error:
                error instanceof Error &&
                    error.message.includes("no longer exist")
                    ? error.message
                    : "The tags could not be merged.",
        };
    }
}
export type StoryCollectionManagementResult =
    | { ok: true; collectionName: string }
    | { ok: false; error: string };

function revalidateStoryCollectionViews(collectionId?: number) {
    revalidatePath("/stories");
    revalidatePath("/stories/collections");
    revalidatePath("/stories/create");
    revalidatePath("/stories/[id]/edit", "page");

    if (collectionId !== undefined) {
        revalidatePath(`/stories/collections/${collectionId}`);
    }
}

export async function renameStoryCollection(
    collectionId: number,
    inputName: string,
): Promise<StoryCollectionManagementResult> {
    if (!Number.isSafeInteger(collectionId) || collectionId < 1) {
        return { ok: false, error: "The collection ID is invalid." };
    }

    if (typeof inputName !== "string" || !inputName.trim()) {
        return { ok: false, error: "Enter a collection name." };
    }

    const name = inputName.trim();

    try {
        const current = await prisma.storyCollection.findUnique({
            where: { id: collectionId },
            select: { name: true },
        });

        if (!current) {
            return {
                ok: false,
                error: "This collection no longer exists.",
            };
        }

        const duplicate = await prisma.storyCollection.findFirst({
            where: {
                id: { not: collectionId },
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });

        if (duplicate) {
            return {
                ok: false,
                error: "A collection with that name already exists.",
            };
        }

        const collection = await prisma.storyCollection.update({
            where: { id: collectionId },
            data: { name },
            select: { name: true },
        });

        revalidateStoryCollectionViews(collectionId);

        return {
            ok: true,
            collectionName: collection.name,
        };
    } catch (error) {
        console.error("Failed to rename story collection:", error);

        return {
            ok: false,
            error: "The collection could not be renamed.",
        };
    }
}

export async function deleteStoryCollection(
    collectionId: number,
): Promise<StoryCollectionManagementResult> {
    if (!Number.isSafeInteger(collectionId) || collectionId < 1) {
        return { ok: false, error: "The collection ID is invalid." };
    }

    try {
        const deleted = await prisma.$transaction(async (tx) => {
            const collection = await tx.storyCollection.findUnique({
                where: { id: collectionId },
                select: {
                    name: true,
                    stories: {
                        select: { storyId: true },
                    },
                },
            });

            if (!collection) {
                throw new Error("COLLECTION_NOT_FOUND");
            }

            await tx.storyCollection.delete({
                where: { id: collectionId },
            });

            return {
                name: collection.name,
                storyIds: collection.stories.map(
                    ({ storyId }) => storyId,
                ),
            };
        });

        revalidateStoryCollectionViews(collectionId);

        for (const storyId of deleted.storyIds) {
            revalidatePath(`/stories/${storyId}`);
            revalidatePath(`/stories/${storyId}/edit`);
        }

        return {
            ok: true,
            collectionName: deleted.name,
        };
    } catch (error) {
        console.error("Failed to delete story collection:", error);

        return {
            ok: false,
            error:
                error instanceof Error &&
                    error.message === "COLLECTION_NOT_FOUND"
                    ? "This collection no longer exists."
                    : "The collection could not be deleted.",
        };
    }
}

export async function updateStoryCollectionMembers(
    collectionId: number,
    storyIds: number[],
): Promise<StoryCollectionManagementResult> {
    if (!Number.isSafeInteger(collectionId) || collectionId < 1) {
        return { ok: false, error: "The collection ID is invalid." };
    }

    if (
        !Array.isArray(storyIds) ||
        !storyIds.every(
            (id) => Number.isSafeInteger(id) && id > 0,
        )
    ) {
        return { ok: false, error: "The selected stories are invalid." };
    }

    const uniqueStoryIds = [...new Set(storyIds)];

    try {
        const updated = await prisma.$transaction(async (tx) => {
            const collection = await tx.storyCollection.findUnique({
                where: { id: collectionId },
                select: {
                    name: true,
                    stories: {
                        select: { storyId: true },
                    },
                },
            });

            if (!collection) {
                throw new Error("COLLECTION_NOT_FOUND");
            }

            if (uniqueStoryIds.length > 0) {
                const existingStories = await tx.story.findMany({
                    where: { id: { in: uniqueStoryIds } },
                    select: { id: true },
                });

                if (existingStories.length !== uniqueStoryIds.length) {
                    throw new Error("STORY_NOT_FOUND");
                }
            }

            const previouslyAssignedIds = collection.stories.map(
                ({ storyId }) => storyId,
            );

            // Replace this collection's memberships only.
            // Other collections and the stories themselves remain intact.
            await tx.storyCollectionMembership.deleteMany({
                where: { collectionId },
            });

            if (uniqueStoryIds.length > 0) {
                await tx.storyCollectionMembership.createMany({
                    data: uniqueStoryIds.map((storyId) => ({
                        collectionId,
                        storyId,
                    })),
                    skipDuplicates: true,
                });
            }

            return {
                name: collection.name,
                affectedStoryIds: [
                    ...new Set([
                        ...previouslyAssignedIds,
                        ...uniqueStoryIds,
                    ]),
                ],
            };
        });

        revalidateStoryCollectionViews(collectionId);

        for (const storyId of updated.affectedStoryIds) {
            revalidatePath(`/stories/${storyId}`);
            revalidatePath(`/stories/${storyId}/edit`);
        }

        return {
            ok: true,
            collectionName: updated.name,
        };
    } catch (error) {
        console.error("Failed to update story collection members:", error);

        let message = "The collection's stories could not be updated.";

        if (error instanceof Error) {
            if (error.message === "COLLECTION_NOT_FOUND") {
                message = "This collection no longer exists.";
            } else if (error.message === "STORY_NOT_FOUND") {
                message = "One or more selected stories no longer exist.";
            }
        }

        return { ok: false, error: message };
    }
}

export async function addStoryToCollection(
    collectionId: number,
    storyId: number,
): Promise<StoryCollectionManagementResult> {
    if (
        !Number.isSafeInteger(collectionId) ||
        collectionId < 1 ||
        !Number.isSafeInteger(storyId) ||
        storyId < 1
    ) {
        return { ok: false, error: "The collection or story ID is invalid." };
    }

    try {
        const collectionName = await prisma.$transaction(async (tx) => {
            const collection = await tx.storyCollection.findUnique({
                where: { id: collectionId },
                select: { name: true },
            });

            if (!collection) {
                throw new Error("COLLECTION_NOT_FOUND");
            }

            const story = await tx.story.findUnique({
                where: { id: storyId },
                select: { id: true },
            });

            if (!story) {
                throw new Error("STORY_NOT_FOUND");
            }

            await tx.storyCollectionMembership.createMany({
                data: [{ collectionId, storyId }],
                skipDuplicates: true,
            });

            return collection.name;
        });

        revalidateStoryCollectionViews(collectionId);
        revalidatePath(`/stories/${storyId}`);
        revalidatePath(`/stories/${storyId}/edit`);

        return { ok: true, collectionName };
    } catch (error) {
        console.error("Failed to add story to collection:", error);

        return {
            ok: false,
            error:
                error instanceof Error &&
                error.message === "COLLECTION_NOT_FOUND"
                    ? "This collection no longer exists."
                    : error instanceof Error &&
                        error.message === "STORY_NOT_FOUND"
                      ? "This story no longer exists."
                      : "The story could not be added to the collection.",
        };
    }
}

export async function removeStoryFromCollection(
    collectionId: number,
    storyId: number,
): Promise<StoryCollectionManagementResult> {
    if (
        !Number.isSafeInteger(collectionId) ||
        collectionId < 1 ||
        !Number.isSafeInteger(storyId) ||
        storyId < 1
    ) {
        return { ok: false, error: "The collection or story ID is invalid." };
    }

    try {
        const collection = await prisma.storyCollection.findUnique({
            where: { id: collectionId },
            select: { name: true },
        });

        if (!collection) {
            return {
                ok: false,
                error: "This collection no longer exists.",
            };
        }

        await prisma.storyCollectionMembership.deleteMany({
            where: {
                collectionId,
                storyId,
            },
        });

        revalidateStoryCollectionViews(collectionId);
        revalidatePath(`/stories/${storyId}`);
        revalidatePath(`/stories/${storyId}/edit`);

        return {
            ok: true,
            collectionName: collection.name,
        };
    } catch (error) {
        console.error("Failed to remove story from collection:", error);

        return {
            ok: false,
            error: "The story could not be removed from the collection.",
        };
    }
}