
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
import ColonistHeader from "@/app/components/ColonistHeader";
import ColonistNavigation from "../ColonistNavigation";

export default async function ColonistStoriesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const colonist = await prisma.colonist.findUnique({
        where: {
            id: Number(id),
        },
        include: {
            legacy: true,

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

    if (!colonist) {
        return <h1>Colonist not found</h1>;
    }

    const stories = colonist.storyAssociations.map(
        (association) => association.story
    );

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
                {/* Header */}
                <ColonistHeader colonist={colonist} />

                {/* Navigation */}
                <ColonistNavigation
                    colonistId={colonist.id}
                />

                {/* Stories */}
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
                        <Group
                            justify="space-between"
                            align="flex-start"
                        >
                            <div>
                                <Title order={3}>
                                    Stories
                                </Title>

                                <Text
                                    c="dimmed"
                                    size="sm"
                                    mt={2}
                                >
                                    Stories associated with this colonist.
                                </Text>
                            </div>

                            <Badge
                                variant="light"
                                color="mesa"
                            >
                                {stories.length}{" "}
                                {stories.length === 1
                                    ? "story"
                                    : "stories"}
                            </Badge>
                        </Group>

                        {stories.length === 0 ? (
                            <Text c="dimmed">
                                No stories have been associated with this colonist yet.
                            </Text>
                        ) : (
                            <Stack gap="sm">
                                {stories.map((story) => (
                                    <Card
                                        key={story.id}
                                        padding="md"
                                        radius="sm"
                                        withBorder
                                        bg="#101010"
                                        style={{
                                            borderColor: "#292929",
                                        }}
                                    >
                                        <Stack gap="xs">
                                            <Text
                                                component="a"
                                                href={`/stories/${story.id}`}
                                                fw={600}
                                                size="lg"
                                                c="mesa"
                                                style={{
                                                    textDecoration: "none",
                                                }}
                                            >
                                                {story.title}
                                            </Text>

                                            {story.summary && (
                                                <Text
                                                    size="sm"
                                                    c="dimmed"
                                                    lineClamp={3}
                                                >
                                                    {story.summary}
                                                </Text>
                                            )}

                                            <Group gap="xs">
                                                <Badge variant="light" color="gray">
                                                    {story.type}
                                                </Badge>

                                                {colonist.storyAssociations
                                                    .filter((association) => association.storyId === story.id)
                                                    .map((association) => (
                                                        <Fragment
                                                            key={`${story.id}-${association.isInline}-${association.isManual}`}
                                                        >
                                                            {association.isInline && (
                                                                <Badge variant="light" color="cyan">
                                                                    Inline mention
                                                                </Badge>
                                                            )}

                                                            {association.isManual && (
                                                                <Badge variant="light" color="grape">
                                                                    Manual
                                                                </Badge>
                                                            )}
                                                        </Fragment>
                                                    ))}
                                            </Group>
                                        </Stack>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}
