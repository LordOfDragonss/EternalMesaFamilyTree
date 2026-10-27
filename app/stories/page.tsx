import {
    ActionIcon,
    Badge,
    Button,
    Group,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { FolderOpen, Pencil, Plus, Tag } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
    formatStoryDate,
    STORY_DATE_MONTHS,
    STORY_TYPE_OPTIONS,
} from "./types";
import StoryLibraryFilters from "./StoryLibraryFilters";
import classes from "./story-library.module.css";
import DeleteButton from "@/app/components/DeleteButton";

type StoriesPageProps = {
    searchParams: Promise<{
        search?: string;
        status?: string;
        type?: string;
        sort?: string;
        tags?: string;
        tag?: string;
    }>;
};

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

export default async function StoriesPage({
    searchParams,
}: StoriesPageProps) {
    const params = await searchParams;

    const search = params.search?.trim() ?? "";

    // The selected status defaults to COMPLETE when the URL has no valid status.
    const statusSelection =
        params.status === "ALL" ||
            params.status === "DRAFT" ||
            params.status === "COMPLETE"
            ? params.status
            : "COMPLETE";

    // ALL means no status restriction in the database query.
    const statusFilter =
        statusSelection === "ALL"
            ? undefined
            : statusSelection;

    const typeFilter = STORY_TYPE_OPTIONS.some(
        (option) => option === params.type,
    )
        ? params.type
        : undefined;

    const sort =
        params.sort === "title" || params.sort === "created"
            ? params.sort
            : "updated";

    const orderBy =
        sort === "title"
            ? [
                { title: "asc" as const },
                { updatedAt: "desc" as const },
            ]
            : sort === "created"
                ? [{ createdAt: "desc" as const }]
                : [{ updatedAt: "desc" as const }];

    // Load all existing tags for the multi-select.
    const tags = await prisma.tag.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    // Support both the new comma-separated parameter and the older
    // single-tag parameter so existing links remain usable.
    const requestedTagIds = (params.tags ?? params.tag ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter(
            (id) => Number.isSafeInteger(id) && id > 0,
        );

    const existingTagIds = new Set(
        tags.map((tag) => tag.id),
    );

    const tagFilterIds = [...new Set(requestedTagIds)].filter(
        (id) => existingTagIds.has(id),
    );

    const availableTags = tags.map((tag) => ({
        value: String(tag.id),
        label: tag.name,
    }));

    const stories = await prisma.story.findMany({
        where: {
            ...(search
                ? {
                    OR: [
                        {
                            title: {
                                contains: search,
                                mode: "insensitive" as const,
                            },
                        },
                        {
                            summary: {
                                contains: search,
                                mode: "insensitive" as const,
                            },
                        },
                        {
                            tags: {
                                some: {
                                    tag: {
                                        name: {
                                            contains: search,
                                            mode: "insensitive" as const,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            collectionLinks: {
                                some: {
                                    collection: {
                                        name: {
                                            contains: search,
                                            mode: "insensitive" as const,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                }
                : {}),

            ...(statusFilter
                ? { status: statusFilter }
                : {}),

            ...(typeFilter
                ? { type: typeFilter }
                : {}),

            // A story must have at least one of the selected tags.
            ...(tagFilterIds.length > 0
                ? {
                    tags: {
                        some: {
                            tagId: {
                                in: tagFilterIds,
                            },
                        },
                    },
                }
                : {}),
        },

        include: {
            tags: {
                include: {
                    tag: true,
                },
            },

            collectionLinks: {
                include: {
                    collection: true,
                },
            },

            _count: {
                select: {
                    relatedColonists: true,
                    relatedLegacies: true,
                    relatedGroups: true,
                    relatedLocations: true,
                    relatedRelics: true,
                    relatedStories: true,
                    referenceLinks: true,
                    inlineAssets: true,
                },
            },
        },

        orderBy,
    });

    return (
        <main className={classes.page}>
            <Group
                justify="space-between"
                align="center"
                mb="xl"
                gap="md"
                wrap="wrap"
            >
                <div>
                    <Title order={1}>Stories</Title>

                    <Text c="dimmed" mt={4}>
                        Browse and continue writing the history of the colony.
                    </Text>
                </div>

                <Group gap="xs">

                    <Tooltip label="Manage story tags">
                        <ActionIcon
                            component="a"
                            href="/stories/tags"
                            size="lg"
                            variant="filled"
                            color="mesa"
                            aria-label="Manage story tags"
                        >
                            <Tag size={20} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Manage story collections">
                        <ActionIcon
                            component="a"
                            href="/stories/collections"
                            size="lg"
                            variant="filled"
                            color="mesa"
                            aria-label="Manage story collections"
                        >
                            <FolderOpen size={20} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Create story">
                        <ActionIcon
                            component="a"
                            href="/stories/create"
                            size="lg"
                            variant="filled"
                            color="mesa"
                            aria-label="Create story"
                        >
                            <Plus size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <StoryLibraryFilters
                initialSearch={search}
                initialStatus={statusSelection}
                initialType={typeFilter ?? ""}
                initialSort={sort}
                initialTags={tagFilterIds.map(String)}
                availableTags={availableTags}
            />

            <Group justify="space-between" mb="sm">
                <Text size="sm" c="dimmed">
                    {stories.length}{" "}
                    {stories.length === 1 ? "story" : "stories"}
                </Text>
            </Group>

            {stories.length > 0 ? (
                <div className={classes.storyList}>
                    {stories.map((story) => {
                        const archiveRecordCount =
                            story._count.relatedColonists +
                            story._count.relatedLegacies +
                            story._count.relatedGroups +
                            story._count.relatedLocations +
                            story._count.relatedRelics +
                            story._count.relatedStories;

                        return (
                            <article
                                key={story.id}
                                className={classes.storyRow}
                            >
                                <div className={classes.storyMain}>
                                    <Group
                                        gap="xs"
                                        align="center"
                                        mb={6}
                                        wrap="wrap"
                                    >
                                        <a
                                            href={`/stories/${story.id}`}
                                            className={classes.storyTitle}
                                        >
                                            {story.title}
                                        </a>

                                        <Badge
                                            variant="light"
                                            color={
                                                story.status === "DRAFT"
                                                    ? "gray"
                                                    : "teal"
                                            }
                                        >
                                            {story.status === "DRAFT"
                                                ? "Draft"
                                                : "Complete"}
                                        </Badge>
                                    </Group>

                                    {story.summary && (
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            className={classes.summary}
                                        >
                                            {story.summary}
                                        </Text>
                                    )}

                                    <div className={classes.metadata}>
                                        <span>{story.type}</span>

                                        <span>
                                            {formatStoryPeriod(story)}
                                        </span>

                                        <span>
                                            Updated{" "}
                                            {formatUpdatedAt(story.updatedAt)}
                                        </span>
                                    </div>

                                    {(story.tags.length > 0 ||
                                        story.collectionLinks.length > 0) && (
                                            <Group
                                                gap={6}
                                                mt="sm"
                                                wrap="wrap"
                                            >
                                                {story.tags.map(({ tag }) => (
                                                    <Badge
                                                        key={tag.id}
                                                        variant="outline"
                                                        color="gray"
                                                        size="sm"
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))}

                                                {story.collectionLinks.map(
                                                    ({ collection }) => (
                                                        <Badge
                                                            key={collection.id}
                                                            variant="light"
                                                            color="mesa"
                                                            size="sm"
                                                        >
                                                            {collection.name}
                                                        </Badge>
                                                    ),
                                                )}
                                            </Group>
                                        )}
                                </div>

                                <div className={classes.storyAside}>
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        className={classes.recordCounts}
                                    >
                                        {archiveRecordCount > 0 &&
                                            `${archiveRecordCount} linked ${archiveRecordCount === 1
                                                ? "record"
                                                : "records"
                                            }`}

                                        {archiveRecordCount > 0 &&
                                            story._count.referenceLinks > 0 &&
                                            " · "}

                                        {story._count.referenceLinks > 0 &&
                                            `${story._count.referenceLinks} ${story._count.referenceLinks === 1
                                                ? "reference"
                                                : "references"
                                            }`}

                                        {(archiveRecordCount > 0 ||
                                            story._count.referenceLinks > 0) &&
                                            story._count.inlineAssets > 0 &&
                                            " · "}

                                        {story._count.inlineAssets > 0 &&
                                            `${story._count.inlineAssets} ${story._count.inlineAssets === 1
                                                ? "image"
                                                : "images"
                                            }`}
                                    </Text>

                                    <Tooltip label="Edit story">
                                        <ActionIcon
                                            component="a"
                                            href={`/stories/${story.id}/edit`}
                                            variant="subtle"
                                            color="gray"
                                            size="lg"
                                            aria-label={`Edit ${story.title}`}
                                        >
                                            <Pencil size={17} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <DeleteButton
                                        action={`/api/stories/${story.id}/delete`}
                                        name={story.title}
                                        type="Story"
                                    />
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className={classes.emptyState}>
                    <Title order={3} size="lg">
                        {search || statusFilter || typeFilter ||
                            tagFilterIds.length > 0
                            ? "No matching stories"
                            : "No stories yet"}
                    </Title>

                    <Text c="dimmed" size="sm" mt={6}>
                        {search || statusFilter || typeFilter ||
                            tagFilterIds.length > 0
                            ? "Try changing your search or filters."
                            : "Create the first story to begin building the colony archive."}
                    </Text>

                    {!search &&
                        !statusFilter &&
                        !typeFilter &&
                        tagFilterIds.length === 0 && (
                            <Button
                                component="a"
                                href="/stories/create"
                                color="mesa"
                                variant="light"
                                leftSection={<Plus size={16} />}
                                mt="md"
                            >
                                Create your first story
                            </Button>
                        )}
                </div>
            )}
        </main>
    );
}