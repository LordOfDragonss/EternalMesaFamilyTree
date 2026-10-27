"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    ActionIcon,
    Alert,
    Button,
    Group,
    Modal,
    Stack,
    TextInput,
    Tooltip,
} from "@mantine/core";
import { Plus, X } from "lucide-react";
import { createStoryCollection } from "../actions";

export default function StoryCollectionCreateButton() {
    const router = useRouter();
    const [opened, setOpened] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    function close() {
        if (isPending) return;

        setOpened(false);
        setName("");
        setError("");
    }

    function create() {
        const trimmedName = name.trim();

        if (!trimmedName || isPending) return;

        setError("");

        startTransition(async () => {
            const result = await createStoryCollection(trimmedName);

            if (!result.ok) {
                setError(result.error);
                return;
            }

            setOpened(false);
            setName("");
            setError("");
            router.refresh();
        });
    }

    return (
        <>
            <Tooltip label="Create collection">
                <ActionIcon
                    variant="filled"
                    color="mesa"
                    size="lg"
                    aria-label="Create collection"
                    onClick={() => setOpened(true)}
                >
                    <Plus size={20} />
                </ActionIcon>
            </Tooltip>

            <Modal
                opened={opened}
                onClose={close}
                title="Create collection"
                centered
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        create();
                    }}
                >
                    <Stack gap="md">
                        {error && (
                            <Alert color="red" title="Could not create collection">
                                {error}
                            </Alert>
                        )}

                        <TextInput
                            label="Collection name"
                            placeholder="Enter a name"
                            value={name}
                            onChange={(event) =>
                                setName(event.currentTarget.value)
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
                                onClick={close}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                color="mesa"
                                loading={isPending}
                                disabled={!name.trim()}
                            >
                                Create collection
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </>
    );
}