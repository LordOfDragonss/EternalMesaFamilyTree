"use client";

import { useMemo, useState } from "react";
import {
    Avatar,
    Badge,
    Card,
    Group,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from "@mantine/core";

type Ancestor = {
    id: number;
    generation: number;
};

type CompatibilityColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    title: string | null;
    gender: "Male" | "Female";
    imageURL: string | null;

    legacy: {
        name: string;
        color: string | null;
    } | null;

    isPartnered: boolean;
    ancestors: Ancestor[];
};

type Props = {
    colonists: CompatibilityColonist[];
};

function getColonistName(colonist: CompatibilityColonist) {
    const nickname = colonist.nickname
        ? ` "${colonist.nickname}"`
        : "";

    return `${colonist.firstName}${nickname} ${colonist.lastName}`;
}

/*
 * Returns true if the two colonists share an ancestor
 * within three generations of BOTH colonists.
 *
 * This excludes siblings, first cousins, second cousins,
 * and closer relationships.
 */
function areTooCloselyRelated(
    first: CompatibilityColonist,
    second: CompatibilityColonist
) {
    const firstAncestors = new Map(
        first.ancestors.map((ancestor) => [
            ancestor.id,
            ancestor.generation,
        ])
    );

    return second.ancestors.some((ancestor) => {
        const firstGeneration = firstAncestors.get(ancestor.id);

        return (
            firstGeneration !== undefined &&
            firstGeneration <= 3 &&
            ancestor.generation <= 3
        );
    });
}

export default function CompatibilityFinder({
    colonists,
}: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(
        null
    );

    const selectedColonist = colonists.find(
        (colonist) => colonist.id.toString() === selectedId
    );

    const eligibleColonists = useMemo(() => {
        if (!selectedColonist) {
            return [];
        }

        return colonists
            .filter((candidate) => {
                if (candidate.id === selectedColonist.id) {
                    return false;
                }

                // Colonists are assumed straight for now,
                // so only the opposite gender is eligible.
                if (candidate.gender === selectedColonist.gender) {
                    return false;
                }

                if (candidate.isPartnered) {
                    return false;
                }

                if (
                    areTooCloselyRelated(
                        selectedColonist,
                        candidate
                    )
                ) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                const lastNameComparison =
                    a.lastName.localeCompare(b.lastName);

                if (lastNameComparison !== 0) {
                    return lastNameComparison;
                }

                return a.firstName.localeCompare(b.firstName);
            });
    }, [colonists, selectedColonist]);

const selectOptions = colonists
    .filter((colonist) => !colonist.isPartnered)
    .map((colonist) => ({
        value: colonist.id.toString(),
        label: getColonistName(colonist),
    }));

    return (
        <Stack gap="xl">
            {/* Header */}
            <div>
                <Title order={1}>
                    Colonist Compatibility
                </Title>

                <Text c="dimmed" mt={2}>
                    Find available matches while excluding close
                    biological relatives.
                </Text>
            </div>

            {/* Selection */}
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                bg="#161616"
                style={{
                    borderColor: "#292929",
                }}
            >
                <Stack gap="md">
                    <div>
                        <Title order={3}>
                            Select a colonist
                        </Title>

                        <Text
                            c="dimmed"
                            size="sm"
                            mt={2}
                        >
                            Choose a living colonist to find potential
                            partners for.
                        </Text>
                    </div>

                    <Select
                        label="Colonist"
                        placeholder="Choose a colonist..."
                        data={selectOptions}
                        value={selectedId}
                        onChange={setSelectedId}
                        searchable
                        clearable
                        nothingFoundMessage="No colonists found"
                        renderOption={({ option }) => {
                            const colonist = colonists.find(
                                (colonist) =>
                                    colonist.id.toString() ===
                                    option.value
                            );

                            return (
                                <Text
                                    style={{
                                        color:
                                            colonist?.legacy
                                                ?.color ??
                                            undefined,
                                    }}
                                >
                                    {option.label}
                                </Text>
                            );
                        }}
                    />

                    <Text size="xs" c="dimmed">
                        Current Lovers and Married colonists are
                        excluded. Former partners are allowed.
                    </Text>
                </Stack>
            </Card>

            {/* Selected colonist */}
            {selectedColonist && (
                <Card
                    component="a"
                    href={`/colonists/${selectedColonist.id}`}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor:
                            selectedColonist.legacy?.color ??
                            "#292929",
                        textDecoration: "none",
                        color: "inherit",
                        transition:
                            "transform 120ms ease, background-color 120ms ease",
                    }}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.transform =
                            "translateY(-2px)";
                        event.currentTarget.style.backgroundColor =
                            "#1C1C1C";
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.transform =
                            "translateY(0)";
                        event.currentTarget.style.backgroundColor =
                            "#161616";
                    }}
                >
                    <Group wrap="nowrap">
                        <Avatar
                            src={
                                selectedColonist.imageURL
                                    ? `/api/images/${selectedColonist.imageURL}`
                                    : null
                            }
                            size={72}
                            radius="md"
                        >
                            {selectedColonist.firstName
                                .charAt(0)
                                .toUpperCase()}
                        </Avatar>

                        <Stack gap={3}>
                            <Text fw={600} size="lg">
                                {getColonistName(
                                    selectedColonist
                                )}
                            </Text>

                            {selectedColonist.title && (
                                <Text
                                    size="sm"
                                    c="dimmed"
                                >
                                    {selectedColonist.title}
                                </Text>
                            )}

                            {selectedColonist.legacy && (
                                <Text
                                    size="sm"
                                    fw={500}
                                    style={{
                                        color:
                                            selectedColonist
                                                .legacy.color ??
                                            undefined,
                                    }}
                                >
                                    {
                                        selectedColonist
                                            .legacy.name
                                    }
                                </Text>
                            )}
                        </Stack>
                    </Group>
                </Card>
            )}

            {/* Results */}
            {selectedColonist && (
                <Stack gap="md">
                    <Group
                        justify="space-between"
                        align="center"
                    >
                        <div>
                            <Title order={2}>
                                Potential Matches
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Available living colonists with no
                                close biological relation.
                            </Text>
                        </div>

                        <Badge
                            color="orange"
                            size="lg"
                        >
                            {eligibleColonists.length}{" "}
                            {eligibleColonists.length === 1
                                ? "match"
                                : "matches"}
                        </Badge>
                    </Group>

                    {eligibleColonists.length === 0 ? (
                        <Card
                            padding="lg"
                            radius="md"
                            withBorder
                            bg="#161616"
                            style={{
                                borderColor: "#292929",
                            }}
                        >
                            <Text c="dimmed">
                                No eligible matches found.
                            </Text>
                        </Card>
                    ) : (
                        <SimpleGrid
                            cols={{
                                base: 1,
                                sm: 2,
                                md: 3,
                            }}
                            spacing="md"
                        >
                            {eligibleColonists.map(
                                (colonist) => (
                                    <Card
                                        key={colonist.id}
                                        component="a"
                                        href={`/colonists/${colonist.id}`}
                                        shadow="sm"
                                        padding="md"
                                        radius="md"
                                        withBorder
                                        bg="#161616"
                                        style={{
                                            borderColor:
                                                colonist
                                                    .legacy
                                                    ?.color ??
                                                "#292929",
                                            textDecoration:
                                                "none",
                                            color: "inherit",
                                            transition:
                                                "transform 120ms ease, background-color 120ms ease",
                                        }}
                                        onMouseEnter={(event) => {
                                            event.currentTarget.style.transform =
                                                "translateY(-2px)";
                                            event.currentTarget.style.backgroundColor =
                                                "#1C1C1C";
                                        }}
                                        onMouseLeave={(event) => {
                                            event.currentTarget.style.transform =
                                                "translateY(0)";
                                            event.currentTarget.style.backgroundColor =
                                                "#161616";
                                        }}
                                    >
                                        <Group
                                            align="center"
                                            wrap="nowrap"
                                        >
                                            <Avatar
                                                src={
                                                    colonist.imageURL
                                                        ? `/api/images/${colonist.imageURL}`
                                                        : null
                                                }
                                                size={64}
                                                radius="md"
                                            >
                                                {colonist.firstName
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </Avatar>

                                            <Stack gap={3}>
                                                <Text
                                                    fw={600}
                                                    style={{
                                                        color:
                                                            colonist
                                                                .legacy
                                                                ?.color ??
                                                            "var(--mantine-color-mesa-6)",
                                                    }}
                                                >
                                                    {getColonistName(
                                                        colonist
                                                    )}
                                                </Text>

                                                {colonist.title && (
                                                    <Text
                                                        size="sm"
                                                        c="dimmed"
                                                    >
                                                        {
                                                            colonist.title
                                                        }
                                                    </Text>
                                                )}

                                                {colonist.legacy && (
                                                    <Text
                                                        size="xs"
                                                        style={{
                                                            color:
                                                                colonist
                                                                    .legacy
                                                                    .color ??
                                                                undefined,
                                                        }}
                                                        c={
                                                            colonist
                                                                .legacy
                                                                .color
                                                                ? undefined
                                                                : "dimmed"
                                                        }
                                                    >
                                                        {
                                                            colonist
                                                                .legacy
                                                                .name
                                                        }
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Group>
                                    </Card>
                                )
                            )}
                        </SimpleGrid>
                    )}
                </Stack>
            )}

            {!selectedColonist && (
                <Text
                    c="dimmed"
                    ta="center"
                    py="xl"
                >
                    Select a colonist above to find potential
                    matches.
                </Text>
            )}
        </Stack>
    );
}