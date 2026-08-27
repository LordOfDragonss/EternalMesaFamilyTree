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
import SkillsEditor from "./SkillsEditor";
import { Pencil } from "lucide-react";
import PassionIndicator from "./PassionIndicator";

type Passion =
    | "Apathy"
    | "None"
    | "Interested"
    | "Burning"
    | "Natural"
    | "Critical";

type Skill = {
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

type SkillsCardProps = {
    colonistId: number;
    skills: Skill[];
};

export default function SkillsCard({
    colonistId,
    skills,
}: SkillsCardProps) {
    const [editing, setEditing] =
        useState(false);

    if (editing) {
        return (
            <SkillsEditor
                mode="edit"
                colonistId={colonistId}
                skills={skills}
                onClose={() => setEditing(false)}
            />
        );
    }

    const leftSkills =
        skills.slice(0, 6);

    const rightSkills =
        skills.slice(6, 12);

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
                            Skills
                        </Title>

                        <Text
                            c="dimmed"
                            size="sm"
                            mt={2}
                        >
                            This colonist's skills
                            and passions.
                        </Text>
                    </div>

                    <Tooltip label="Edit skills">
                        <ActionIcon
                            variant="subtle"
                            color="mesa"
                            size="lg"
                            onClick={() =>
                                setEditing(true)
                            }
                            aria-label="Edit skills"
                        >
                            <Pencil size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {/* Skills */}
                <Group
                    grow
                    align="flex-start"
                >
                    <Stack gap="lg">
                        {leftSkills.map(
                            (skill) => (
                                <SkillRow
                                    key={
                                        skill.skillId
                                    }
                                    skill={skill}
                                />
                            )
                        )}
                    </Stack>

                    <Stack gap="lg">
                        {rightSkills.map(
                            (skill) => (
                                <SkillRow
                                    key={
                                        skill.skillId
                                    }
                                    skill={skill}
                                />
                            )
                        )}
                    </Stack>
                </Group>
            </Stack>
        </Card>
    );
}

function SkillRow({
    skill,
}: {
    skill: Skill;
}) {
    const normalLevel = Math.min(
        skill.level,
        20
    );

    const extendedLevel = Math.max(
        skill.level - 20,
        0
    );

    const normalWidth =
        skill.isKnown
            ? Math.min(
                (normalLevel / 20) * 65,
                65
            )
            : 0;

    const extendedWidth =
        skill.isKnown
            ? Math.min(
                extendedLevel * 1.75,
                35
            )
            : 0;

    const isBeyondNormal =
        skill.level > 20;

    return (
        <Stack gap={5}>

            {/* Skill name */}
            <Text fw={500}>
                {skill.skill.name}
            </Text>

            {/* Level + passion */}
            <Group
                gap="xs"
                justify="flex-end"
            >
                {skill.isKnown && (
                    <PassionIndicator
                        passion={
                            skill.passion
                        }
                    />
                )}

                <Text
                    fw={600}
                    style={{
                        fontVariantNumeric:
                            "tabular-nums",
                    }}
                >
                    {skill.isKnown
                        ? skill.level
                        : "?"}
                </Text>
            </Group>

            {/* Skill bar */}
            <div
                style={{
                    width: "100%",
                    height: 8,
                    borderRadius: 999,
                    background:
                        "#292929",
                    overflow: "hidden",
                    display: "flex",
                    position:
                        "relative",
                }}
            >
                {/* Normal 0–20 */}
                <div
                    style={{
                        width: `${normalWidth}%`,
                        height: "100%",
                        background:
                            "var(--mantine-color-mesa-6)",
                        transition:
                            "width 200ms ease",
                    }}
                />

                {/* Exceptional 20+ */}
                {isBeyondNormal && (
                    <div
                        style={{
                            width: `${extendedWidth}%`,
                            height: "100%",
                            background:
                                "linear-gradient(90deg, var(--mantine-color-mesa-6), var(--mantine-color-orange-4), var(--mantine-color-yellow-4))",
                            boxShadow:
                                "0 0 8px rgba(255, 180, 70, 0.45)",
                            transition:
                                "width 200ms ease",
                        }}
                    />
                )}

                {/* Level 20 marker */}
                {isBeyondNormal && (
                    <div
                        style={{
                            position:
                                "absolute",
                            left: "65%",
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background:
                                "rgba(255, 255, 255, 0.35)",
                        }}
                    />
                )}
            </div>
        </Stack>
    );
}