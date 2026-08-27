"use client";

import {
    Button,
    Card,
    Group,
    NumberInput,
    Select,
    Stack,
    Switch,
    Text,
    Title,
} from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PassionIndicator from "./PassionIndicator";

type Passion =
    | "Apathy"
    | "None"
    | "Interested"
    | "Burning"
    | "Natural"
    | "Critical";

export type Skill = {
    id: number;
    skillId: number;
    colonistId: number;
    level: number;
    passion: Passion;
    isKnown: boolean;
    skill: {
        id: number;
        name: string;
    };
};

export type CreateSkill = {
    skillId: number;
    level: number;
    passion: Passion;
    isKnown: boolean;
    skill: {
        id: number;
        name: string;
    };
};

type SkillsEditorProps =
    | {
        mode: "edit";
        colonistId: number;
        skills: Skill[];
        onClose?: () => void;
    }
    | {
        mode: "create";
        skills: CreateSkill[];
    };

const passionOptions = [
    {
        value: "Apathy",
        label: "Apathy",
    },
    {
        value: "None",
        label: "None",
    },
    {
        value: "Interested",
        label: "Interested",
    },
    {
        value: "Burning",
        label: "Burning",
    },
    {
        value: "Natural",
        label: "Natural",
    },
    {
        value: "Critical",
        label: "Critical",
    },
];

export default function SkillsEditor(
    props: SkillsEditorProps
) {
    const router = useRouter();

    const initialSkills = props.skills.map((skill) => ({
        ...skill,
    }));

    const [editedSkills, setEditedSkills] =
        useState(initialSkills);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);
    const allSkillsUnknown = editedSkills.every(
        (skill) => !skill.isKnown
    );

    function updateSkill(
        skillId: number,
        updates: Partial<Skill | CreateSkill>
    ) {
        setEditedSkills((current) =>
            current.map((skill) =>
                skill.skillId === skillId
                    ? {
                        ...skill,
                        ...updates,
                    }
                    : skill
            )
        );
    }
    function setAllSkillsKnown(isKnown: boolean) {
        setEditedSkills((current) =>
            current.map((skill) => ({
                ...skill,
                isKnown,
            }))
        );
    }

    async function saveSkills() {
        if (props.mode !== "edit") {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/colonists/${props.colonistId}/skills`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        skills:
                            editedSkills.map(
                                (skill) => ({
                                    skillId:
                                        skill.skillId,
                                    level:
                                        skill.level,
                                    passion:
                                        skill.passion,
                                    isKnown:
                                        skill.isKnown,
                                })
                            ),
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to save skills."
                );
            }

            props.onClose?.();
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to save skills."
            );
        } finally {
            setSaving(false);
        }
    }

    const leftSkills =
        editedSkills.slice(0, 6);

    const rightSkills =
        editedSkills.slice(6, 12);

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
                            ? "Edit Skills"
                            : "Skills"}
                    </Title>

                    <Text
                        c="dimmed"
                        size="sm"
                        mt={2}
                    >
                        {props.mode === "edit"
                            ? "Update this colonist's skill levels, passions, and known skills."
                            : "Set this colonist's skill levels, passions, and known skills."}
                    </Text>
                </div>

                {/* Skills */}
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={500}>
                            Skill Knowledge
                        </Text>

                        <Group gap="xs">
                            <Button
                                variant="subtle"
                                color={allSkillsUnknown ? "mesa" : "gray"}
                                size="xs"
                                onClick={() => setAllSkillsKnown(allSkillsUnknown)}
                            >
                                {allSkillsUnknown
                                    ? "Mark All Known"
                                    : "Mark All Unknown"}
                            </Button>
                        </Group>
                    </Group>

                    <Group
                        grow
                        align="flex-start"
                    >
                        <Stack gap="lg">
                            {leftSkills.map(
                                (skill, index) => (
                                    <SkillEditorRow
                                        key={skill.skillId}
                                        skill={skill}
                                        onChange={(updates) =>
                                            updateSkill(
                                                skill.skillId,
                                                updates
                                            )
                                        }
                                        fieldIndex={index}
                                        mode={props.mode}
                                    />
                                )
                            )}
                        </Stack>

                        <Stack gap="lg">
                            {rightSkills.map(
                                (skill, index) => (
                                    <SkillEditorRow
                                        key={skill.skillId}
                                        skill={skill}
                                        onChange={(updates) =>
                                            updateSkill(
                                                skill.skillId,
                                                updates
                                            )
                                        }
                                        fieldIndex={index + 6}
                                        mode={props.mode}
                                    />
                                )
                            )}
                        </Stack>
                    </Group>
                </Stack>

                {/* Error */}
                {error && (
                    <Text
                        c="red"
                        size="sm"
                    >
                        {error}
                    </Text>
                )}

                {/* Edit buttons */}
                {props.mode === "edit" && (
                    <Group justify="flex-end">
                        {props.onClose && (
                            <Button
                                variant="subtle"
                                color="gray"
                                onClick={
                                    props.onClose
                                }
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                        )}

                        <Button
                            color="mesa"
                            onClick={
                                saveSkills
                            }
                            loading={saving}
                        >
                            Save Skills
                        </Button>
                    </Group>
                )}
            </Stack>
        </Card>
    );
}

function SkillEditorRow({
    skill,
    onChange,
    fieldIndex,
    mode,
}: {
    skill: Skill | CreateSkill;
    onChange: (
        updates: Partial<Skill | CreateSkill>
    ) => void;
    fieldIndex: number;
    mode: "edit" | "create";
}) {
    return (
        <Stack gap="xs">
            {/* Skill name */}
            <Text fw={500}>
                {skill.skill.name}
            </Text>

            {/* Controls */}
            <Group
                gap="xs"
                wrap="nowrap"
            >
                <NumberInput
                    value={skill.level}
                    onChange={(value) =>
                        onChange({
                            level:
                                typeof value ===
                                    "number"
                                    ? value
                                    : 0,
                        })
                    }
                    min={0}
                    max={40}
                    allowDecimal={false}
                    w={75}
                />

                <Select
                    data={passionOptions}
                    value={skill.passion}
                    onChange={(value) =>
                        onChange({
                            passion:
                                (value ??
                                    "None") as Passion,
                        })
                    }
                    renderOption={({
                        option,
                    }) => (
                        <Group
                            gap="xs"
                            wrap="nowrap"
                        >
                            <PassionIndicator
                                passion={
                                    option.value as Passion
                                }
                            />

                            <Text size="sm">
                                {option.label}
                            </Text>
                        </Group>
                    )}
                    w={150}
                />

                <Switch
                    checked={
                        skill.isKnown
                    }
                    onChange={(event) =>
                        onChange({
                            isKnown:
                                event
                                    .currentTarget
                                    .checked,
                        })
                    }
                    label="Known"
                />
            </Group>

            {/* Create mode form values */}
            {mode === "create" && (
                <>
                    <input
                        type="hidden"
                        name="skillId[]"
                        value={skill.skillId}
                    />

                    <input
                        type="hidden"
                        name="skillLevel[]"
                        value={skill.level}
                    />

                    <input
                        type="hidden"
                        name="skillPassion[]"
                        value={skill.passion}
                    />

                    <input
                        type="hidden"
                        name="skillIsKnown[]"
                        value={
                            skill.isKnown
                                ? "true"
                                : "false"
                        }
                    />
                </>
            )}
        </Stack>
    );
}
