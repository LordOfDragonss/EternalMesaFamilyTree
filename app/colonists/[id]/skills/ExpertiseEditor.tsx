"use client";

import {
    Button,
    Card,
    Group,
    NumberInput,
    Select,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ExpertiseEffect = {
    id: number;
    name: string;
    value: number;
    unit: string | null;
};

export type Expertise = {
    id: number;
    skillId: number;
    name: string;
    description: string | null;
    skill: {
        id: number;
        name: string;
    };
    effects: ExpertiseEffect[];
};

export type ColonistExpertise = {
    id: number;
    colonistSkillId: number;
    expertiseId: number;
    level: number;
    expertise: Expertise;
};

export type CreateExpertise = {
    expertiseId: number;
    level: number;
    expertise: Expertise;
};

type ExpertiseEditorProps =
    | {
        mode: "edit";
        colonistId: number;
        expertises: ColonistExpertise[];
        availableExpertises: Expertise[];
        onClose?: () => void;
    }
    | {
        mode: "create";
        expertises: CreateExpertise[];
        availableExpertises: Expertise[];
    };

type EditedExpertise = {
    expertiseId: number;
    level: number;
    expertise: Expertise;
};

export default function ExpertiseEditor(
    props: ExpertiseEditorProps
) {
    const router = useRouter();

    /*
     * Normalize the arrays so the editor never attempts
     * to call .map() on undefined.
     */
    const existingExpertises =
        props.expertises ?? [];

    const availableExpertises =
        props.availableExpertises ?? [];

    const initialExpertises =
        existingExpertises.map(
            (expertise) => ({
                expertiseId:
                    expertise.expertiseId,
                level: expertise.level,
                expertise:
                    expertise.expertise,
            })
        );

    const [editedExpertises, setEditedExpertises] =
        useState<EditedExpertise[]>(
            initialExpertises
        );

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const canAddMore =
        editedExpertises.length < 3;

    function addExpertise(
        expertiseId: string | null
    ) {
        if (
            !expertiseId ||
            !canAddMore
        ) {
            return;
        }

        const id = Number(expertiseId);

        const expertise =
            availableExpertises.find(
                (item) => item.id === id
            );

        if (!expertise) {
            return;
        }

        if (
            editedExpertises.some(
                (item) =>
                    item.expertiseId === id
            )
        ) {
            return;
        }

        setEditedExpertises(
            (current) => [
                ...current,
                {
                    expertiseId: id,
                    level: 1,
                    expertise,
                },
            ]
        );
    }

    function updateLevel(
        expertiseId: number,
        level: number
    ) {
        setEditedExpertises(
            (current) =>
                current.map(
                    (expertise) =>
                        expertise.expertiseId ===
                            expertiseId
                            ? {
                                ...expertise,
                                level,
                            }
                            : expertise
                )
        );
    }

    function removeExpertise(
        expertiseId: number
    ) {
        setEditedExpertises(
            (current) =>
                current.filter(
                    (expertise) =>
                        expertise.expertiseId !==
                        expertiseId
                )
        );
    }

    async function saveExpertises() {
        if (props.mode !== "edit") {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response =
                await fetch(
                    `/api/colonists/${props.colonistId}/expertises`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            expertises:
                                editedExpertises.map(
                                    (expertise) => ({
                                        expertiseId:
                                            expertise.expertiseId,
                                        level:
                                            expertise.level,
                                    })
                                ),
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Failed to save expertises."
                );
            }

            /*
             * Saving through the API should also close
             * the editor. The refreshed page will show
             * the updated expertises.
             */
            if (props.onClose) {
                props.onClose();
            }

            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to save expertises."
            );
        } finally {
            setSaving(false);
        }
    }

    const selectedIds =
        new Set(
            editedExpertises.map(
                (expertise) =>
                    expertise.expertiseId
            )
        );

    const availableOptions = Object.values(
        availableExpertises
            .filter(
                (expertise) =>
                    !selectedIds.has(expertise.id)
            )
            .reduce(
                (groups, expertise) => {
                    const skillName =
                        expertise.skill.name;

                    if (!groups[skillName]) {
                        groups[skillName] = {
                            group: skillName,
                            items: [],
                        };
                    }

                    groups[skillName].items.push({
                        value:
                            expertise.id.toString(),
                        label: expertise.name,
                    });

                    return groups;
                },
                {} as Record<
                    string,
                    {
                        group: string;
                        items: {
                            value: string;
                            label: string;
                        }[];
                    }
                >
            )
    );

    return (
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
            <Stack gap="xl">

                {/* Header */}
                <div>
                    <Title order={3}>
                        {props.mode === "edit"
                            ? "Edit Expertises"
                            : "Expertises"}
                    </Title>

                    <Text
                        c="dimmed"
                        size="sm"
                        mt={2}
                    >
                        {props.mode === "edit"
                            ? "Update this colonist's expertises and expertise levels."
                            : "Choose this colonist's expertises and set their levels."}
                    </Text>
                </div>

                {/* Selected expertises */}
                {editedExpertises.length > 0 && (
                    <Stack gap="lg">
                        {editedExpertises.map(
                            (expertise) => (
                                <ExpertiseEditorRow
                                    key={
                                        expertise.expertiseId
                                    }
                                    expertise={
                                        expertise
                                    }
                                    onLevelChange={(
                                        level
                                    ) =>
                                        updateLevel(
                                            expertise.expertiseId,
                                            level
                                        )
                                    }
                                    onRemove={() =>
                                        removeExpertise(
                                            expertise.expertiseId
                                        )
                                    }
                                />
                            )
                        )}
                    </Stack>
                )}

                {/* Add expertise */}
                {canAddMore && (
                    <Select
                        label="Add expertise"
                        placeholder="Select an expertise"
                        data={availableOptions}
                        searchable
                        nothingFoundMessage="No available expertises"
                        onChange={
                            addExpertise
                        }
                    />
                )}

                {/* Maximum */}
                {!canAddMore && (
                    <Text
                        size="sm"
                        c="dimmed"
                    >
                        A colonist can have a maximum
                        of 3 expertises.
                    </Text>
                )}

                {/* Error */}
                {error && (
                    <Text
                        c="red"
                        size="sm"
                    >
                        {error}
                    </Text>
                )}

                {/* Buttons */}
                <Group justify="flex-end">
                    {props.mode === "edit" &&
                        props.onClose && (
                            <Button
                                variant="subtle"
                                color="gray"
                                onClick={props.onClose}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                        )}

                    {props.mode === "edit" && (
                        <Button
                            color="mesa"
                            onClick={
                                saveExpertises
                            }
                            loading={saving}
                        >
                            Save Changes
                        </Button>
                    )}
                </Group>

                {/* Create mode form values */}
                {props.mode === "create" &&
                    editedExpertises.map(
                        (
                            expertise,
                            index
                        ) => (
                            <div
                                key={
                                    expertise.expertiseId
                                }
                            >
                                <input
                                    type="hidden"
                                    name={`expertiseId[${index}]`}
                                    value={
                                        expertise.expertiseId
                                    }
                                />

                                <input
                                    type="hidden"
                                    name={`expertiseLevel[${index}]`}
                                    value={
                                        expertise.level
                                    }
                                />
                            </div>
                        )
                    )}
            </Stack>
        </Card>
    );
}

function ExpertiseEditorRow({
    expertise,
    onLevelChange,
    onRemove,
}: {
    expertise: EditedExpertise;
    onLevelChange: (
        level: number
    ) => void;
    onRemove: () => void;
}) {
    return (
        <Stack gap="xs">

            {/* Name + skill */}
            <Group
                justify="space-between"
                align="flex-start"
            >
                <div>
                    <Text fw={500}>
                        {expertise.expertise.name}
                    </Text>

                    <Text
                        size="xs"
                        c="dimmed"
                    >
                        {expertise.expertise.skill.name}
                    </Text>
                </div>

                <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </Group>

            {/* Description */}
            {expertise.expertise.description && (
                <Text
                    size="sm"
                    c="dimmed"
                >
                    {expertise.expertise.description}
                </Text>
            )}

            {/* Level */}
            <NumberInput
                label="Level"
                value={expertise.level}
                onChange={(value) =>
                    onLevelChange(
                        typeof value ===
                            "number"
                            ? value
                            : 1
                    )
                }
                min={1}
                allowDecimal={false}
                w={100}
            />

            {/* Effects */}
            <Stack gap={3}>
                {(
                    expertise.expertise.effects ??
                    []
                ).map((effect) => {
                    const value =
                        effect.value *
                        expertise.level;

                    const formattedValue =
                        Number.isInteger(
                            value
                        )
                            ? value.toString()
                            : value.toFixed(2);

                    const prefix =
                        value >= 0
                            ? "+"
                            : "";

                    return (
                        <Group
                            key={effect.id}
                            justify="space-between"
                            gap="xs"
                        >
                            <Text size="sm">
                                {effect.name}
                            </Text>

                            <Text
                                size="sm"
                                fw={500}
                                style={{
                                    fontVariantNumeric:
                                        "tabular-nums",
                                }}
                            >
                                {prefix}
                                {formattedValue}
                                {effect.unit ?? ""}
                            </Text>
                        </Group>
                    );
                })}
            </Stack>
        </Stack>
    );
}
