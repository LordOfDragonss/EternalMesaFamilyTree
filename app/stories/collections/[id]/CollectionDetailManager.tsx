
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ActionIcon,
    Badge,
    Card,
    Group,
    Select,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Pencil, Plus, X } from "lucide-react";
import {
    addStoryToCollection,
    removeStoryFromCollection,
} from "../../actions";
import classes from "../../story-library.module.css";

type CollectionStory = {
    id: number;
    title: string;
    summary: string | null;
    type: string;
    status: "DRAFT" | "COMPLETE";
    dateDescription: string;
    updatedAtLabel: string;
    tags: {
        id: number;
        name: string;
    }[];
};

type AvailableStory = {
    id: number;
    title: string;
};

type CollectionDetailManagerProps = {
    collectionId: number;
    initialCollectionName: string;
    initialStories: CollectionStory[];
    availableStories: AvailableStory[];
};

export default function CollectionDetailManager({
    collectionId,
    initialStories,
    availableStories,
}: CollectionDetailManagerProps) {
    const router = useRouter();

    const [selectedStoryId, setSelectedStoryId] = useState<string | null>(
        null
    );
    const [adding, setAdding] = useState(false);
    const [removingStoryId, setRemovingStoryId] = useState<number | null>(
        null
    );
    const [feedback, setFeedback] = useState<string | null>(null);

    const storyOptions = availableStories.map((story) => ({
        value: String(story.id),
        label: story.title,
    }));

    async function handleAddStory() {
        if (!selectedStoryId || adding || removingStoryId !== null) {
            return;
        }

        setAdding(true);
        setFeedback(null);

        try {
            const result = await addStoryToCollection(
                collectionId,
                Number(selectedStoryId)
            );

            if (!result.ok) {
                setFeedback(result.error);
                return;
            }

            setSelectedStoryId(null);
            setFeedback("Story added to the collection.");
            router.refresh();
        } catch {
            setFeedback("Could not add the story to the collection.");
        } finally {
            setAdding(false);
        }
    }

    async function handleRemoveStory(storyId: number) {
        if (adding || removingStoryId !== null) {
            return;
        }

        setRemovingStoryId(storyId);
        setFeedback(null);

        try {
            const result = await removeStoryFromCollection(
                collectionId,
                storyId
            );

            if (!result.ok) {
                setFeedback(result.error);
                return;
            }

            setFeedback("Story removed from the collection.");
            router.refresh();
        } catch {
            setFeedback("Could not remove the story from the collection.");
        } finally {
            setRemovingStoryId(null);
        }
    }

    const isWorking = adding || removingStoryId !== null;

    return (
        <Stack gap="md">
            {/* Stories come first: browsing is the main purpose of this page. */}
            <Card
                bg="#161616"
                withBorder
                style={{ borderColor: "#292929" }}
                padding="md"
            >
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Title order={3}>Stories</Title>
                        <Text size="sm" c="dimmed">
                            {initialStories.length}{" "}
                            {initialStories.length === 1 ? "story" : "stories"}
                        </Text>
                    </Group>

                    {initialStories.length > 0 ? (
                        <div className={classes.storyList}>
                            {initialStories.map((story) => (
                                <div
                                    key={story.id}
                                    className={classes.storyRow}
                                >
                                    <div className={classes.storyMain}>
                                        <Link
                                            href={`/stories/${story.id}`}
                                            className={classes.storyTitle}
                                        >
                                            {story.title}
                                        </Link>

                                        <div style={{ marginTop: 6 }}>
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={
                                                    story.status === "DRAFT"
                                                        ? "gray"
                                                        : "green"
                                                }
                                            >
                                                {story.status === "DRAFT"
                                                    ? "Draft"
                                                    : "Complete"}
                                            </Badge>
                                        </div>

                                        {story.summary && (
                                            <Text
                                                className={classes.summary}
                                                mt={6}
                                            >
                                                {story.summary}
                                            </Text>
                                        )}

                                        <Text
                                            className={classes.metadata}
                                            mt={6}
                                        >
                                            {story.type}
                                            {" · "}
                                            {story.dateDescription}
                                            {" · "}
                                            Updated {story.updatedAtLabel}
                                        </Text>

                                        {story.tags.length > 0 && (
                                            <Group gap={6} mt={6}>
                                                {story.tags.map((tag) => (
                                                    <Badge
                                                        key={tag.id}
                                                        size="sm"
                                                        variant="light"
                                                        color="gray"
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        )}
                                    </div>

                                    <Group
                                        className={classes.storyAside}
                                        gap="xs"
                                        wrap="nowrap"
                                    >
                                        <Tooltip label="Edit story">
                                            <ActionIcon
                                                component={Link}
                                                href={`/stories/${story.id}/edit`}
                                                variant="subtle"
                                                color="gray"
                                                size="lg"
                                                aria-label={`Edit ${story.title}`}
                                            >
                                                <Pencil size={16} />
                                            </ActionIcon>
                                        </Tooltip>

                                        <Tooltip label="Remove from collection">
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                size="lg"
                                                aria-label={`Remove ${story.title} from collection`}
                                                disabled={isWorking}
                                                loading={
                                                    removingStoryId ===
                                                    story.id
                                                }
                                                onClick={() =>
                                                    handleRemoveStory(story.id)
                                                }
                                            >
                                                <X size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={classes.emptyState}>
                            <Text c="dimmed" size="sm">
                                This collection has no stories yet.
                            </Text>
                        </div>
                    )}
                </Stack>
            </Card>

            {/* Only show adding controls when there are stories available to add. */}
            {availableStories.length > 0 && (
                <Card
                    bg="#161616"
                    withBorder
                    style={{ borderColor: "#292929" }}
                    padding="md"
                >
                    <Stack gap="sm">
                        <Title order={4}>Add a story</Title>

                        <Group align="flex-end" gap="xs">
                            <Select
                                label="Story"
                                placeholder="Search stories..."
                                data={storyOptions}
                                value={selectedStoryId}
                                onChange={setSelectedStoryId}
                                searchable
                                clearable
                                nothingFoundMessage="No matching stories"
                                disabled={isWorking}
                                comboboxProps={{
                                    withinPortal: true,
                                }}
                                style={{ flex: 1 }}
                            />

                            <Tooltip label="Add story to collection">
                                <ActionIcon
                                    variant="filled"
                                    color="mesa"
                                    size="lg"
                                    aria-label="Add story to collection"
                                    disabled={!selectedStoryId || isWorking}
                                    loading={adding}
                                    onClick={handleAddStory}
                                >
                                    <Plus size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>

                        {feedback && (
                            <Text size="sm" c="dimmed">
                                {feedback}
                            </Text>
                        )}
                    </Stack>
                </Card>
            )}

            {/* Keep feedback available if the add section disappears after an update. */}
            {availableStories.length === 0 && feedback && (
                <Text size="sm" c="dimmed">
                    {feedback}
                </Text>
            )}
        </Stack>
    );
}
