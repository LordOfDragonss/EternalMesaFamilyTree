import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStoryArchiveRecords } from "../../archive-records";
import StoryEditor from "../../StoryEditor";
import {
    makeArchiveRecordKey,
    STORY_DATE_MONTHS,
    type StoryDateEndpoint,
    type StoryEditorData,
    type StoryTiptapDocument,
} from "../../types";
import { getReferenceMaterialLibrary } from "../../reference-materials";

function createDateEndpoint(
    day: number | null,
    month: number | null,
    year: number | null,
    approximate: boolean,
): StoryDateEndpoint {
    return {
        day: day === null ? "" : String(day),
        month:
            month === null
                ? ""
                : STORY_DATE_MONTHS[month - 1] ?? "",
        year: year === null ? "" : String(year),
        approximate,
    };
}

export default async function EditStoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: rawId } = await params;
    const id = Number(rawId);

    if (!Number.isSafeInteger(id) || id < 1) {
        notFound();
    }

    const [story, collections, tags, archiveRecords, references] = await Promise.all([
        prisma.story.findUnique({
            where: { id },
            include: {
                tags: {
                    include: { tag: true },
                },
                collectionLinks: {
                    include: { collection: true },
                },
                relatedColonists: {
                    where: { isManual: true },
                    select: { colonistId: true },
                },
                relatedLegacies: {
                    where: { isManual: true },
                    select: { legacyId: true },
                },
                relatedGroups: {
                    where: { isManual: true },
                    select: { groupId: true },
                },
                relatedLocations: {
                    where: { isManual: true },
                    select: { locationId: true },
                },
                relatedRelics: {
                    where: { isManual: true },
                    select: { relicId: true },
                },
                relatedStories: {
                    where: { isManual: true },
                    select: { relatedStoryId: true },
                },
                editorialComments: {
                    select: {
                        id: true,
                        text: true,
                    },
                },
                referenceLinks: {
                    select: {
                        referenceId: true,
                        contextNote: true,
                    },
                },
            },
        }),
        prisma.storyCollection.findMany({
            select: { name: true },
            orderBy: { name: "asc" },
        }),
        prisma.tag.findMany({
            select: { name: true },
            orderBy: { name: "asc" },
        }),
        getStoryArchiveRecords(id),
        getReferenceMaterialLibrary(),
    ]);

    if (!story) {
        notFound();
    }

    const manualRelatedRecordKeys = [
        ...story.relatedColonists.map(({ colonistId }) =>
            makeArchiveRecordKey("Colonist", colonistId),
        ),
        ...story.relatedLegacies.map(({ legacyId }) =>
            makeArchiveRecordKey("Legacy", legacyId),
        ),
        ...story.relatedGroups.map(({ groupId }) =>
            makeArchiveRecordKey("Group", groupId),
        ),
        ...story.relatedLocations.map(({ locationId }) =>
            makeArchiveRecordKey("Location", locationId),
        ),
        ...story.relatedRelics.map(({ relicId }) =>
            makeArchiveRecordKey("Relic", relicId),
        ),
        ...story.relatedStories.map(({ relatedStoryId }) =>
            makeArchiveRecordKey("Story", relatedStoryId),
        ),
    ];

    const initialStory: StoryEditorData = {
        id: story.id,
        title: story.title,
        summary: story.summary ?? "",
        type: story.type,
        status: story.status === "DRAFT" ? "Draft" : "Complete",
        content: story.content as unknown as StoryTiptapDocument,
        dateType:
            story.dateType === "SINGLE"
                ? "single"
                : story.dateType === "RANGE"
                    ? "range"
                    : "unknown",
        startDate: createDateEndpoint(
            story.dateStartDay,
            story.dateStartMonth,
            story.dateStartYear,
            story.dateStartApproximate,
        ),
        endDate: createDateEndpoint(
            story.dateEndDay,
            story.dateEndMonth,
            story.dateEndYear,
            story.dateEndApproximate,
        ),
        tags: story.tags.map(({ tag }) => tag.name),
        collections: story.collectionLinks.map(
            ({ collection }) => collection.name,
        ),
        manualRelatedRecordKeys,
        editorialNotes: story.editorialNotes ?? "",
        editorialComments: story.editorialComments.map((comment) => ({
            id: comment.id,
            text: comment.text,
        })),
        references: story.referenceLinks.map((link) => ({
            referenceId: link.referenceId,
            contextNote: link.contextNote ?? "",
        })),
    };

    return (
        <StoryEditor
            initialStory={initialStory}
            initialAvailableCollections={collections.map(
                (collection) => collection.name,
            )}
            initialAvailableTags={tags.map((tag) => tag.name)}
            availableArchiveRecords={archiveRecords}
            initialAvailableReferences={references}
        />
    );
}