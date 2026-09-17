import { Card, Stack, Text, Title } from "@mantine/core";

import { prisma } from "@/lib/prisma";
import LocationHeader from "./LocationHeader";
import LocationNavigation from "./LocationNavigation";

export default async function LocationPage({
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
            colonists: {
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
                orderBy: [
                    {
                        firstName: "asc",
                    },
                    {
                        lastName: "asc",
                    },
                ],
            },
            legacies: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
                orderBy: {
                    name: "asc",
                },
            },
            images: {
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
            <Stack gap="xl">
                <LocationHeader location={location} />

                <LocationNavigation
                    locationId={location.id}
                />

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
                                Information
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Information about this location.
                            </Text>
                        </div>

                        {location.description ? (
                            <Text>
                                {location.description}
                            </Text>
                        ) : (
                            <Text c="dimmed">
                                No description has been added yet.
                            </Text>
                        )}
                    </Stack>
                </Card>
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
                                Colonists
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Colonists associated with this location.
                            </Text>
                        </div>

                        <Text>
                            {location.colonists.length}{" "}
                            {location.colonists.length === 1
                                ? "colonist"
                                : "colonists"}{" "}
                            associated with this location.
                        </Text>

                        <Text
                            component="a"
                            href={`/locations/${location.id}/colonists`}
                            c="mesa"
                            fw={500}
                        >
                            View colonists
                        </Text>
                    </Stack>
                </Card>

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
                        <Title order={3}>
                            Legacies
                        </Title>

                        {location.legacies.length === 0 ? (
                            <Text c="dimmed">
                                No legacies are associated with this
                                location.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {location.legacies.map((legacy) => (
                                    <Text
                                        key={legacy.id}
                                        component="a"
                                        href={`/legacies/${legacy.id}`}
                                        fw={500}
                                        style={{
                                            color:
                                                legacy.color ??
                                                "var(--mantine-color-mesa-filled)",
                                            textDecoration: "none",
                                        }}
                                    >
                                        {legacy.name}
                                    </Text>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Card>

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
                                Gallery
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Images from this location.
                            </Text>
                        </div>

                        <Text>
                            {location.images.length}{" "}
                            {location.images.length === 1
                                ? "image"
                                : "images"}{" "}
                            in the gallery.
                        </Text>

                        <Text
                            component="a"
                            href={`/locations/${location.id}/gallery`}
                            c="mesa"
                            fw={500}
                        >
                            View gallery
                        </Text>
                    </Stack>
                </Card>

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
                                Landmarks
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Notable places at this location.
                            </Text>
                        </div>

                        <Text>
                            {location.landmarks.length}{" "}
                            {location.landmarks.length === 1
                                ? "landmark"
                                : "landmarks"}{" "}
                            recorded.
                        </Text>

                        <Text
                            component="a"
                            href={`/locations/${location.id}/landmarks`}
                            c="mesa"
                            fw={500}
                        >
                            View landmarks
                        </Text>
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}