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
import { ArrowLeft, Pencil, Plus, X } from "lucide-react";

export default async function GroupPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const groupId = Number(id);

    const group = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
        include: {
            colonists: {
                include: {
                    colonist: {
                        include: {
                            legacy: true,
                        },
                    },
                },
            },
        },
    });

    if (!group) {
        return <h1>Group not found</h1>;
    }

    /*
     * Colonists who are not already members of this group.
     *
     * Colonists can belong to multiple groups, so belonging
     * to another group does not exclude them here.
     */
    const memberIds = group.colonists.map(
        (membership) => membership.colonistId
    );

    const availableColonists = await prisma.colonist.findMany({
        where: {
            id: {
                notIn: memberIds,
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
        label: `${colonist.firstName}${
            colonist.nickname
                ? ` "${colonist.nickname}"`
                : ""
        } ${colonist.lastName}`,
    }));

    /*
     * Keep members ordered alphabetically.
     */
    const members = [...group.colonists].sort((a, b) => {
        const firstNameComparison =
            a.colonist.firstName.localeCompare(
                b.colonist.firstName
            );

        if (firstNameComparison !== 0) {
            return firstNameComparison;
        }

        return a.colonist.lastName.localeCompare(
            b.colonist.lastName
        );
    });

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
                    <div>
                        <Title order={1}>
                            {group.name}
                        </Title>

                        {group.description && (
                            <Text
                                c="dimmed"
                                mt={4}
                            >
                                {group.description}
                            </Text>
                        )}
                    </div>

                    <Group gap="xs">
                        <Tooltip label="Back to groups">
                            <ActionIcon
                                component="a"
                                href="/groups"
                                variant="subtle"
                                size="lg"
                                aria-label="Back to groups"
                                color="gray"
                            >
                                <ArrowLeft size={18} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Edit group">
                            <ActionIcon
                                component="a"
                                href={`/groups/${group.id}/edit`}
                                variant="subtle"
                                size="lg"
                                aria-label="Edit group"
                                color="gray"
                            >
                                <Pencil size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                {/* Members */}
                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: "#292929",
                    }}
                >
                    <Stack gap="md">
                        <div>
                            <Title order={3}>
                                Members
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Colonists belonging to this group.
                            </Text>
                        </div>

                        <Stack gap="xs">
                            {members.map(
                                (membership) => {
                                    const legacyColor =
                                        membership.colonist
                                            .legacy?.color ??
                                        "#a0a0a0";

                                    return (
                                        <Group
                                            key={
                                                membership.colonistId
                                            }
                                            justify="space-between"
                                            gap="xs"
                                        >
                                            <Text
                                                component="a"
                                                href={`/colonists/${membership.colonistId}`}
                                                style={{
                                                    color: legacyColor,
                                                    textDecoration:
                                                        "none",
                                                }}
                                            >
                                                {
                                                    membership
                                                        .colonist
                                                        .firstName
                                                }{" "}
                                                {
                                                    membership
                                                        .colonist
                                                        .nickname &&
                                                    `"${membership.colonist.nickname}"`
                                                }{" "}
                                                {
                                                    membership
                                                        .colonist
                                                        .lastName
                                                }
                                            </Text>

                                            <form
                                                action={`/api/groups/${group.id}/members/${membership.colonistId}/delete`}
                                                method="POST"
                                            >
                                                <Tooltip label="Remove member">
                                                    <ActionIcon
                                                        type="submit"
                                                        variant="subtle"
                                                        color="red"
                                                        size="sm"
                                                        aria-label={`Remove ${membership.colonist.firstName} ${membership.colonist.lastName}`}
                                                    >
                                                        <X
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </form>
                                        </Group>
                                    );
                                }
                            )}

                            {members.length === 0 && (
                                <Text c="dimmed">
                                    No colonists belong to
                                    this group yet.
                                </Text>
                            )}
                        </Stack>

                        {availableColonists.length > 0 && (
                            <form
                                action={`/api/groups/${group.id}/members`}
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
                                            color="mesa"
                                            aria-label="Add member"
                                        >
                                            <Plus size={20} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </form>
                        )}

                        {availableColonists.length === 0 &&
                            members.length > 0 && (
                                <Text
                                    size="sm"
                                    c="dimmed"
                                >
                                    All colonists are already
                                    members of this group.
                                </Text>
                            )}
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}