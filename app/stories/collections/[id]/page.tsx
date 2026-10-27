import {
    ActionIcon,
    Group,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
    formatStoryDate,
    STORY_DATE_MONTHS,
} from "../../types";
import CollectionDetailManager from "./CollectionDetailManager";
import classes from "../../story-library.module.css";

function formatDateEndpoint(
    day: number | null,
    month: number | null,
    year: number | null,
    approximate: boolean,
): string {
    return formatStoryDate({
        day: day === null ? "" : String(day),
        month:
            month !== null
                ? STORY_DATE_MONTHS[month - 1] ?? ""
                : "",
        year: year === null ? "" : String(year),
        approximate,
    });
}

function formatStoryPeriod(story: {
    dateType: string;
    dateStartDay: number | null;
    dateStartMonth: number | null;
    dateStartYear: number | null;
    dateStartApproximate: boolean;
    dateEndDay: number | null;
    dateEndMonth: number | null;
    dateEndYear: number | null;
    dateEndApproximate: boolean;
}): string {
    if (story.dateType === "UNKNOWN") {
        return "Date unknown";
    }

    const start = formatDateEndpoint(
        story.dateStartDay,
        story.dateStartMonth,
        story.dateStartYear,
        story.dateStartApproximate,
    );

    if (story.dateType !== "RANGE") {
        return start;
    }

    const end = formatDateEndpoint(
        story.dateEndDay,
        story.dateEndMonth,
        story.dateEndYear,
        story.dateEndApproximate,
    );

    if (start === "Date unknown") {
        return end === "Date unknown" ? end : `Until ${end}`;
    }

    if (end === "Date unknown") {
        return `From ${start}`;
    }

    return `${start} – ${end}`;
}

function formatUpdatedAt(date: Date): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

export default async function StoryCollectionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: rawId } = await params;
    const collectionId = Number(rawId);

    if (
        !Number.isSafeInteger(collectionId) ||
        collectionId < 1
    ) {
        notFound();
    }

    const collection = await prisma.storyCollection.findUnique({
        where: { id: collectionId },
        select: {
            id: true,
            name: true,
            stories: {
                select: {
                    story: {
                        select: {
                            id: true,
                            title: true,
                            summary: true,
                            type: true,
                            status: true,
                            updatedAt: true,
                            dateType: true,
                            dateStartDay: true,
                            dateStartMonth: true,
                            dateStartYear: true,
                            dateStartApproximate: true,
                            dateEndDay: true,
                            dateEndMonth: true,
                            dateEndYear: true,
                            dateEndApproximate: true,
                            tags: {
                                select: {
                                    tag: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!collection) {
        notFound();
    }

    const stories = collection.stories
        .map(({ story }) => ({
            id: story.id,
            title: story.title,
            summary: story.summary,
            type: story.type,
            status: story.status,
            dateDescription: formatStoryPeriod(story),
            updatedAtLabel: formatUpdatedAt(story.updatedAt),
            tags: story.tags.map(({ tag }) => tag),
        }))
        .sort((a, b) => a.title.localeCompare(b.title));

    const memberIds = stories.map((story) => story.id);

    const availableStories = await prisma.story.findMany({
        where: {
            id: { notIn: memberIds },
        },
        select: {
            id: true,
            title: true,
        },
        orderBy: {
            title: "asc",
        },
    });

    return (
        <main className={classes.page}>
            <div
                style={{
                    maxWidth: 1200,
                    width: "100%",
                    marginInline: "auto",
                }}
            >
                <Group
                    justify="space-between"
                    align="center"
                    mb="xl"
                    gap="md"
                    wrap="wrap"
                >
                    <div>
                        <Title order={1}>{collection.name}</Title>
                        <Text c="dimmed" mt={4}>
                            Browse and manage the stories in this collection.
                        </Text>
                    </div>

                    <Tooltip label="Back to collections">
                        <ActionIcon
                            component="a"
                            href="/stories/collections"
                            variant="subtle"
                            size="lg"
                            color="mesa"
                            aria-label="Back to collections"
                        >
                            <ArrowLeft size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                <CollectionDetailManager
                    collectionId={collection.id}
                    initialCollectionName={collection.name}
                    initialStories={stories}
                    availableStories={availableStories}
                />
            </div>
        </main>
    );
}