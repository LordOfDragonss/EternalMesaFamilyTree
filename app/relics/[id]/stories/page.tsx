
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
import RelicHeader from "../RelicHeader";
import RelicNavigation from "../RelicNavigation";

export default async function RelicStoriesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const relic = await prisma.relic.findUnique({
        where: {
            id: Number(id),
        },
        include: {
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

    if (!relic) {
        return <h1>Relic not found</h1>;
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
                <RelicHeader relic={relic} />

                <RelicNavigation relicId={relic.id} />

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
                                Published stories associated with
                                this relic.
                            </Text>
                        </div>

                        {relic.storyAssociations.length === 0 ? (
                            <Text c="dimmed">
                                No stories are associated with this
                                relic yet.
                            </Text>
                        ) : (
                            <Stack gap="lg">
                                {relic.storyAssociations.map(
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
