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
    Stack,
    Text,
    TextInput,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    ArrowLeft,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";

import {
    createStoryCollection,
    deleteStoryCollection,
    renameStoryCollection,
} from "../actions";

type CollectionData = {
    id: number;
    name: string;
    _count: {
        stories: number;
    };
};

type Feedback = {
    type: "success" | "error";
    message: string;
};

export default function StoryCollectionsManager({
    collections,
}: {
    collections: CollectionData[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");

    const [renameId, setRenameId] = useState<number | null>(null);
    const [renameName, setRenameName] = useState("");

    const [feedback, setFeedback] = useState<Feedback | null>(null);

    function closeCreate() {
        if (isPending) return;

        setCreateOpen(false);
        setCreateName("");
    }

    function createCollection() {
        const name = createName.trim();

        if (!name || isPending) return;

        setFeedback(null);

        startTransition(async () => {
            const result = await createStoryCollection(name);

            if (!result.ok) {
                setFeedback({
                    type: "error",
                    message: result.error,
                });
                return;
            }

            setCreateOpen(false);
            setCreateName("");

            setFeedback({
                type: "success",
                message: `Collection "${result.name}" is ready.`,
            });

            router.refresh();
        });
    }

    function openRename(collection: CollectionData) {
        setFeedback(null);
        setRenameId(collection.id);
        setRenameName(collection.name);
    }

    function closeRename() {
        if (isPending) return;

        setRenameId(null);
        setRenameName("");
    }

    function saveRename() {
        const id = renameId;
        const name = renameName.trim();

        if (id === null || !name || isPending) return;

        setFeedback(null);

        startTransition(async () => {
            const result = await renameStoryCollection(id, name);

            if (!result.ok) {
                setFeedback({
                    type: "error",
                    message: result.error,
                });
                return;
            }

            setRenameId(null);
            setRenameName("");

            setFeedback({
                type: "success",
                message: `Renamed the collection to "${result.collectionName}".`,
            });

            router.refresh();
        });
    }

    function removeCollection(collection: CollectionData) {
        if (isPending) return;

        const count = collection._count.stories;
        const usage =
            count === 1
                ? "It currently contains 1 story."
                : `It currently contains ${count} stories.`;

        if (
            !window.confirm(
                `Delete the collection "${collection.name}"? ${usage} The stories themselves will not be deleted.`,
            )
        ) {
            return;
        }

        setFeedback(null);

        startTransition(async () => {
            const result = await deleteStoryCollection(collection.id);

            if (!result.ok) {
                setFeedback({
                    type: "error",
                    message: result.error,
                });
                return;
            }

            setFeedback({
                type: "success",
                message: `Deleted the collection "${result.collectionName}".`,
            });

            router.refresh();
        });
    }

    return (
        <Stack gap="xl">
            <Group
                justify="space-between"
                align="center"
                gap="md"
                wrap="wrap"
            >
                <div>
                    <Title order={1}>Story collections</Title>
                    <Text c="dimmed" mt={4}>
                        Group related stories and browse them together.
                    </Text>
                </div>

                <Group gap="xs">
                    <Tooltip label="Back to stories">
                        <ActionIcon
                            component="a"
                            href="/stories"
                            variant="subtle"
                            size="lg"
                            color="mesa"
                            aria-label="Back to stories"
                        >
                            <ArrowLeft size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Create collection">
                        <ActionIcon
                            variant="filled"
                            color="mesa"
                            size="lg"
                            aria-label="Create collection"
                            onClick={() => {
                                setFeedback(null);
                                setCreateName("");
                                setCreateOpen(true);
                            }}
                        >
                            <Plus size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

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

            <Text size="sm" c="dimmed">
                {collections.length}{" "}
                {collections.length === 1
                    ? "collection"
                    : "collections"}
            </Text>

            {collections.length === 0 ? (
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
                    <Stack align="center" gap="xs">
                        <Text fw={600}>No collections yet</Text>
                        <Text size="sm" c="dimmed">
                            Create a collection to group related stories.
                        </Text>
                    </Stack>
                </Card>
            ) : (
                <Stack gap="sm">
                    {collections.map((collection) => (
                        <Card
                            key={collection.id}
                            shadow="sm"
                            padding="md"
                            radius="md"
                            withBorder
                            bg="#161616"
                            style={{ borderColor: "#292929" }}
                        >
                            <Group
                                justify="space-between"
                                align="center"
                                wrap="nowrap"
                                gap="md"
                            >
                                <Stack
                                    gap={5}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <Text
                                        component="a"
                                        href={`/stories/collections/${collection.id}`}
                                        fw={600}
                                        c="mesa"
                                        style={{
                                            textDecoration: "none",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {collection.name}
                                    </Text>

                                    <Badge
                                        variant="light"
                                        color="mesa"
                                        w="fit-content"
                                    >
                                        {collection._count.stories}{" "}
                                        {collection._count.stories === 1
                                            ? "story"
                                            : "stories"}
                                    </Badge>
                                </Stack>

                                <Group gap={4} wrap="nowrap">
                                    <Tooltip label="Rename collection">
                                        <ActionIcon
                                            variant="subtle"
                                            color="mesa"
                                            size="lg"
                                            aria-label={`Rename ${collection.name}`}
                                            disabled={isPending}
                                            onClick={() =>
                                                openRename(collection)
                                            }
                                        >
                                            <Pencil size={17} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip label="Delete collection">
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="lg"
                                            aria-label={`Delete ${collection.name}`}
                                            disabled={isPending}
                                            onClick={() =>
                                                removeCollection(collection)
                                            }
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
                opened={createOpen}
                onClose={closeCreate}
                title="Create collection"
                centered
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        createCollection();
                    }}
                >
                    <Stack gap="md">
                        <TextInput
                            label="Collection name"
                            placeholder="Enter a name"
                            value={createName}
                            onChange={(event) =>
                                setCreateName(event.currentTarget.value)
                            }
                            required
                            maxLength={100}
                            autoFocus
                        />

                        <Group justify="flex-end" gap="sm">
                            <Button
                                type="button"
                                variant="subtle"
                                color="gray"
                                leftSection={<X size={16} />}
                                disabled={isPending}
                                onClick={closeCreate}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                color="mesa"
                                loading={isPending}
                                disabled={!createName.trim()}
                            >
                                Create collection
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal
                opened={renameId !== null}
                onClose={closeRename}
                title="Rename collection"
                centered
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        saveRename();
                    }}
                >
                    <Stack gap="md">
                        <TextInput
                            label="Collection name"
                            value={renameName}
                            onChange={(event) =>
                                setRenameName(event.currentTarget.value)
                            }
                            required
                            maxLength={100}
                            autoFocus
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
                                    !renameName.trim() ||
                                    renameName.trim() ===
                                        collections.find(
                                            (collection) =>
                                                collection.id === renameId,
                                        )?.name
                                }
                            >
                                Save changes
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
}