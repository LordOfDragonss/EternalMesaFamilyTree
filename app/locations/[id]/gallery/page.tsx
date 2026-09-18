import {
    Card,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import { prisma } from "@/lib/prisma";
import LocationHeader from "../LocationHeader";
import LocationNavigation from "../LocationNavigation";
import LocationGalleryAdd from "./LocationGalleryAdd";
import LocationGalleryGrid from "./LocationGalleryGrid";

export default async function LocationGalleryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const location =
        await prisma.location.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                previousNames: {
                    orderBy: {
                        order: "asc",
                    },
                },
                images: {
                    orderBy: {
                        order: "asc",
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
                <LocationHeader
                    location={location}
                />

                <LocationNavigation
                    locationId={
                        location.id
                    }
                />

                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor:
                            "#292929",
                    }}
                >
                    <Stack gap="md">
                        <Group
                            justify="space-between"
                            align="flex-start"
                        >
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

                            <LocationGalleryAdd
                                locationId={
                                    location.id
                                }
                            />
                        </Group>

                        {location.images
                            .length ===
                        0 ? (
                            <Text c="dimmed">
                                No images have been
                                added yet.
                            </Text>
                        ) : (
                            <LocationGalleryGrid
                                locationId={
                                    location.id
                                }
                                images={
                                    location.images
                                }
                            />
                        )}
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}