import {
    ActionIcon,
    Divider,
    Group,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import LandmarkGallery from "./LandmarkGallery";
import { ArrowLeft, Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";
import LocationHeader from "../../LocationHeader";
import LocationNavigation from "../../LocationNavigation";

export default async function LandmarkPage({
    params,
}: {
    params: Promise<{
        id: string;
        landmarkId: string;
    }>;
}) {
    const { id, landmarkId } = await params;

    const locationId = Number(id);
    const landmarkIdNumber = Number(landmarkId);

    const location = await prisma.location.findUnique({
        where: {
            id: locationId,
        },
        include: {
            previousNames: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });

    if (!location) {
        return <h1>Location not found</h1>;
    }

    const landmark = await prisma.locationLandmark.findFirst({
        where: {
            id: landmarkIdNumber,
            locationId,
        },
        include: {
            images: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });

    if (!landmark) {
        return <h1>Landmark not found</h1>;
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

                <Group
                    justify="space-between"
                    align="flex-start"
                >
                    <div>
                        <Title order={2}>
                            {landmark.name}
                        </Title>

                        <Text
                            c="dimmed"
                            size="sm"
                            mt={2}
                        >
                            Landmark at {location.name}.
                        </Text>
                    </div>

                    <Group gap="xs">
                        <Tooltip label="Back to landmarks">
                            <ActionIcon
                                component="a"
                                href={`/locations/${location.id}/landmarks`}
                                variant="subtle"
                                color="mesa"
                                size="lg"
                                aria-label="Back to landmarks"
                            >
                                <ArrowLeft size={20} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Edit landmark">
                            <ActionIcon
                                component="a"
                                href={`/locations/${location.id}/landmarks/${landmark.id}/edit`}
                                variant="subtle"
                                color="mesa"
                                size="lg"
                                aria-label="Edit landmark"
                            >
                                <Pencil size={20} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                <Divider />

                {landmark.description && (
                    <>
                        <Text>
                            {landmark.description}
                        </Text>

                        {landmark.images.length > 0 && (
                            <Divider />
                        )}
                    </>
                )}

                {landmark.images.length > 0 && (
                    <div>
                        <Title order={3} mb="md">
                            Gallery
                        </Title>

                        <LandmarkGallery
                            images={landmark.images}
                            landmarkName={landmark.name}
                        />
                    </div>
                )}
            </Stack>
        </main>
    );
}