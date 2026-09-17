import {
    Button,
    Card,
    Stack,
    Text,
    TextInput,
    Textarea,
    Title,
    Group,
    Tooltip,
    ActionIcon,
} from "@mantine/core";

import { ArrowLeft} from "lucide-react";

import { prisma } from "@/lib/prisma";
import LocationHeader from "../../LocationHeader";
import LocationNavigation from "../../LocationNavigation";
import LocationLandmarkImageUpload from "../LocationLandmarkImageUpload";

export default async function CreateLandmarkPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const locationId = Number(id);

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
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>
                            Add Landmark
                        </Title>

                        <Text c="dimmed" size="sm" mt={2}>
                            Add a notable place at this location.
                        </Text>
                    </div>

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
                </Group>

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
                    <form
                        action={`/api/locations/${location.id}/landmarks`}
                        method="POST"
                        encType="multipart/form-data"
                    >
                        <Stack gap="lg">
                            <div>
                                <Title order={2}>
                                    Add Landmark
                                </Title>

                                <Text
                                    c="dimmed"
                                    size="sm"
                                    mt={2}
                                >
                                    Add a notable place at this location.
                                </Text>
                            </div>

                            <TextInput
                                name="name"
                                label="Name"
                                placeholder="e.g. Oven Hotel"
                                required
                            />

                            <Textarea
                                name="description"
                                label="Description"
                                placeholder="Describe this landmark..."
                                minRows={4}
                            />

                            <div>
                                <Text fw={500} mb="xs">
                                    Images
                                </Text>

                                <LocationLandmarkImageUpload />
                            </div>

                            <Button
                                type="submit"
                                color="mesa"
                            >
                                Create landmark
                            </Button>
                        </Stack>
                    </form>
                </Card>
            </Stack>
        </main>
    );
}