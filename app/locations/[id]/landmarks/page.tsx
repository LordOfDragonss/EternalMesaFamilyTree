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
import LocationHeader from "../LocationHeader";
import LocationNavigation from "../LocationNavigation";

export default async function LocationLandmarksPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const location = await prisma.location.findUnique({
        where: {
            id: Number(id),
        },
        include: {
            previousNames: {
                orderBy: {
                    order: "asc",
                },
            },
            landmarks: {
                orderBy: {
                    name: "asc",
                },
            },
        },
    });

    if (!location) {
        return <h1>Location not found</h1>;
    }

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                }}
            >
                <LocationHeader location={location} />

                <LocationNavigation
                    locationId={location.id}
                />

                <Group justify="space-between">
                    <div>
                        <Title order={2}>
                            Landmarks
                        </Title>

                        <Text c="dimmed" size="sm" mt={2}>
                            Notable places at this location.
                        </Text>
                    </div>

                    <Tooltip label="Add landmark">
                        <ActionIcon
                            component="a"
                            href={`/locations/${location.id}/landmarks/create`}
                            size="lg"
                            variant="filled"
                            color="mesa"
                            aria-label="Add landmark"
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
                    }}
                    spacing="lg"
                >
                    {location.landmarks.map((landmark) => (
                        <Card
                            key={landmark.id}
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
                            className="landmark-card"
                        >
                            <a
                                href={`/locations/${location.id}/landmarks/${landmark.id}`}
                                className="landmark-card-link"
                                aria-label={`View ${landmark.name}`}
                            />

                            <Text
                                fw={600}
                                size="lg"
                                className="landmark-card-title"
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                    pointerEvents: "none",
                                }}
                            >
                                {landmark.name}
                            </Text>

                            {landmark.description && (
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
                                    {landmark.description}
                                </Text>
                            )}

                            <Group
                                mt="lg"
                                justify="flex-end"
                                gap="xs"
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                }}
                            >
                                <Tooltip label="Edit landmark">
                                    <ActionIcon
                                        component="a"
                                        href={`/locations/${location.id}/landmarks/${landmark.id}/edit`}
                                        variant="subtle"
                                        aria-label="Edit landmark"
                                    >
                                        <Pencil size={18} />
                                    </ActionIcon>
                                </Tooltip>

                                <DeleteButton
                                    action={`/api/locations/${location.id}/landmarks/${landmark.id}/delete`}
                                    name={landmark.name}
                                />
                            </Group>
                        </Card>
                    ))}

                    {location.landmarks.length === 0 && (
                        <Text c="dimmed">
                            No landmarks have been added yet.
                        </Text>
                    )}
                </SimpleGrid>
            </div>
        </main>
    );
}