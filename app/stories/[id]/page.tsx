import {
    ActionIcon,
    Badge,
    Card,
    Divider,
    Group,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    ArrowLeft,
    CalendarDays,
    Pencil,
} from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
    formatStoryDate,
    STORY_DATE_MONTHS,
    type StoryTiptapDocument,
} from "../types";
import StoryReaderContent from "../components/StoryReaderContent";
import classes from "../story-reader.module.css";

type StoryPageProps = {
    params: Promise<{ id: string }>;
};

type RelatedRecord = {
    key: string;
    title: string;
    category: string;
    href: string;
    color?: string | null;
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

export default async function StoryPage({
    params,
}: StoryPageProps) {
    const { id } = await params;
    const storyId = Number(id);

    if (!Number.isSafeInteger(storyId) || storyId < 1) {
        notFound();
    }

    const story = await prisma.story.findUnique({
        where: {
            id: storyId,
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

            relatedColonists: {
                include: {
                    colonist: {
                        select: {
                            id: true,
                            firstName: true,
                            nickname: true,
                            lastName: true,
                            legacy: {
                                select: {
                                    color: true,
                                },
                            },
                        },
                    },
                },
            },

            relatedLegacies: {
                include: {
                    legacy: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                },
            },

            relatedGroups: {
                include: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },

            relatedLocations: {
                include: {
                    location: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },

            relatedRelics: {
                include: {
                    relic: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },

            relatedStories: {
                include: {
                    relatedStory: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                },
            },

            referencedBy: {
                include: {
                    story: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                },
            },
        },
    });

    if (!story) {
        notFound();
    }

    const relatedRecords: RelatedRecord[] = [
        ...story.relatedColonists.map(({ colonist }) => ({
            key: `colonist-${colonist.id}`,
            title: `${colonist.firstName}${colonist.nickname
                ? ` "${colonist.nickname}"`
                : ""
                } ${colonist.lastName}`,
            category: "Colonist",
            href: `/colonists/${colonist.id}`,
            color: colonist.legacy?.color,
        })),

        ...story.relatedLegacies.map(({ legacy }) => ({
            key: `legacy-${legacy.id}`,
            title: legacy.name,
            category: "Legacy",
            href: `/legacies/${legacy.id}`,
            color: legacy.color,
        })),

        ...story.relatedGroups.map(({ group }) => ({
            key: `group-${group.id}`,
            title: group.name,
            category: "Group",
            href: `/groups/${group.id}`,
        })),

        ...story.relatedLocations.map(({ location }) => ({
            key: `location-${location.id}`,
            title: location.name,
            category: "Location",
            href: `/locations/${location.id}`,
        })),

        ...story.relatedRelics.map(({ relic }) => ({
            key: `relic-${relic.id}`,
            title: relic.name,
            category: "Relic",
            href: `/relics/${relic.id}`,
        })),

        ...story.relatedStories.map(({ relatedStory }) => ({
            key: `story-${relatedStory.id}`,
            title: relatedStory.title,
            category: "Story",
            href: `/stories/${relatedStory.id}`,
        })),

        ...story.referencedBy.map(({ story: referringStory }) => ({
            key: `story-${referringStory.id}`,
            title: referringStory.title,
            category: "Story",
            href: `/stories/${referringStory.id}`,
        })),
    ].filter(
        (record, index, records) =>
            records.findIndex(
                (candidate) => candidate.href === record.href,
            ) === index,
    );

    const dateDescription = formatStoryPeriod(story);

    return (
        <main className={classes.page}>
            <div className={classes.layout}>
                <Group justify="flex-end" align="center" mb="lg" gap="xs">
                    <Tooltip label="Back to stories">
                        <ActionIcon
                            component="a"
                            href="/stories"
                            variant="subtle"
                            size="lg"
                            aria-label="Back to stories"
                            style={{ color: "#e9904f" }}
                        >
                            <ArrowLeft size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Edit story">
                        <ActionIcon
                            component="a"
                            href={`/stories/${story.id}/edit`}
                            variant="subtle"
                            size="lg"
                            aria-label="Edit story"
                            style={{ color: "#e9904f" }}
                        >
                            <Pencil size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                <Card
                    withBorder
                    padding="xl"
                    radius="md"
                    bg="#161616"
                    className={classes.headerCard}
                >
                    <Stack gap="md">
                        <Group gap="xs" align="center" wrap="wrap">
                            <Badge variant="light" color="mesa">
                                {story.type}
                            </Badge>

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

                        <Title order={1} className={classes.storyTitle}>
                            {story.title}
                        </Title>

                        {story.summary && (
                            <Text
                                size="lg"
                                c="dimmed"
                                className={classes.summary}
                            >
                                {story.summary}
                            </Text>
                        )}

                        <Group
                            gap="xs"
                            align="center"
                            c="dimmed"
                        >
                            <CalendarDays size={16} />
                            <Text size="sm">{dateDescription}</Text>
                        </Group>

                        {story.status === "DRAFT" && (
                            <Text size="sm" c="dimmed">
                                This story is still a draft.
                            </Text>
                        )}

                        {story.tags.length > 0 && (
                            <Group gap="xs" align="center" wrap="wrap">
                                <Text size="sm" c="dimmed">
                                    Tags:
                                </Text>

                                {story.tags.map(({ tag }) => (
                                    <Badge
                                        key={tag.id}
                                        variant="outline"
                                        color="gray"
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                            </Group>
                        )}

                        {story.collectionLinks.length > 0 && (
                            <Group gap="xs" align="center" wrap="wrap">
                                <Text size="sm" c="dimmed">
                                    Collections:
                                </Text>

                                {story.collectionLinks.map(
                                    ({ collection }) => (
                                        <Badge
                                            key={collection.id}
                                            variant="light"
                                            color="mesa"
                                        >
                                            {collection.name}
                                        </Badge>
                                    ),
                                )}
                            </Group>
                        )}
                    </Stack>
                </Card>

                <Card
                    withBorder
                    padding="xl"
                    radius="md"
                    bg="#161616"
                    className={classes.contentCard}
                >
                    <StoryReaderContent
                        content={
                            story.content as unknown as StoryTiptapDocument
                        }
                    />
                </Card>

                {relatedRecords.length > 0 && (
                    <section className={classes.relatedSection}>
                        <Divider mb="lg" color="#292929" />

                        <Title order={2} size="h3" mb="md">
                            Related archive records
                        </Title>

                        <div className={classes.relatedGrid}>
                            {relatedRecords.map((record) => (
                                <Card
                                    key={record.key}
                                    component="a"
                                    href={record.href}
                                    withBorder
                                    padding="md"
                                    radius="md"
                                    bg="#161616"
                                    className={classes.relatedCard}
                                >
                                    <Stack gap={4}>
                                        <Text
                                            fw={500}
                                            c={record.color ?? "mesa"}
                                            style={{
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {record.title}
                                        </Text>

                                        <Text size="xs" c="dimmed">
                                            {record.category}
                                        </Text>
                                    </Stack>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}