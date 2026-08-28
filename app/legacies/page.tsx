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

export const dynamic = "force-dynamic";

export default async function LegaciesPage() {
    const legacies = await prisma.legacy.findMany({
        include: {
            foundingColonist: true,
            _count: {
                select: {
                    members: true,
                    notableColonists: true,
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
                    <Title order={1}>Legacies</Title>

                    <Text c="dimmed">
                        Browse the family lines and legacies of the colony.
                    </Text>
                </div>

                <Tooltip label="Add legacy">
                    <ActionIcon
                        component="a"
                        href="/legacies/create"
                        size="lg"
                        variant="filled"
                        color="mesa"
                        aria-label="Add legacy"
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
                {legacies.map((legacy) => (
                    <Card
                        key={legacy.id}
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
                            "--legacy-color":
                                legacy.color ?? "#3a3a3a",
                        } as React.CSSProperties}
                        className="legacy-card"
                    >
                        <a
                            href={`/legacies/${legacy.id}`}
                            className="legacy-card-link"
                            aria-label={`View ${legacy.name}`}
                        />

                        <Text
                            fw={600}
                            size="lg"
                            className="legacy-card-title"
                            style={
                                legacy.color
                                    ? {
                                          color: legacy.color,
                                      }
                                    : undefined
                            }
                        >
                            {legacy.name}
                        </Text>

                        {legacy.description && (
                            <Text
                                c="dimmed"
                                size="sm"
                                mt={4}
                            >
                                {legacy.description}
                            </Text>
                        )}

                        <Text
                            size="sm"
                            mt={4}
                            fw={500}
                            style={
                                legacy.color
                                    ? {
                                          color: legacy.color,
                                      }
                                    : undefined
                            }
                        >
                            {legacy._count.members}{" "}
                            {legacy._count.members === 1
                                ? "member"
                                : "members"}
                        </Text>

                        {legacy._count.notableColonists > 0 && (
                            <Text
                                size="xs"
                                mt={4}
                                c="dimmed"
                            >
                                {legacy._count.notableColonists}{" "}
                                {legacy._count.notableColonists === 1
                                    ? "notable colonist"
                                    : "notable colonists"}
                            </Text>
                        )}

                        {legacy.foundingColonist && (
                            <Text
                                size="xs"
                                c="dimmed"
                                mt={4}
                            >
                                Founded by{" "}
                                {legacy.foundingColonist.firstName}{" "}
                                {legacy.foundingColonist.lastName}
                            </Text>
                        )}

                        <Group
                            mt="lg"
                            justify="flex-end"
                            gap="xs"
                            style={{
                                position: "relative",
                                zIndex: 1,
                            }}
                        >
                            <Tooltip label="Edit legacy">
                                <ActionIcon
                                    component="a"
                                    href={`/legacies/${legacy.id}/edit`}
                                    variant="subtle"
                                    aria-label="Edit legacy"
                                >
                                    <Pencil size={18} />
                                </ActionIcon>
                            </Tooltip>

                            <DeleteButton
                                action={`/api/legacies/${legacy.id}/delete`}
                                colonistName={legacy.name}
                            />
                        </Group>
                    </Card>
                ))}

                {legacies.length === 0 && (
                    <Text c="dimmed">
                        No legacies have been created yet.
                    </Text>
                )}
            </SimpleGrid>
        </main>
    );
}