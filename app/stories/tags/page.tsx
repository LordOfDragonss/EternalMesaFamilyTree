import { ActionIcon,Tooltip, Group, Text, Title } from "@mantine/core";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import StoryTagManager from "./StoryTagManager";
import classes from "../story-library.module.css";

export default async function StoryTagsPage() {
    const tags = await prisma.tag.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    stories: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <main className={classes.page}>
            <Group
                justify="space-between"
                align="center"
                mb="xl"
                gap="md"
                wrap="wrap"
            >
                <div>
                    <Title order={1}>Story tags</Title>
                    <Text c="dimmed" mt={4}>
                        Manage tags used to categorize and find stories.
                    </Text>
                </div>

                <Tooltip label="Back to stories">
                    <ActionIcon
                        component="a"
                        href="/stories"
                        variant="subtle"
                        size="lg"
                        aria-label="Back to stories"
                        color="mesa"
                        className={classes.backToStoriesAction}
                    >
                        <ArrowLeft size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
                {tags.length} {tags.length === 1 ? "tag" : "tags"} in total
            </Text>

            <StoryTagManager tags={tags} />
        </main>
    );
}