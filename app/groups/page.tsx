import {
    ActionIcon,
    Card,
    Group,
    SimpleGrid,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Pencil, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import DeleteButton from "@/app/components/DeleteButton";

export default async function GroupsPage() {
    const groups = await prisma.group.findMany({
        include: {
            _count: {
                select: {
                    colonists: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <main style={{ padding: "2rem" }}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1}>Groups</Title>

                    <Text c="dimmed">
                        Groups that connect colonists outside of
                        their family lineage.
                    </Text>
                </div>

                <Tooltip label="Add group">
                    <ActionIcon
                        component="a"
                        href="/groups/create"
                        size="lg"
                        variant="filled"
                        color="mesa"
                        aria-label="Add group"
                    >
                        <Plus size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <SimpleGrid
                cols={{
                    base: 1,
                    sm: 2,
                    md: 3,
                    lg: 4,
                }}
                spacing="lg"
            >
                {groups.map((group) => (
                    <Card
                        key={group.id}
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                        bg="#161616"
                        style={{
                            position: "relative",
                            borderColor: "#292929",
                            transition:
                                "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                        }}
                        className="group-card"
                    >
                        <a
                            href={`/groups/${group.id}`}
                            className="group-card-link"
                            aria-label={`View ${group.name}`}
                        />

                        <Text
                            fw={600}
                            size="lg"
                            className="group-card-title"
                            style={{
                                position: "relative",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}
                        >
                            {group.name}
                        </Text>

                        {group.description && (
                            <Text
                                c="dimmed"
                                size="sm"
                                mt={4}
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                    pointerEvents: "none",
                                }}
                            >
                                {group.description}
                            </Text>
                        )}

                        <Text
                            size="sm"
                            mt={4}
                            fw={500}
                            style={{
                                color: "var(--mantine-color-mesa-filled)",
                                position: "relative",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}
                        >
                            {group._count.colonists}{" "}
                            {group._count.colonists === 1
                                ? "member"
                                : "members"}
                        </Text>

                        <Group
                            mt="lg"
                            justify="flex-end"
                            gap="xs"
                            style={{
                                position: "relative",
                                zIndex: 2,
                            }}
                        >
                            <Tooltip label="Edit group">
                                <ActionIcon
                                    component="a"
                                    href={`/groups/${group.id}/edit`}
                                    variant="subtle"
                                    aria-label="Edit group"
                                >
                                    <Pencil size={18} />
                                </ActionIcon>
                            </Tooltip>

                            <DeleteButton
                                action={`/api/groups/${group.id}/delete`}
                                colonistName={group.name}
                            />
                        </Group>
                    </Card>
                ))}

                {groups.length === 0 && (
                    <Text c="dimmed">
                        No groups have been created yet.
                    </Text>
                )}
            </SimpleGrid>
        </main>
    );
}