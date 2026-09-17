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

export default async function LocationsPage() {
    const locations = await prisma.location.findMany({
        include: {
            _count: {
                select: {
                    colonists: true,
                    legacies: true,
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
                    <Title order={1}>Locations</Title>

                    <Text c="dimmed">
                        Places that have played a role in the colony's history.
                    </Text>
                </div>

                <Tooltip label="Add location">
                    <ActionIcon
                        component="a"
                        href="/locations/create"
                        size="lg"
                        variant="filled"
                        color="mesa"
                        aria-label="Add location"
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
                {locations.map((location) => (
                    <Card
                        key={location.id}
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
                        className="location-card"
                    >
                        <a
                            href={`/locations/${location.id}`}
                            className="location-card-link"
                            aria-label={`View ${location.name}`}
                        />

                        <Text
                            fw={600}
                            size="lg"
                            className="location-card-title"
                            style={{
                                position: "relative",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}
                        >
                            {location.name}
                        </Text>

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
                            {location.type
                                .replaceAll("_", " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (char) =>
                                    char.toUpperCase()
                                )}
                        </Text>

                        {location.description && (
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
                                {location.description}
                            </Text>
                        )}

                        <Text
                            size="sm"
                            mt={4}
                            fw={500}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                pointerEvents: "none",
                            }}
                        >
                            {location._count.colonists}{" "}
                            {location._count.colonists === 1
                                ? "colonist"
                                : "colonists"}
                            {" · "}
                            {location._count.legacies}{" "}
                            {location._count.legacies === 1
                                ? "legacy"
                                : "legacies"}
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
                            <Tooltip label="Edit location">
                                <ActionIcon
                                    component="a"
                                    href={`/locations/${location.id}/edit`}
                                    variant="subtle"
                                    aria-label="Edit location"
                                >
                                    <Pencil size={18} />
                                </ActionIcon>
                            </Tooltip>

                            <DeleteButton
                                action={`/api/locations/${location.id}/delete`}
                                name={location.name}
                            />
                        </Group>
                    </Card>
                ))}

                {locations.length === 0 && (
                    <Text c="dimmed">
                        No locations have been created yet.
                    </Text>
                )}
            </SimpleGrid>
        </main>
    );
}
