
import { prisma } from "@/lib/prisma";
import {
    ActionIcon,
    Badge,
    Card,
    Group,
    Select,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import LegacyNotableColonists from "@/app/components/LegacyNotableColonists";
import LegacyCollapsibleCard from "./LegacyCollapsibleCard";

export default async function LegacyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const legacyId = Number(id);

    const legacy = await prisma.legacy.findUnique({
        where: {
            id: legacyId,
        },
        include: {
            foundingColonist: true,

            members: {
                orderBy: [
                    {
                        firstName: "asc",
                    },
                    {
                        lastName: "asc",
                    },
                ],
            },

            notableColonists: {
                include: {
                    colonist: {
                        include: {
                            legacy: {
                                select: {
                                    color: true,
                                },
                            },
                        },
                    },
                },
            },

            storyAssociations: {
                where: {
                    story: {
                        status: "COMPLETE",
                    },
                },
                include: {
                    story: true,
                },
                orderBy: {
                    story: {
                        updatedAt: "desc",
                    },
                },
            },
        },
    });

    if (!legacy) {
        return <h1>Legacy not found</h1>;
    }

    /*
     * Colonists who do not currently belong to a legacy.
     */
    const availableColonists = await prisma.colonist.findMany({
        where: {
            legacyId: null,
        },
        include: {
            legacy: {
                select: {
                    color: true,
                },
            },
        },
        orderBy: [
            {
                firstName: "asc",
            },
            {
                lastName: "asc",
            },
        ],
    });

    /*
     * Colonists who are not already notable in this legacy.
     */
    const notableColonistIds = new Set(
        legacy.notableColonists.map(
            (notable) => notable.colonistId
        )
    );

    const availableNotableColonists = await prisma.colonist.findMany({
        where: {
            id: {
                notIn: Array.from(notableColonistIds),
            },
        },
        include: {
            legacy: {
                select: {
                    color: true,
                },
            },
        },
        orderBy: [
            {
                firstName: "asc",
            },
            {
                lastName: "asc",
            },
        ],
    });

    const colonistOptions = availableColonists.map((colonist) => ({
        value: colonist.id.toString(),
        label: `${colonist.firstName}${colonist.nickname
            ? ` "${colonist.nickname}"`
            : ""
            } ${colonist.lastName}`,
        color: colonist.legacy?.color ?? null,
    }));

    const notableColonistOptions = availableNotableColonists.map(
        (colonist) => ({
            value: colonist.id.toString(),
            label: `${colonist.firstName}${colonist.nickname
                ? ` "${colonist.nickname}"`
                : ""
                } ${colonist.lastName}`,
            color: colonist.legacy?.color ?? null,
        })
    );

    const legacyColor = legacy.color || "#C8C4BC";

    const stories = legacy.storyAssociations;

    return (
        <main
            style={{
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
            }}
        >
            <Stack gap="xl">
                {/* Header */}
                <Group
                    justify="space-between"
                    align="flex-start"
                >
                    <Group
                        align="stretch"
                        gap="md"
                    >
                        <div
                            style={{
                                width: 5,
                                borderRadius: 999,
                                backgroundColor: legacyColor,
                                boxShadow: `0 0 12px ${legacyColor}55`,
                            }}
                        />

                        <div>
                            <Title
                                order={1}
                                style={{
                                    color: legacyColor,
                                }}
                            >
                                {legacy.name}
                            </Title>

                            {legacy.description && (
                                <Text c="dimmed" mt={4}>
                                    {legacy.description}
                                </Text>
                            )}
                        </div>
                    </Group>

                    <Group gap="xs">
                        <Tooltip label="Back to legacies">
                            <ActionIcon
                                component="a"
                                href="/legacies"
                                variant="subtle"
                                size="lg"
                                aria-label="Back to legacies"
                                style={{
                                    color: legacyColor,
                                }}
                            >
                                <ArrowLeft size={18} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Edit legacy">
                            <ActionIcon
                                component="a"
                                href={`/legacies/${legacy.id}/edit`}
                                variant="subtle"
                                size="lg"
                                aria-label="Edit legacy"
                                style={{
                                    color: legacyColor,
                                }}
                            >
                                <Pencil size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                {/* Legacy Information */}
                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: `${legacyColor}55`,
                    }}
                >
                    <Stack gap="md">
                        <Title
                            order={3}
                            style={{
                                color: legacyColor,
                            }}
                        >
                            Legacy Information
                        </Title>

                        {legacy.foundingColonist && (
                            <div>
                                <Text size="sm" c="dimmed">
                                    Founded by
                                </Text>

                                <Text>
                                    {legacy.foundingColonist.firstName}{" "}
                                    {legacy.foundingColonist.lastName}
                                </Text>
                            </div>
                        )}

                        <div>
                            <Text size="sm" c="dimmed">
                                Members
                            </Text>

                            <Text>
                                {legacy.members.length}
                            </Text>
                        </div>
                    </Stack>
                </Card>

                {/* Notable Colonists */}
                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: `${legacyColor}55`,
                    }}
                >
                    <Stack gap="md">
                        <div>
                            <Title
                                order={3}
                                style={{
                                    color: legacyColor,
                                }}
                            >
                                Notable Colonists
                            </Title>

                            <Text c="dimmed" size="sm" mt={2}>
                                Colonists remembered for their contributions
                                to this legacy.
                            </Text>
                        </div>

                        <LegacyNotableColonists
                            legacyId={legacy.id}
                            legacyColor={legacyColor}
                            notableColonists={legacy.notableColonists}
                            availableColonists={notableColonistOptions}
                        />
                    </Stack>
                </Card>



                {/* Members */}
                <LegacyCollapsibleCard
                    title="Members"
                    count={legacy.members.length}
                    value="members"
                    legacyColor={legacyColor}
                >
                    <Stack gap="md">
                        <Text c="dimmed" size="sm">
                            Colonists belonging to this legacy.
                        </Text>

                        <Stack gap="xs">
                            {legacy.members.map((colonist) => (
                                <Text
                                    key={colonist.id}
                                    component="a"
                                    href={`/colonists/${colonist.id}`}
                                    style={{
                                        color: legacyColor,
                                        textDecoration: "none",
                                    }}
                                >
                                    {colonist.firstName}{" "}
                                    {colonist.nickname &&
                                        `"${colonist.nickname}"`}{" "}
                                    {colonist.lastName}
                                </Text>
                            ))}

                            {legacy.members.length === 0 && (
                                <Text c="dimmed">
                                    No colonists belong to this legacy yet.
                                </Text>
                            )}
                        </Stack>

                        {availableColonists.length > 0 && (
                            <form
                                action={`/api/legacies/${legacy.id}/members`}
                                method="POST"
                            >
                                <Group
                                    align="flex-end"
                                    gap="xs"
                                >
                                    <Select
                                        name="colonistId"
                                        label="Add member"
                                        placeholder="Select a colonist"
                                        data={colonistOptions}
                                        searchable
                                        style={{
                                            flex: 1,
                                        }}
                                    />

                                    <Tooltip label="Add member">
                                        <ActionIcon
                                            type="submit"
                                            size="lg"
                                            variant="filled"
                                            aria-label="Add member"
                                            style={{
                                                backgroundColor: legacyColor,
                                            }}
                                        >
                                            <Plus size={20} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </form>
                        )}

                        {availableColonists.length === 0 && (
                            <Text size="sm" c="dimmed">
                                All colonists already belong to a legacy.
                            </Text>
                        )}
                    </Stack>
                </LegacyCollapsibleCard>

                {/* Stories */}
                <LegacyCollapsibleCard
                    title="Stories"
                    count={stories.length}
                    value="stories"
                    legacyColor={legacyColor}
                >
                    <Stack gap="md">
                        <Text c="dimmed" size="sm">
                            Published stories associated with this legacy.
                        </Text>

                        {stories.length === 0 ? (
                            <Text c="dimmed">
                                No stories have been associated with this legacy yet.
                            </Text>
                        ) : (
                            <Stack gap="sm">
                                {stories.map((association) => (
                                    <Card
                                        key={association.storyId}
                                        padding="md"
                                        radius="sm"
                                        withBorder
                                        bg="#101010"
                                        style={{
                                            borderColor: "#292929",
                                        }}
                                    >
                                        <Stack gap="xs">
                                            <Text
                                                component="a"
                                                href={`/stories/${association.story.id}`}
                                                fw={600}
                                                c={legacyColor}
                                                style={{
                                                    textDecoration: "none",
                                                }}
                                            >
                                                {association.story.title}
                                            </Text>

                                            {association.story.summary && (
                                                <Text
                                                    size="sm"
                                                    c="dimmed"
                                                    lineClamp={3}
                                                >
                                                    {association.story.summary}
                                                </Text>
                                            )}

                                            <Group gap="xs">
                                                {association.isInline && (
                                                    <Badge
                                                        variant="light"
                                                        color="cyan"
                                                    >
                                                        Inline mention
                                                    </Badge>
                                                )}

                                                {association.isManual && (
                                                    <Badge
                                                        variant="light"
                                                        color="grape"
                                                    >
                                                        Manual
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Stack>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </LegacyCollapsibleCard>
                
            </Stack>
        </main>
    );
}
