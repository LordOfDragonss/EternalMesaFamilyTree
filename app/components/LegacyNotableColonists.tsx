"use client";

import {
    ActionIcon,
    Button,
    Card,
    Group,
    Select,
    Stack,
    Text,
    Textarea,
    Tooltip,
} from "@mantine/core";
import {
    Check,
    Pencil,
    Plus,
    X,
} from "lucide-react";
import { useState } from "react";

type NotableColonist = {
    legacyId: number;
    colonistId: number;
    description: string | null;
    colonist: {
        id: number;
        firstName: string;
        lastName: string;
        nickname: string | null;
    };
};

type ColonistOption = {
    value: string;
    label: string;
};

type Props = {
    legacyId: number;
    legacyColor: string;
    notableColonists: NotableColonist[];
    availableColonists: ColonistOption[];
};

export default function LegacyNotableColonists({
    legacyId,
    legacyColor,
    notableColonists,
    availableColonists,
}: Props) {
    const [items, setItems] = useState(notableColonists);

    const [availableItems, setAvailableItems] = useState(
        availableColonists
    );

    const [editingId, setEditingId] = useState<number | null>(
        null
    );

    const [description, setDescription] = useState("");

    function startEditing(item: NotableColonist) {
        setEditingId(item.colonistId);
        setDescription(item.description ?? "");
    }

    function cancelEditing() {
        setEditingId(null);
        setDescription("");
    }

    async function saveDescription(colonistId: number) {
        const response = await fetch(
            `/api/legacies/${legacyId}/notable/${colonistId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description,
                }),
            }
        );

        if (!response.ok) {
            return;
        }

        setItems((current) =>
            current.map((item) =>
                item.colonistId === colonistId
                    ? {
                          ...item,
                          description:
                              description.trim() || null,
                      }
                    : item
            )
        );

        cancelEditing();
    }

    async function removeNotable(colonistId: number) {
        const response = await fetch(
            `/api/legacies/${legacyId}/notable/${colonistId}`,
            {
                method: "DELETE",
            }
        );

        if (!response.ok) {
            return;
        }

        // Find the colonist that was removed
        const removed = items.find(
            (item) => item.colonistId === colonistId
        );

        // Add them back to the available colonist list
        if (removed) {
            setAvailableItems((current) => [
                ...current,
                {
                    value: removed.colonist.id.toString(),
                    label: `${removed.colonist.firstName}${
                        removed.colonist.nickname
                            ? ` "${removed.colonist.nickname}"`
                            : ""
                    } ${removed.colonist.lastName}`,
                },
            ]);
        }

        // Remove them from the notable list
        setItems((current) =>
            current.filter(
                (item) => item.colonistId !== colonistId
            )
        );
    }

    return (
        <Stack gap="md">
            {items.map((item) => {
                const name = `${item.colonist.firstName}${
                    item.colonist.nickname
                        ? ` "${item.colonist.nickname}"`
                        : ""
                } ${item.colonist.lastName}`;

                const editing =
                    editingId === item.colonistId;

                return (
                    <Card
                        key={item.colonistId}
                        padding="md"
                        radius="sm"
                        withBorder
                        style={{
                            borderColor: "#292929",
                            borderLeftWidth: 3,
                            borderLeftColor: legacyColor,
                        }}
                    >
                        {editing ? (
                            <Stack gap="sm">
                                <Text fw={600}>
                                    {name}
                                </Text>

                                <Textarea
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.currentTarget
                                                .value
                                        )
                                    }
                                    placeholder="Why are they notable?"
                                    autosize
                                    minRows={2}
                                />

                                <Group justify="flex-end">
                                    <Button
                                        variant="subtle"
                                        size="xs"
                                        onClick={cancelEditing}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        size="xs"
                                        leftSection={
                                            <Check size={14} />
                                        }
                                        onClick={() =>
                                            saveDescription(
                                                item.colonistId
                                            )
                                        }
                                        style={{
                                            backgroundColor:
                                                legacyColor,
                                        }}
                                    >
                                        Save
                                    </Button>
                                </Group>
                            </Stack>
                        ) : (
                            <Group
                                justify="space-between"
                                align="flex-start"
                                wrap="nowrap"
                            >
                                <div>
                                    <Text
                                        component="a"
                                        href={`/colonists/${item.colonist.id}`}
                                        fw={600}
                                        style={{
                                            color: legacyColor,
                                            textDecoration:
                                                "none",
                                        }}
                                    >
                                        {name}
                                    </Text>

                                    {item.description && (
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            mt={4}
                                        >
                                            {item.description}
                                        </Text>
                                    )}
                                </div>

                                <Group gap={4}>
                                    <Tooltip label="Edit description">
                                        <ActionIcon
                                            variant="subtle"
                                            size="sm"
                                            onClick={() =>
                                                startEditing(
                                                    item
                                                )
                                            }
                                            style={{
                                                color: legacyColor,
                                            }}
                                        >
                                            <Pencil size={15} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip label="Remove notable colonist">
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            onClick={() =>
                                                removeNotable(
                                                    item.colonistId
                                                )
                                            }
                                        >
                                            <X size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                        )}
                    </Card>
                );
            })}

            {items.length === 0 && (
                <Text c="dimmed">
                    No notable colonists have been
                    recorded for this legacy yet.
                </Text>
            )}

            {availableItems.length > 0 && (
                <form
                    action={`/api/legacies/${legacyId}/notable`}
                    method="POST"
                >
                    <Stack gap="sm">
                        <Select
                            name="colonistId"
                            label="Add notable colonist"
                            placeholder="Select a colonist"
                            data={availableItems}
                            searchable
                            required
                        />

                        <Textarea
                            name="description"
                            label="Why are they notable?"
                            placeholder="Optional description..."
                            autosize
                            minRows={2}
                        />

                        <Group justify="flex-end">
                            <Button
                                type="submit"
                                leftSection={
                                    <Plus size={16} />
                                }
                                style={{
                                    backgroundColor:
                                        legacyColor,
                                }}
                            >
                                Add notable colonist
                            </Button>
                        </Group>
                    </Stack>
                </form>
            )}

            {availableItems.length === 0 && (
                <Text size="sm" c="dimmed">
                    All colonists are already notable in
                    this legacy.
                </Text>
            )}
        </Stack>
    );
}