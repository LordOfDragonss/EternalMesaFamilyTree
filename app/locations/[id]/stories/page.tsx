
import {
    Badge,
    Card,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { Fragment } from "react";

import { prisma } from "@/lib/prisma";
import LocationHeader from "../LocationHeader";
import LocationNavigation from "../LocationNavigation";

export default async function LocationStoriesPage({
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
            storyAssociations: {
                where: {
                    story: {
                        status: "COMPLETE",
                    },
                },
                include: {
                    story: true,
                },
                orderBy: {
                    story: {
                        updatedAt: "desc",
                    },
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
                            <Title order={2}>
                                Stories
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Published stories associated with this
                                location.
                            </Text>
                        </div>

                        {location.storyAssociations.length === 0 ? (
                            <Text c="dimmed">
                                No stories are associated with this
                                location yet.
                            </Text>
                        ) : (
                            <Stack gap="lg">
                                {location.storyAssociations.map(
                                    (association) => (
                                        <Fragment
                                            key={association.story.id}
                                        >
                                            <Stack gap="xs">
                                                <Group
                                                    gap="xs"
                                                    align="center"
                                                >
                                                    <Text
                                                        component="a"
                                                        href={`/stories/${association.story.id}`}
                                                        c="mesa"
                                                        fw={600}
                                                        size="lg"
                                                    >
                                                        {association.story.title}
                                                    </Text>

                                                    {association.isInline && (
                                                        <Badge
                                                            variant="light"
                                                            color="cyan"
                                                        >
                                                            Inline mention
                                                        </Badge>
                                                    )}

                                                    {association.isManual && (
                                                        <Badge
                                                            variant="light"
                                                            color="grape"
                                                        >
                                                            Manual
                                                        </Badge>
                                                    )}
                                                </Group>

                                                {association.story.summary && (
                                                    <Text
                                                        c="dimmed"
                                                        size="sm"
                                                    >
                                                        {association.story.summary}
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Fragment>
                                    )
                                )}
                            </Stack>
                        )}
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}
