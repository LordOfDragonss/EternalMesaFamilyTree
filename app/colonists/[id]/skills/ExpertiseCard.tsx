"use client";

import {
    ActionIcon,
    Card,
    Group,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { Pencil } from "lucide-react";
import ExpertiseEditor, {
    type Expertise,
} from "./ExpertiseEditor";

export type ExpertiseEffect = {
    id: number;
    name: string;
    value: number;
    unit: string | null;
};

export type ColonistExpertise = {
    id: number;
    colonistSkillId: number;
    expertiseId: number;
    level: number;
    expertise: Expertise;
};

type ExpertiseCardProps = {
    colonistId: number;
    expertises: ColonistExpertise[];
    availableExpertises: Expertise[];
};

export default function ExpertiseCard({
    colonistId,
    expertises,
    availableExpertises,
}: ExpertiseCardProps) {
    const [editing, setEditing] =
        useState(false);

    if (editing) {
        return (
            <ExpertiseEditor
                mode="edit"
                colonistId={colonistId}
                expertises={expertises}
                availableExpertises={availableExpertises}
                onClose={() => setEditing(false)}
            />
        );
    }

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
                <Group
                    justify="space-between"
                    align="flex-start"
                >
                    <div>
                        <Title order={3}>
                            Expertises
                        </Title>

                        <Text
                            c="dimmed"
                            size="sm"
                            mt={2}
                        >
                            This colonist's areas of
                            expertise.
                        </Text>
                    </div>

                    <Tooltip label="Edit expertises">
                        <ActionIcon
                            variant="subtle"
                            color="mesa"
                            size="lg"
                            onClick={() =>
                                setEditing(true)
                            }
                            aria-label="Edit expertises"
                        >
                            <Pencil size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {/* Expertises */}
                {expertises.length === 0 ? (
                    <Text
                        c="dimmed"
                        size="sm"
                    >
                        This colonist has no expertises.
                    </Text>
                ) : (
                    <Stack gap="lg">
                        {expertises.map(
                            (expertise) => (
                                <ExpertiseRow
                                    key={
                                        expertise.id
                                    }
                                    expertise={
                                        expertise
                                    }
                                />
                            )
                        )}
                    </Stack>
                )}
            </Stack>
        </Card>
    );
}

function ExpertiseRow({
    expertise,
}: {
    expertise: ColonistExpertise;
}) {
    return (
        <Stack gap="xs">

            {/* Name + skill + level */}
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

                <Text
                    fw={600}
                    style={{
                        fontVariantNumeric:
                            "tabular-nums",
                    }}
                >
                    Level {expertise.level}
                </Text>
            </Group>

            {/* Description */}
            <Text
                size="sm"
                c="dimmed"
            >
                {expertise.expertise.description}
            </Text>

            {/* Effects */}
            <Stack gap={3}>
                {expertise.expertise.effects.map(
                    (effect) => {
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
                                    {
                                        formattedValue
                                    }
                                    {effect.unit ??
                                        ""}
                                </Text>
                            </Group>
                        );
                    }
                )}
            </Stack>
        </Stack>
    );
}