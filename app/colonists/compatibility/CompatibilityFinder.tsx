"use client";

import { useMemo, useState } from "react";
import {
    ActionIcon,
    Avatar,
    Badge,
    Card,
    Group,
    Menu,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    Crown,
    MapPin,
    Orbit,
    Users,
    CircleX,
    Ban
} from "lucide-react";

type Ancestor = {
    id: number;
    generation: number;
};

type CompatibilityGroup = {
    id: number;
    name: string;
};

type CompatibilityLocation = {
    id: number;
    name: string;
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

    groups: CompatibilityGroup[];
    locations: CompatibilityLocation[];

    isPartnered: boolean;
    ancestors: Ancestor[];
};

type Props = {
    colonists: CompatibilityColonist[];
};

function getColonistName(
    colonist: CompatibilityColonist
) {
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
        const firstGeneration = firstAncestors.get(
            ancestor.id
        );

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
    const [selectedId, setSelectedId] = useState<
        string | null
    >(null);

    const [excludedColonists, setExcludedColonists] =
        useState<Set<number>>(new Set());

    const [excludedLegacies, setExcludedLegacies] =
        useState<Set<string>>(new Set());

    const [excludedGroups, setExcludedGroups] =
        useState<Set<number>>(new Set());

    const [excludedLocations, setExcludedLocations] =
        useState<Set<number>>(new Set());

    const selectedColonist = colonists.find(
        (colonist) =>
            colonist.id.toString() === selectedId
    );

    function addColonistExclusion(id: number) {
        setExcludedColonists((current) => {
            const next = new Set(current);
            next.add(id);
            return next;
        });
    }

    function addLegacyExclusion(name: string) {
        setExcludedLegacies((current) => {
            const next = new Set(current);
            next.add(name);
            return next;
        });
    }

    function addGroupExclusion(id: number) {
        setExcludedGroups((current) => {
            const next = new Set(current);
            next.add(id);
            return next;
        });
    }

    function addLocationExclusion(id: number) {
        setExcludedLocations((current) => {
            const next = new Set(current);
            next.add(id);
            return next;
        });
    }

    function removeColonistExclusion(id: number) {
        setExcludedColonists((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
        });
    }

    function removeLegacyExclusion(name: string) {
        setExcludedLegacies((current) => {
            const next = new Set(current);
            next.delete(name);
            return next;
        });
    }

    function removeGroupExclusion(id: number) {
        setExcludedGroups((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
        });
    }

    function removeLocationExclusion(id: number) {
        setExcludedLocations((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
        });
    }

    function clearAllExclusions() {
        setExcludedColonists(new Set());
        setExcludedLegacies(new Set());
        setExcludedGroups(new Set());
        setExcludedLocations(new Set());
    }

    const exclusionCount =
        excludedColonists.size +
        excludedLegacies.size +
        excludedGroups.size +
        excludedLocations.size;

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
                if (
                    candidate.gender ===
                    selectedColonist.gender
                ) {
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

                // Session exclusions
                if (
                    excludedColonists.has(candidate.id)
                ) {
                    return false;
                }

                if (
                    candidate.legacy &&
                    excludedLegacies.has(
                        candidate.legacy.name
                    )
                ) {
                    return false;
                }

                if (
                    candidate.groups.some((group) =>
                        excludedGroups.has(group.id)
                    )
                ) {
                    return false;
                }

                if (
                    candidate.locations.some((location) =>
                        excludedLocations.has(location.id)
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

                return a.firstName.localeCompare(
                    b.firstName
                );
            });
    }, [
        colonists,
        selectedColonist,
        excludedColonists,
        excludedLegacies,
        excludedGroups,
        excludedLocations,
    ]);

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
                    Find available matches while excluding
                    close biological relatives.
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
                            Choose a living colonist to find
                            potential partners for.
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
                            const colonist =
                                colonists.find(
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

            {/* Active session exclusions */}
            {selectedColonist &&
                exclusionCount > 0 && (
                    <Card
                        shadow="sm"
                        padding="md"
                        radius="md"
                        withBorder
                        bg="#161616"
                        style={{
                            borderColor: "#292929",
                        }}
                    >
                        <Stack gap="sm">
                            <Group
                                justify="space-between"
                                align="center"
                            >
                                <div>
                                    <Text fw={600}>
                                        Session exclusions
                                    </Text>

                                    <Text
                                        size="xs"
                                        c="dimmed"
                                    >
                                        These exclusions only apply
                                        while this finder page is open.
                                    </Text>
                                </div>

                                <Text
                                    component="button"
                                    size="xs"
                                    fw={500}
                                    onClick={
                                        clearAllExclusions
                                    }
                                    style={{
                                        background: "none",
                                        border: 0,
                                        padding: 0,
                                        cursor: "pointer",
                                        color: "var(--mantine-color-mesa-6)",
                                    }}
                                >
                                    Clear all
                                </Text>
                            </Group>

                            <Group gap="xs">
                                {Array.from(
                                    excludedColonists
                                ).map((id) => {
                                    const colonist =
                                        colonists.find(
                                            (colonist) =>
                                                colonist.id ===
                                                id
                                        );

                                    if (!colonist) {
                                        return null;
                                    }

                                    return (
                                        <Badge
                                            key={`colonist-${id}`}
                                            variant="light"
                                            color="gray"
                                            rightSection={
                                                <ActionIcon
                                                    size="xs"
                                                    variant="subtle"
                                                    color="gray"
                                                    onClick={() =>
                                                        removeColonistExclusion(
                                                            id
                                                        )
                                                    }
                                                    aria-label={`Remove exclusion for ${getColonistName(colonist)}`}
                                                >
                                                    <CircleX
                                                        size={
                                                            12
                                                        }
                                                    />
                                                </ActionIcon>
                                            }
                                        >
                                            {getColonistName(
                                                colonist
                                            )}
                                        </Badge>
                                    );
                                })}

                                {Array.from(
                                    excludedLegacies
                                ).map((legacy) => (
                                    <Badge
                                        key={`legacy-${legacy}`}
                                        variant="light"
                                        color="mesa"
                                        leftSection={
                                            <Crown size={12} />
                                        }
                                        rightSection={
                                            <ActionIcon
                                                size="xs"
                                                variant="subtle"
                                                color="mesa"
                                                onClick={() =>
                                                    removeLegacyExclusion(legacy)
                                                }
                                                aria-label={`Remove ${legacy} exclusion`}
                                            >
                                                <CircleX size={12} />
                                            </ActionIcon>
                                        }
                                    >
                                        Legacy: {legacy}
                                    </Badge>
                                ))}

                                {Array.from(
                                    excludedGroups
                                ).map((id) => {
                                    const group =
                                        colonists
                                            .flatMap(
                                                (colonist) =>
                                                    colonist.groups
                                            )
                                            .find(
                                                (group) =>
                                                    group.id ===
                                                    id
                                            );

                                    if (!group) {
                                        return null;
                                    }

                                    return (
                                        <Badge
                                            key={`group-${id}`}
                                            variant="light"
                                            color="gray"
                                            leftSection={
                                                <Orbit size={12} />
                                            }
                                            rightSection={
                                                <ActionIcon
                                                    size="xs"
                                                    variant="subtle"
                                                    color="gray"
                                                    onClick={() =>
                                                        removeGroupExclusion(id)
                                                    }
                                                    aria-label={`Remove ${group.name} exclusion`}
                                                >
                                                    <CircleX size={12} />
                                                </ActionIcon>
                                            }
                                        >
                                            {group.name}
                                        </Badge>
                                    );
                                })}

                                {Array.from(
                                    excludedLocations
                                ).map((id) => {
                                    const location =
                                        colonists
                                            .flatMap(
                                                (colonist) =>
                                                    colonist.locations
                                            )
                                            .find(
                                                (location) =>
                                                    location.id ===
                                                    id
                                            );

                                    if (!location) {
                                        return null;
                                    }

                                    return (
                                        <Badge
                                            key={`location-${id}`}
                                            variant="light"
                                            color="gray"
                                            leftSection={
                                                <MapPin
                                                    size={12}
                                                />
                                            }
                                            rightSection={
                                                <ActionIcon
                                                    size="xs"
                                                    variant="subtle"
                                                    color="gray"
                                                    onClick={() =>
                                                        removeLocationExclusion(
                                                            id
                                                        )
                                                    }
                                                    aria-label={`Remove ${location.name} exclusion`}
                                                >
                                                    <CircleX
                                                        size={
                                                            12
                                                        }
                                                    />
                                                </ActionIcon>
                                            }
                                        >
                                            {location.name}
                                        </Badge>
                                    );
                                })}
                            </Group>
                        </Stack>
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
                                        <Stack gap="md">
                                            <a
                                                href={`/colonists/${colonist.id}`}
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: "0.75rem",
                                                    textDecoration:
                                                        "none",
                                                    color: "inherit",
                                                }}
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
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </Avatar>

                                                <Stack
                                                    gap={3}
                                                    style={{
                                                        minWidth: 0,
                                                    }}
                                                >
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
                                            </a>

                                            {/* Card actions */}
                                            <Group
                                                justify="flex-end"
                                                gap="xs"
                                            >
                                                <Menu
                                                    shadow="md"
                                                    width={230}
                                                    position="bottom-end"
                                                >
                                                    <Menu.Target>
                                                        <Tooltip label="Exclude">
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                aria-label={`Exclude ${getColonistName(colonist)}`}
                                                            >
                                                                <Ban
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Menu.Target>

                                                    <Menu.Dropdown>
                                                        <Menu.Label>Exclude from this session</Menu.Label>

                                                        <Menu.Item
                                                            leftSection={<Users size={16} />}
                                                            onClick={() => addColonistExclusion(colonist.id)}
                                                        >
                                                            This colonist
                                                        </Menu.Item>

                                                        {colonist.legacy && (
                                                            <Menu.Item
                                                                leftSection={
                                                                    <Crown
                                                                        size={16}
                                                                        color={colonist.legacy.color ?? undefined}
                                                                    />
                                                                }
                                                                onClick={() =>
                                                                    addLegacyExclusion(colonist.legacy!.name)
                                                                }
                                                            >
                                                                <span
                                                                    style={{
                                                                        color: colonist.legacy.color ?? undefined,
                                                                    }}
                                                                >
                                                                    Legacy: {colonist.legacy.name}
                                                                </span>
                                                            </Menu.Item>
                                                        )}

                                                        {colonist.groups.length > 0 &&
                                                            colonist.groups.map((group) => (
                                                                <Menu.Item
                                                                    key={`group-${group.id}`}
                                                                    leftSection={<Orbit size={16} />}
                                                                    onClick={() => addGroupExclusion(group.id)}
                                                                >
                                                                    Group: {group.name}
                                                                </Menu.Item>
                                                            ))}

                                                        {colonist.locations.length > 0 &&
                                                            colonist.locations.map((location) => (
                                                                <Menu.Item
                                                                    key={`location-${location.id}`}
                                                                    leftSection={<MapPin size={16} />}
                                                                    onClick={() => addLocationExclusion(location.id)}
                                                                >
                                                                    Location: {location.name}
                                                                </Menu.Item>
                                                            ))}
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </Stack>
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