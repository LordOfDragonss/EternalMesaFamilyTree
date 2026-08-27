import { prisma } from "@/lib/prisma";
import {
    ActionIcon,
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
                    colonist: true,
                },
            },
        },
    });

    if (!legacy) {
        return <h1>Legacy not found</h1>;
    }

    /*
     * Colonists who do not currently belong to a legacy.
     * These are the colonists that can be added here.
     */
    const availableColonists = await prisma.colonist.findMany({
        where: {
            legacyId: null,
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
    }));

    const notableColonistOptions = availableNotableColonists.map(
        (colonist) => ({
            value: colonist.id.toString(),
            label: `${colonist.firstName}${colonist.nickname
                    ? ` "${colonist.nickname}"`
                    : ""
                } ${colonist.lastName}`,
        })
    );

    const legacyColor = legacy.color || "#4dabf7";

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
                        {/* Legacy color accent */}
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
                                <Text
                                    c="dimmed"
                                    mt={4}
                                >
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
                                <Text
                                    size="sm"
                                    c="dimmed"
                                >
                                    Founded by
                                </Text>

                                <Text>
                                    {
                                        legacy
                                            .foundingColonist
                                            .firstName
                                    }{" "}
                                    {
                                        legacy
                                            .foundingColonist
                                            .lastName
                                    }
                                </Text>
                            </div>
                        )}

                        <div>
                            <Text
                                size="sm"
                                c="dimmed"
                            >
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

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
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
                                Members
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Colonists belonging to this legacy.
                            </Text>
                        </div>

                        <Stack gap="xs">
                            {legacy.members.map(
                                (colonist) => (
                                    <Text
                                        key={colonist.id}
                                        component="a"
                                        href={`/colonists/${colonist.id}`}
                                        style={{
                                            color: legacyColor,
                                            textDecoration:
                                                "none",
                                        }}
                                    >
                                        {colonist.firstName}{" "}
                                        {colonist.nickname &&
                                            `"${colonist.nickname}"`}{" "}
                                        {colonist.lastName}
                                    </Text>
                                )
                            )}

                            {legacy.members.length === 0 && (
                                <Text c="dimmed">
                                    No colonists belong to
                                    this legacy yet.
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
                                                backgroundColor:
                                                    legacyColor,
                                            }}
                                        >
                                            <Plus size={20} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </form>
                        )}

                        {availableColonists.length === 0 && (
                            <Text
                                size="sm"
                                c="dimmed"
                            >
                                All colonists already belong to
                                a legacy.
                            </Text>
                        )}
                    </Stack>
                </Card>

            </Stack>
        </main>
    );
}