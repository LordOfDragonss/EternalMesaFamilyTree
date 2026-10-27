"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Group,
    Modal,
    Select,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";

import {
    ArrowRightLeft,
    Pencil,
    Trash2,
    X,
} from "lucide-react";
import {
    deleteStoryTag,
    mergeStoryTags,
    renameStoryTag,
} from "../actions";

type StoryTagData = {
    id: number;
    name: string;
    _count: {
        stories: number;
    };
};

type StoryTagManagerProps = {
    tags: StoryTagData[];
};

type Feedback = {
    type: "success" | "error";
    message: string;
};

export default function StoryTagManager({
    tags,
}: StoryTagManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [renameTagId, setRenameTagId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState("");

    const [mergeSourceId, setMergeSourceId] = useState<number | null>(
        null,
    );
    const [mergeTargetId, setMergeTargetId] = useState<string | null>(
        null,
    );

    const [feedback, setFeedback] = useState<Feedback | null>(null);

    const renameTag = tags.find((tag) => tag.id === renameTagId);
    const mergeSource = tags.find((tag) => tag.id === mergeSourceId);

    const mergeOptions = tags
        .filter((tag) => tag.id !== mergeSourceId)
        .map((tag) => ({
            value: String(tag.id),
            label: tag.name,
        }));

    function openRename(tag: StoryTagData) {
        setFeedback(null);
        setRenameTagId(tag.id);
        setRenameValue(tag.name);
    }

    function closeRename() {
        if (isPending) return;

        setRenameTagId(null);
        setRenameValue("");
    }

    function saveRename() {
        if (
            renameTagId === null ||
            !renameValue.trim() ||
            isPending
        ) {
            return;
        }

        const tagId = renameTagId;
        const name = renameValue.trim();

        if (name === renameTag?.name) {
            closeRename();
            return;
        }

        setFeedback(null);

        startTransition(async () => {
            const result = await renameStoryTag(tagId, name);

            if (!result.ok) {
                setFeedback({
                    type: "error",
                    message: result.error,
                });
                return;
            }

            setRenameTagId(null);
            setRenameValue("");

            setFeedback({
                type: "success",
                message: `Renamed the tag to "${result.tagName}".`,
            });

            router.refresh();
        });
    }

    function removeTag(tag: StoryTagData) {
        if (isPending) return;

        const count = tag._count.stories;
        const usage =
            count === 1
                ? "It is used by 1 story."
                : `It is used by ${count} stories.`;

        const confirmed = window.confirm(
            `Remove "${tag.name}"? ${usage} The tag will be removed from those stories, but the stories themselves will remain.`,
        );

        if (!confirmed) return;

        setFeedback(null);

        startTransition(async () => {
            const result = await deleteStoryTag(tag.id);

            if (!result.ok) {
                setFeedback({
                    type: "error",
                    message: result.error,
                });
                return;
            }

            setFeedback({
                type: "success",
                message: `Removed the tag "${result.tagName}".`,
            });

            router.refresh();
        });
    }

    function openMerge(tag: StoryTagData) {
        setFeedback(null);
        setMergeSourceId(tag.id);
        setMergeTargetId(null);
    }

    function closeMerge() {
        if (isPending) return;

        setMergeSourceId(null);
        setMergeTargetId(null);
    }

    function confirmMerge() {
        if (
            mergeSourceId === null ||
            mergeTargetId === null ||
            isPending
        ) {
            return;
        }

        const source = tags.find(
            (tag) => tag.id === mergeSourceId,
        );

        if (!source) return;

        const targetId = Number(mergeTargetId);

        if (!Number.isSafeInteger(targetId) || targetId < 1) return;

        setFeedback(null);

        startTransition(async () => {
            const result = await mergeStoryTags(
                source.id,
                targetId,
            );

            if (!result.ok) {
                setFeedback({
                    type: "error",
                    message: result.error,
                });
                return;
            }

            setMergeSourceId(null);
            setMergeTargetId(null);

            setFeedback({
                type: "success",
                message: `Merged "${source.name}" into "${result.tagName}".`,
            });

            router.refresh();
        });
    }

    return (
        <Stack gap="md">
            {feedback && (
                <Alert
                    color={feedback.type === "error" ? "red" : "mesa"}
                    variant="light"
                    title={
                        feedback.type === "error"
                            ? "Action could not be completed"
                            : "Changes saved"
                    }
                    withCloseButton
                    onClose={() => setFeedback(null)}
                >
                    {feedback.message}
                </Alert>
            )}

            {tags.length === 0 ? (
                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: "#292929",
                        textAlign: "center",
                    }}
                >
                    <Stack gap="xs" align="center">
                        <Text fw={600}>No tags yet</Text>

                        <Text size="sm" c="dimmed">
                            Tags are created automatically when you save
                            stories with new tag names.
                        </Text>
                    </Stack>
                </Card>
            ) : (
                <Stack gap="sm">
                    {tags.map((tag) => (
                        <Card
                            key={tag.id}
                            shadow="sm"
                            padding="md"
                            radius="md"
                            withBorder
                            bg="#161616"
                            style={{
                                borderColor: "#292929",
                            }}
                        >
                            <Group
                                justify="space-between"
                                align="center"
                                gap="md"
                                wrap="nowrap"
                            >
                                <Stack
                                    gap={4}
                                    style={{
                                        minWidth: 0,
                                        flex: 1,
                                    }}
                                >
                                    <Text
                                        fw={600}
                                        style={{
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {tag.name}
                                    </Text>

                                    <Badge
                                        variant="light"
                                        color="mesa"
                                        size="sm"
                                        w="fit-content"
                                    >
                                        {tag._count.stories}{" "}
                                        {tag._count.stories === 1 ? "story" : "stories"}
                                    </Badge>
                                </Stack>

                                <Group
                                    gap={4}
                                    wrap="nowrap"
                                    style={{ flexShrink: 0 }}
                                >
                                    <Tooltip label="Rename tag">
                                        <ActionIcon
                                            variant="subtle"
                                            color="mesa"
                                            size="lg"
                                            aria-label={`Rename ${tag.name}`}
                                            disabled={isPending}
                                            onClick={() => openRename(tag)}
                                        >
                                            <Pencil size={17} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Button
                                        variant="subtle"
                                        color="mesa"
                                        size="compact-sm"
                                        leftSection={<ArrowRightLeft size={15} />}
                                        disabled={isPending || tags.length < 2}
                                        onClick={() => openMerge(tag)}
                                    >
                                        Merge
                                    </Button>

                                    <Tooltip label="Remove tag">
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="lg"
                                            aria-label={`Remove ${tag.name}`}
                                            disabled={isPending}
                                            onClick={() => removeTag(tag)}
                                        >
                                            <Trash2 size={17} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                        </Card>
                    ))}
                </Stack>
            )}

            <Modal
                opened={renameTagId !== null}
                onClose={closeRename}
                title="Rename tag"
                centered
                overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        saveRename();
                    }}
                >
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            The name will be updated everywhere this tag
                            is used.
                        </Text>

                        <TextInput
                            label="Tag name"
                            placeholder="Enter a tag name"
                            value={renameValue}
                            onChange={(event) =>
                                setRenameValue(
                                    event.currentTarget.value,
                                )
                            }
                            autoFocus
                            required
                            maxLength={100}
                        />

                        <Group justify="flex-end" gap="sm">
                            <Button
                                type="button"
                                variant="subtle"
                                color="gray"
                                leftSection={<X size={16} />}
                                disabled={isPending}
                                onClick={closeRename}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                color="mesa"
                                loading={isPending}
                                disabled={
                                    !renameValue.trim() ||
                                    renameValue.trim() === renameTag?.name
                                }
                            >
                                Save changes
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal
                opened={mergeSourceId !== null}
                onClose={closeMerge}
                title="Merge tags"
                centered
                overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        All stories using the source tag will receive the
                        target tag instead. If a story already has both
                        tags, it will keep just the target tag.
                    </Text>

                    {mergeSource && (
                        <Card
                            withBorder
                            padding="sm"
                            radius="md"
                            bg="#161616"
                            style={{ borderColor: "#292929" }}
                        >
                            <Text size="xs" c="dimmed" mb={4}>
                                Source tag to remove
                            </Text>

                            <Text fw={600} style={{ overflowWrap: "anywhere" }}>
                                {mergeSource.name}
                            </Text>

                            <Text size="xs" c="dimmed" mt={4}>
                                {mergeSource._count.stories}{" "}
                                {mergeSource._count.stories === 1
                                    ? "story"
                                    : "stories"}
                            </Text>
                        </Card>
                    )}

                    <Select
                        label="Target tag to keep"
                        placeholder="Select a tag"
                        data={mergeOptions}
                        value={mergeTargetId}
                        onChange={setMergeTargetId}
                        searchable
                        nothingFoundMessage="No tags found"
                    />

                    <Group justify="flex-end" gap="sm">
                        <Button
                            variant="subtle"
                            color="gray"
                            disabled={isPending}
                            onClick={closeMerge}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="mesa"
                            loading={isPending}
                            disabled={
                                mergeTargetId === null ||
                                mergeSourceId === null
                            }
                            onClick={confirmMerge}
                        >
                            Merge tags
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}