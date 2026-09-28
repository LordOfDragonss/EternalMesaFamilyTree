"use client";

import {
    Accordion,
    ActionIcon,
    Badge,
    Card,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    ChevronRight,
    ExternalLink,
    HeartHandshake,
    Crown,
} from "lucide-react";
import { useState } from "react";

type LegacyTrackerMember = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    isDead: boolean;
    imageURL: string | null;
    children: {
        id: number;
    }[];
    partnerARelationships: {
        id: number;
    }[];
    partnerBRelationships: {
        id: number;
    }[];
};

type LegacyTrackerLegacy = {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    trackForSuccession: boolean;
    members: LegacyTrackerMember[];
};

type LegacyTrackerProps = {
    legacies: LegacyTrackerLegacy[];
};

function getColonistName(colonist: LegacyTrackerMember) {
    return `${colonist.firstName}${colonist.nickname ? ` "${colonist.nickname}"` : ""
        } ${colonist.lastName}`;
}

function isLivingSingle(member: LegacyTrackerMember) {
    return (
        !member.isDead &&
        member.partnerARelationships.length === 0 &&
        member.partnerBRelationships.length === 0
    );
}

function getLivingMembers(legacy: LegacyTrackerLegacy) {
    return legacy.members.filter((member) => !member.isDead);
}

function getLivingSingles(legacy: LegacyTrackerLegacy) {
    return legacy.members.filter(isLivingSingle);
}

function getLivingAdultsWithChildren(legacy: LegacyTrackerLegacy) {
    return legacy.members.filter(
        (member) => !member.isDead && member.children.length > 0
    );
}

function getLivingAdultsWithoutChildren(legacy: LegacyTrackerLegacy) {
    return legacy.members.filter(
        (member) => !member.isDead && member.children.length === 0
    );
}

function getLegacySectionId(legacyId: number) {
    return `legacy-${legacyId}`;
}

type AttentionLegacy = {
    legacy: LegacyTrackerLegacy;
    priority: number;
    livingMembers: LegacyTrackerMember[];
    adultsWithoutChildren: LegacyTrackerMember[];
};

function getAttentionLegacies(
    legacies: LegacyTrackerLegacy[]
): AttentionLegacy[] {
    return legacies
        .filter((legacy) => legacy.trackForSuccession)
        .map((legacy) => {
            const livingMembers = getLivingMembers(legacy);
            const adultsWithoutChildren =
                getLivingAdultsWithoutChildren(legacy);

            if (livingMembers.length === 0) {
                return null;
            }

            // Priority 0:
            // Only one living adult remains and they have no
            // recorded children.
            if (
                livingMembers.length === 1 &&
                adultsWithoutChildren.length === 1
            ) {
                return {
                    legacy,
                    priority: 0,
                    livingMembers,
                    adultsWithoutChildren,
                };
            }

            // Priority 1:
            // Multiple living adults remain, but none have
            // recorded children.
            if (
                livingMembers.length > 1 &&
                adultsWithoutChildren.length === livingMembers.length
            ) {
                return {
                    legacy,
                    priority: 1,
                    livingMembers,
                    adultsWithoutChildren,
                };
            }

            // Priority 2:
            // Some living adults have children while others
            // do not.
            if (adultsWithoutChildren.length > 0) {
                return {
                    legacy,
                    priority: 2,
                    livingMembers,
                    adultsWithoutChildren,
                };
            }

            return null;
        })
        .filter(
            (item): item is AttentionLegacy => item !== null
        )
        .sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            if (
                a.adultsWithoutChildren.length !==
                b.adultsWithoutChildren.length
            ) {
                return (
                    b.adultsWithoutChildren.length -
                    a.adultsWithoutChildren.length
                );
            }

            return a.legacy.name.localeCompare(b.legacy.name);
        })
        .slice(0, 3);
}

export default function LegacyTracker({
    legacies,
}: LegacyTrackerProps) {
    const [openLegacyIds, setOpenLegacyIds] = useState<string[]>([]);

    const totalKnownAdults = legacies.reduce(
        (total, legacy) => total + legacy.members.length,
        0
    );

    const totalLivingAdults = legacies.reduce(
        (total, legacy) =>
            total +
            legacy.members.filter((member) => !member.isDead).length,
        0
    );

    const totalLivingSingles = legacies.reduce(
        (total, legacy) =>
            total +
            legacy.members.filter(isLivingSingle).length,
        0
    );

    const legaciesWithSingles = legacies.filter((legacy) =>
        legacy.members.some(isLivingSingle)
    );

    const legaciesWithOneLivingAdult = legacies.filter(
        (legacy) => getLivingMembers(legacy).length === 1
    );

    const legaciesWithNoLivingAdults = legacies.filter(
        (legacy) => getLivingMembers(legacy).length === 0
    );

    const legaciesWithNoRecordedChildren = legacies.filter(
        (legacy) => {
            const livingMembers = getLivingMembers(legacy);

            return (
                livingMembers.length > 0 &&
                livingMembers.every(
                    (member) => member.children.length === 0
                )
            );
        }
    );

    const attentionLegacies = getAttentionLegacies(legacies);

    function openLegacy(legacyId: number) {
        const value = String(legacyId);

        setOpenLegacyIds((current) =>
            current.includes(value)
                ? current
                : [...current, value]
        );

        requestAnimationFrame(() => {
            document
                .getElementById(getLegacySectionId(legacyId))
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        });
    }

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 1000,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <Stack gap="xl">
                <div>
                    <Group gap="xs" mb="xs">
                        <Crown size={28} />
                        <Title order={1}>Legacy Tracker</Title>
                    </Group>

                    <Text c="dimmed">
                        Track current adult representation, living singles,
                        and recorded family connections across the colony&apos;s
                        legacies.
                    </Text>
                </div>

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
                    <Stack gap="lg">
                        <div>
                            <Title order={3}>
                                Tracker Highlights
                            </Title>

                            <Text c="dimmed" size="sm">
                                Legacies with notable current situations in
                                the recorded adult population.
                            </Text>
                        </div>

                        {attentionLegacies.length > 0 && (
                            <div>
                                <Group
                                    justify="space-between"
                                    align="flex-end"
                                    mb="sm"
                                >
                                    <div>
                                        <Text fw={600}>
                                            Legacies requiring attention
                                        </Text>

                                        <Text
                                            size="xs"
                                            c="dimmed"
                                            mt={2}
                                        >
                                            Current succession situations to
                                            keep an eye on.
                                        </Text>
                                    </div>

                                    <Badge color="mesa">
                                        {attentionLegacies.length}
                                    </Badge>
                                </Group>

                                <SimpleGrid
                                    cols={{
                                        base: 1,
                                        sm: 3,
                                    }}
                                    spacing="sm"
                                >
                                    {attentionLegacies.map(
                                        ({
                                            legacy,
                                            priority,
                                            livingMembers,
                                            adultsWithoutChildren,
                                        }) => {
                                            let situation =
                                                "Living adult without recorded children";

                                            if (priority === 0) {
                                                situation =
                                                    "Only living adult has no recorded children";
                                            } else if (priority === 1) {
                                                situation =
                                                    "No living adults have recorded children";
                                            }

                                            return (
                                                <Card
                                                    key={legacy.id}
                                                    padding="md"
                                                    radius="md"
                                                    withBorder
                                                    bg="#111111"
                                                    style={{
                                                        borderColor:
                                                            legacy.color ??
                                                            "#292929",
                                                    }}
                                                >
                                                    <Stack gap="sm">
                                                        <Group
                                                            justify="space-between"
                                                            wrap="nowrap"
                                                        >
                                                            <Text
                                                                fw={600}
                                                                style={
                                                                    legacy.color
                                                                        ? {
                                                                            color: legacy.color,
                                                                        }
                                                                        : undefined
                                                                }
                                                            >
                                                                {legacy.name}
                                                            </Text>

                                                            <Tooltip label="Open legacy overview">
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color={
                                                                        legacy.color
                                                                            ? undefined
                                                                            : "mesa"
                                                                    }
                                                                    onClick={() =>
                                                                        openLegacy(
                                                                            legacy.id
                                                                        )
                                                                    }
                                                                    aria-label={`Open ${legacy.name} in legacy overview`}
                                                                >
                                                                    <ChevronRight
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Group>

                                                        <Text
                                                            size="sm"
                                                            c="dimmed"
                                                        >
                                                            {situation}
                                                        </Text>

                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                        >
                                                            {
                                                                livingMembers.length
                                                            }{" "}
                                                            living{" "}
                                                            {livingMembers.length ===
                                                                1
                                                                ? "adult"
                                                                : "adults"}{" "}
                                                            ·{" "}
                                                            {
                                                                adultsWithoutChildren.length
                                                            }{" "}
                                                            without recorded
                                                            children
                                                        </Text>
                                                    </Stack>
                                                </Card>
                                            );
                                        }
                                    )}
                                </SimpleGrid>
                            </div>
                        )}

                        <Accordion
                            multiple
                            variant="separated"
                        >
                            {legaciesWithOneLivingAdult.length > 0 && (
                                <Accordion.Item
                                    value="single-adult"
                                    style={{
                                        backgroundColor: "#111111",
                                        border: "1px solid #292929",
                                    }}
                                >
                                    <Accordion.Control>
                                        <Group
                                            justify="space-between"
                                            pr="sm"
                                        >
                                            <div>
                                                <Text fw={600}>
                                                    Single-adult legacies
                                                </Text>

                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    mt={2}
                                                >
                                                    Only one known living adult
                                                    is currently recorded.
                                                </Text>
                                            </div>

                                            <Badge color="mesa">
                                                {
                                                    legaciesWithOneLivingAdult.length
                                                }
                                            </Badge>
                                        </Group>
                                    </Accordion.Control>

                                    <Accordion.Panel>
                                        <Stack gap="md">
                                            {legaciesWithOneLivingAdult.map(
                                                (legacy) => {
                                                    const livingMember =
                                                        getLivingMembers(
                                                            legacy
                                                        )[0];

                                                    return (
                                                        <Card
                                                            key={legacy.id}
                                                            padding="md"
                                                            radius="md"
                                                            withBorder
                                                            bg="#161616"
                                                            style={{
                                                                borderColor:
                                                                    legacy.color ??
                                                                    "#292929",
                                                            }}
                                                        >
                                                            <Stack gap="sm">
                                                                <Group
                                                                    justify="space-between"
                                                                    wrap="nowrap"
                                                                >
                                                                    <div
                                                                        style={{
                                                                            minWidth: 0,
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            size="sm"
                                                                            fw={
                                                                                600
                                                                            }
                                                                            style={
                                                                                legacy.color
                                                                                    ? {
                                                                                        color: legacy.color,
                                                                                    }
                                                                                    : undefined
                                                                            }
                                                                        >
                                                                            {
                                                                                legacy.name
                                                                            }
                                                                        </Text>

                                                                        <Text
                                                                            size="xs"
                                                                            c="dimmed"
                                                                            mt={2}
                                                                        >
                                                                            Only
                                                                            known
                                                                            living
                                                                            adult
                                                                        </Text>
                                                                    </div>

                                                                    <Tooltip label="Open legacy overview">
                                                                        <ActionIcon
                                                                            variant="subtle"
                                                                            color={
                                                                                legacy.color
                                                                                    ? undefined
                                                                                    : "mesa"
                                                                            }
                                                                            onClick={() =>
                                                                                openLegacy(
                                                                                    legacy.id
                                                                                )
                                                                            }
                                                                            aria-label={`Open ${legacy.name} in legacy overview`}
                                                                        >
                                                                            <ChevronRight
                                                                                size={
                                                                                    18
                                                                                }
                                                                            />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                </Group>

                                                                <Card
                                                                    padding="sm"
                                                                    radius="md"
                                                                    withBorder
                                                                    bg="#111111"
                                                                    style={{
                                                                        borderColor:
                                                                            legacy.color ??
                                                                            "#292929",
                                                                    }}
                                                                >
                                                                    <Group
                                                                        justify="space-between"
                                                                        wrap="nowrap"
                                                                    >
                                                                        <a
                                                                            href={`/colonists/${livingMember.id}`}
                                                                            style={{
                                                                                textDecoration:
                                                                                    "none",
                                                                                minWidth: 0,
                                                                            }}
                                                                        >
                                                                            <Text
                                                                                fw={
                                                                                    500
                                                                                }
                                                                                c="white"
                                                                            >
                                                                                {getColonistName(
                                                                                    livingMember
                                                                                )}
                                                                            </Text>

                                                                            <Text
                                                                                size="xs"
                                                                                c="dimmed"
                                                                            >
                                                                                Only
                                                                                living
                                                                                adult
                                                                                in{" "}
                                                                                {
                                                                                    legacy.name
                                                                                }
                                                                            </Text>
                                                                        </a>

                                                                        <Tooltip label="Find compatible partner">
                                                                            <ActionIcon
                                                                                component="a"
                                                                                href={`/colonists/compatibility?colonistId=${livingMember.id}`}
                                                                                variant="subtle"
                                                                                color={
                                                                                    legacy.color
                                                                                        ? undefined
                                                                                        : "mesa"
                                                                                }
                                                                                aria-label={`Find compatible partner for ${getColonistName(
                                                                                    livingMember
                                                                                )}`}
                                                                            >
                                                                                <HeartHandshake
                                                                                    size={
                                                                                        20
                                                                                    }
                                                                                />
                                                                            </ActionIcon>
                                                                        </Tooltip>
                                                                    </Group>
                                                                </Card>
                                                            </Stack>
                                                        </Card>
                                                    );
                                                }
                                            )}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )}

                            {legaciesWithSingles.length > 0 && (
                                <Accordion.Item
                                    value="living-singles"
                                    style={{
                                        backgroundColor: "#111111",
                                        border: "1px solid #292929",
                                    }}
                                >
                                    <Accordion.Control>
                                        <Group
                                            justify="space-between"
                                            pr="sm"
                                        >
                                            <div>
                                                <Text fw={600}>
                                                    Living singles
                                                </Text>

                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    mt={2}
                                                >
                                                    Legacies with one or more
                                                    known living singles.
                                                </Text>
                                            </div>

                                            <Badge color="mesa">
                                                {legaciesWithSingles.length}
                                            </Badge>
                                        </Group>
                                    </Accordion.Control>

                                    <Accordion.Panel>
                                        <Stack gap="md">
                                            {legaciesWithSingles.map(
                                                (legacy) => {
                                                    const livingSingles =
                                                        getLivingSingles(
                                                            legacy
                                                        );

                                                    return (
                                                        <Card
                                                            key={legacy.id}
                                                            padding="md"
                                                            radius="md"
                                                            withBorder
                                                            bg="#161616"
                                                            style={{
                                                                borderColor:
                                                                    legacy.color ??
                                                                    "#292929",
                                                            }}
                                                        >
                                                            <Stack gap="sm">
                                                                <Group
                                                                    justify="space-between"
                                                                    wrap="nowrap"
                                                                >
                                                                    <div
                                                                        style={{
                                                                            minWidth: 0,
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            size="sm"
                                                                            fw={
                                                                                600
                                                                            }
                                                                            style={
                                                                                legacy.color
                                                                                    ? {
                                                                                        color: legacy.color,
                                                                                    }
                                                                                    : undefined
                                                                            }
                                                                        >
                                                                            {
                                                                                legacy.name
                                                                            }
                                                                        </Text>

                                                                        <Text
                                                                            size="xs"
                                                                            c="dimmed"
                                                                            mt={2}
                                                                        >
                                                                            {
                                                                                livingSingles.length
                                                                            }{" "}
                                                                            {livingSingles.length ===
                                                                                1
                                                                                ? "known living single"
                                                                                : "known living singles"}
                                                                        </Text>
                                                                    </div>

                                                                    <Tooltip label="Open legacy overview">
                                                                        <ActionIcon
                                                                            variant="subtle"
                                                                            color={
                                                                                legacy.color
                                                                                    ? undefined
                                                                                    : "mesa"
                                                                            }
                                                                            onClick={() =>
                                                                                openLegacy(
                                                                                    legacy.id
                                                                                )
                                                                            }
                                                                            aria-label={`Open ${legacy.name} in legacy overview`}
                                                                        >
                                                                            <ChevronRight
                                                                                size={
                                                                                    18
                                                                                }
                                                                            />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                </Group>

                                                                <Stack gap="xs">
                                                                    {livingSingles.map(
                                                                        (
                                                                            colonist
                                                                        ) => (
                                                                            <Card
                                                                                key={
                                                                                    colonist.id
                                                                                }
                                                                                padding="sm"
                                                                                radius="md"
                                                                                withBorder
                                                                                bg="#111111"
                                                                                style={{
                                                                                    borderColor:
                                                                                        legacy.color ??
                                                                                        "#292929",
                                                                                }}
                                                                            >
                                                                                <Group
                                                                                    justify="space-between"
                                                                                    wrap="nowrap"
                                                                                >
                                                                                    <a
                                                                                        href={`/colonists/${colonist.id}`}
                                                                                        style={{
                                                                                            textDecoration:
                                                                                                "none",
                                                                                            minWidth: 0,
                                                                                        }}
                                                                                    >
                                                                                        <Text
                                                                                            fw={
                                                                                                500
                                                                                            }
                                                                                            c="white"
                                                                                        >
                                                                                            {getColonistName(
                                                                                                colonist
                                                                                            )}
                                                                                        </Text>

                                                                                        <Text
                                                                                            size="xs"
                                                                                            c="dimmed"
                                                                                        >
                                                                                            Living
                                                                                            single
                                                                                        </Text>
                                                                                    </a>

                                                                                    <Tooltip label="Find compatible partner">
                                                                                        <ActionIcon
                                                                                            component="a"
                                                                                            href={`/colonists/compatibility?colonistId=${colonist.id}`}
                                                                                            variant="subtle"
                                                                                            color={
                                                                                                legacy.color
                                                                                                    ? undefined
                                                                                                    : "mesa"
                                                                                            }
                                                                                            aria-label={`Find compatible partner for ${getColonistName(
                                                                                                colonist
                                                                                            )}`}
                                                                                        >
                                                                                            <HeartHandshake
                                                                                                size={
                                                                                                    20
                                                                                                }
                                                                                            />
                                                                                        </ActionIcon>
                                                                                    </Tooltip>
                                                                                </Group>
                                                                            </Card>
                                                                        )
                                                                    )}
                                                                </Stack>
                                                            </Stack>
                                                        </Card>
                                                    );
                                                }
                                            )}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )}

                            {legaciesWithNoRecordedChildren.length > 0 && (
                                <Accordion.Item
                                    value="no-recorded-children"
                                    style={{
                                        backgroundColor: "#111111",
                                        border: "1px solid #292929",
                                    }}
                                >
                                    <Accordion.Control>
                                        <Group
                                            justify="space-between"
                                            pr="sm"
                                        >
                                            <div>
                                                <Text fw={600}>
                                                    Living adults with no
                                                    recorded children
                                                </Text>

                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    mt={2}
                                                >
                                                    Legacies where living
                                                    adults currently have no
                                                    child recorded in the
                                                    archive.
                                                </Text>
                                            </div>

                                            <Badge color="mesa">
                                                {
                                                    legaciesWithNoRecordedChildren.length
                                                }
                                            </Badge>
                                        </Group>
                                    </Accordion.Control>

                                    <Accordion.Panel>
                                        <Stack gap="md">
                                            {legaciesWithNoRecordedChildren.map(
                                                (legacy) => {
                                                    const adults =
                                                        getLivingAdultsWithoutChildren(
                                                            legacy
                                                        );

                                                    return (
                                                        <Card
                                                            key={legacy.id}
                                                            padding="md"
                                                            radius="md"
                                                            withBorder
                                                            bg="#161616"
                                                            style={{
                                                                borderColor:
                                                                    legacy.color ??
                                                                    "#292929",
                                                            }}
                                                        >
                                                            <Stack gap="sm">
                                                                <Group
                                                                    justify="space-between"
                                                                    wrap="nowrap"
                                                                >
                                                                    <div
                                                                        style={{
                                                                            minWidth: 0,
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            size="sm"
                                                                            fw={
                                                                                600
                                                                            }
                                                                            style={
                                                                                legacy.color
                                                                                    ? {
                                                                                        color: legacy.color,
                                                                                    }
                                                                                    : undefined
                                                                            }
                                                                        >
                                                                            {
                                                                                legacy.name
                                                                            }
                                                                        </Text>

                                                                        <Text
                                                                            size="xs"
                                                                            c="dimmed"
                                                                            mt={2}
                                                                        >
                                                                            {
                                                                                adults.length
                                                                            }{" "}
                                                                            living{" "}
                                                                            {adults.length ===
                                                                                1
                                                                                ? "adult"
                                                                                : "adults"}{" "}
                                                                            without
                                                                            recorded
                                                                            children
                                                                        </Text>
                                                                    </div>

                                                                    <Tooltip label="Open legacy overview">
                                                                        <ActionIcon
                                                                            variant="subtle"
                                                                            color={
                                                                                legacy.color
                                                                                    ? undefined
                                                                                    : "mesa"
                                                                            }
                                                                            onClick={() =>
                                                                                openLegacy(
                                                                                    legacy.id
                                                                                )
                                                                            }
                                                                            aria-label={`Open ${legacy.name} in legacy overview`}
                                                                        >
                                                                            <ChevronRight
                                                                                size={
                                                                                    18
                                                                                }
                                                                            />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                </Group>

                                                                <Stack gap="xs">
                                                                    {adults.map(
                                                                        (
                                                                            adult
                                                                        ) => (
                                                                            <Card
                                                                                key={
                                                                                    adult.id
                                                                                }
                                                                                padding="sm"
                                                                                radius="md"
                                                                                withBorder
                                                                                bg="#111111"
                                                                                style={{
                                                                                    borderColor:
                                                                                        legacy.color ??
                                                                                        "#292929",
                                                                                }}
                                                                            >
                                                                                <Group
                                                                                    justify="space-between"
                                                                                    wrap="nowrap"
                                                                                >
                                                                                    <a
                                                                                        href={`/colonists/${adult.id}`}
                                                                                        style={{
                                                                                            textDecoration:
                                                                                                "none",
                                                                                            minWidth: 0,
                                                                                        }}
                                                                                    >
                                                                                        <Text
                                                                                            fw={
                                                                                                500
                                                                                            }
                                                                                            c="white"
                                                                                        >
                                                                                            {getColonistName(
                                                                                                adult
                                                                                            )}
                                                                                        </Text>

                                                                                        <Text
                                                                                            size="xs"
                                                                                            c="dimmed"
                                                                                        >
                                                                                            No
                                                                                            recorded
                                                                                            children
                                                                                        </Text>
                                                                                    </a>

                                                                                    {isLivingSingle(
                                                                                        adult
                                                                                    ) && (
                                                                                            <Tooltip label="Find compatible partner">
                                                                                                <ActionIcon
                                                                                                    component="a"
                                                                                                    href={`/colonists/compatibility?colonistId=${adult.id}`}
                                                                                                    variant="subtle"
                                                                                                    color={
                                                                                                        legacy.color
                                                                                                            ? undefined
                                                                                                            : "mesa"
                                                                                                    }
                                                                                                    aria-label={`Find compatible partner for ${getColonistName(
                                                                                                        adult
                                                                                                    )}`}
                                                                                                >
                                                                                                    <HeartHandshake
                                                                                                        size={
                                                                                                            20
                                                                                                        }
                                                                                                    />
                                                                                                </ActionIcon>
                                                                                            </Tooltip>
                                                                                        )}
                                                                                </Group>
                                                                            </Card>
                                                                        )
                                                                    )}
                                                                </Stack>
                                                            </Stack>
                                                        </Card>
                                                    );
                                                }
                                            )}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )}

                            {legaciesWithNoLivingAdults.length > 0 && (
                                <Accordion.Item
                                    value="no-living-adults"
                                    style={{
                                        backgroundColor: "#111111",
                                        border: "1px solid #292929",
                                    }}
                                >
                                    <Accordion.Control>
                                        <Group
                                            justify="space-between"
                                            pr="sm"
                                        >
                                            <div>
                                                <Text fw={600}>
                                                    No known living adults
                                                </Text>

                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    mt={2}
                                                >
                                                    No living adults from these
                                                    legacies are currently
                                                    recorded.
                                                </Text>
                                            </div>

                                            <Badge color="mesa">
                                                {
                                                    legaciesWithNoLivingAdults.length
                                                }
                                            </Badge>
                                        </Group>
                                    </Accordion.Control>

                                    <Accordion.Panel>
                                        <Stack gap="xs">
                                            {legaciesWithNoLivingAdults.map(
                                                (legacy) => (
                                                    <Card
                                                        key={legacy.id}
                                                        padding="sm"
                                                        radius="md"
                                                        withBorder
                                                        bg="#161616"
                                                        style={{
                                                            borderColor:
                                                                legacy.color ??
                                                                "#292929",
                                                        }}
                                                    >
                                                        <Group
                                                            justify="space-between"
                                                            wrap="nowrap"
                                                        >
                                                            <div
                                                                style={{
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Text
                                                                    fw={600}
                                                                    style={
                                                                        legacy.color
                                                                            ? {
                                                                                color: legacy.color,
                                                                            }
                                                                            : undefined
                                                                    }
                                                                >
                                                                    {
                                                                        legacy.name
                                                                    }
                                                                </Text>

                                                                <Text
                                                                    size="xs"
                                                                    c="dimmed"
                                                                    mt={2}
                                                                >
                                                                    {
                                                                        legacy
                                                                            .members
                                                                            .length
                                                                    }{" "}
                                                                    known{" "}
                                                                    {legacy
                                                                        .members
                                                                        .length ===
                                                                        1
                                                                        ? "adult"
                                                                        : "adults"}
                                                                </Text>
                                                            </div>

                                                            <Tooltip label="Open legacy overview">
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color={
                                                                        legacy.color
                                                                            ? undefined
                                                                            : "mesa"
                                                                    }
                                                                    onClick={() =>
                                                                        openLegacy(
                                                                            legacy.id
                                                                        )
                                                                    }
                                                                    aria-label={`Open ${legacy.name} in legacy overview`}
                                                                >
                                                                    <ChevronRight
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Group>
                                                    </Card>
                                                )
                                            )}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )}
                        </Accordion>

                        <SimpleGrid
                            cols={{
                                base: 1,
                                xs: 2,
                                sm: 3,
                            }}
                        >
                            <Card
                                padding="md"
                                radius="md"
                                withBorder
                                bg="#111111"
                                style={{
                                    borderColor: "#292929",
                                }}
                            >
                                <Text size="sm" c="dimmed">
                                    Living singles
                                </Text>

                                <Text size="xl" fw={700}>
                                    {totalLivingSingles}
                                </Text>

                                <Text size="xs" c="dimmed" mt={2}>
                                    Across {legaciesWithSingles.length}{" "}
                                    {legaciesWithSingles.length === 1
                                        ? "legacy"
                                        : "legacies"}
                                </Text>
                            </Card>

                            <Card
                                padding="md"
                                radius="md"
                                withBorder
                                bg="#111111"
                                style={{
                                    borderColor: "#292929",
                                }}
                            >
                                <Text size="sm" c="dimmed">
                                    Living adults
                                </Text>

                                <Text size="xl" fw={700}>
                                    {totalLivingAdults}
                                </Text>

                                <Text size="xs" c="dimmed" mt={2}>
                                    Of {totalKnownAdults} known adults
                                </Text>
                            </Card>

                            <Card
                                padding="md"
                                radius="md"
                                withBorder
                                bg="#111111"
                                style={{
                                    borderColor: "#292929",
                                }}
                            >
                                <Text size="sm" c="dimmed">
                                    Single-adult legacies
                                </Text>

                                <Text size="xl" fw={700}>
                                    {legaciesWithOneLivingAdult.length}
                                </Text>

                                <Text size="xs" c="dimmed" mt={2}>
                                    One known living adult
                                </Text>
                            </Card>
                        </SimpleGrid>
                    </Stack>
                </Card>

                <div id="legacy-overview">
                    <Title order={2} mb={4}>
                        Legacy Overview
                    </Title>

                    <Text c="dimmed" size="sm" mb="lg">
                        Open a legacy to view its living adults, current
                        singles, and recorded family connections.
                    </Text>

                    <Accordion
                        multiple
                        variant="separated"
                        value={openLegacyIds}
                        onChange={setOpenLegacyIds}
                    >
                        {legacies.map((legacy) => {
                            const livingMembers =
                                getLivingMembers(legacy);

                            const livingSingles =
                                getLivingSingles(legacy);

                            const livingAdultsWithChildren =
                                getLivingAdultsWithChildren(
                                    legacy
                                );

                            const livingAdultsWithoutChildren =
                                getLivingAdultsWithoutChildren(
                                    legacy
                                );

                            const livingPartnered =
                                livingMembers.length -
                                livingSingles.length;

                            return (
                                <Accordion.Item
                                    key={legacy.id}
                                    value={String(legacy.id)}
                                    id={getLegacySectionId(legacy.id)}
                                    style={{
                                        backgroundColor: "#161616",
                                        border: `1px solid ${legacy.color ?? "#292929"
                                            }`,
                                        scrollMarginTop: "2rem",
                                    }}
                                >
                                    <Accordion.Control>
                                        <Group
                                            justify="space-between"
                                            pr="sm"
                                        >
                                            <div>
                                                <Text
                                                    fw={600}
                                                    style={
                                                        legacy.color
                                                            ? {
                                                                color: legacy.color,
                                                            }
                                                            : undefined
                                                    }
                                                >
                                                    {legacy.name}
                                                </Text>

                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    mt={2}
                                                >
                                                    {legacy.members.length}{" "}
                                                    known{" "}
                                                    {legacy.members.length ===
                                                        1
                                                        ? "adult"
                                                        : "adults"}{" "}
                                                    ·{" "}
                                                    {livingMembers.length}{" "}
                                                    living
                                                </Text>
                                            </div>

                                            {livingSingles.length > 0 && (
                                                <Badge
                                                    color={
                                                        legacy.color
                                                            ? undefined
                                                            : "mesa"
                                                    }
                                                    style={
                                                        legacy.color
                                                            ? {
                                                                backgroundColor:
                                                                    legacy.color,
                                                            }
                                                            : undefined
                                                    }
                                                >
                                                    {livingSingles.length}{" "}
                                                    {livingSingles.length ===
                                                        1
                                                        ? "single"
                                                        : "singles"}
                                                </Badge>
                                            )}
                                        </Group>
                                    </Accordion.Control>

                                    <Accordion.Panel>
                                        <Stack gap="lg">
                                            <Group
                                                justify="space-between"
                                                align="flex-start"
                                            >
                                                {legacy.description ? (
                                                    <Text
                                                        size="sm"
                                                        c="dimmed"
                                                        style={{
                                                            maxWidth: 700,
                                                        }}
                                                    >
                                                        {
                                                            legacy.description
                                                        }
                                                    </Text>
                                                ) : (
                                                    <div />
                                                )}

                                                <Tooltip label="Open legacy page">
                                                    <ActionIcon
                                                        component="a"
                                                        href={`/legacies/${legacy.id}`}
                                                        variant="subtle"
                                                        color={
                                                            legacy.color
                                                                ? undefined
                                                                : "mesa"
                                                        }
                                                        aria-label={`Open ${legacy.name} legacy page`}
                                                    >
                                                        <ExternalLink
                                                            size={18}
                                                        />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>

                                            <SimpleGrid
                                                cols={{
                                                    base: 2,
                                                    xs: 4,
                                                }}
                                            >
                                                <div>
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                    >
                                                        Known adults
                                                    </Text>

                                                    <Text fw={600}>
                                                        {
                                                            legacy.members
                                                                .length
                                                        }
                                                    </Text>
                                                </div>

                                                <div>
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                    >
                                                        Living
                                                    </Text>

                                                    <Text fw={600}>
                                                        {
                                                            livingMembers.length
                                                        }
                                                    </Text>
                                                </div>

                                                <div>
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                    >
                                                        Partnered
                                                    </Text>

                                                    <Text fw={600}>
                                                        {livingPartnered}
                                                    </Text>
                                                </div>

                                                <div>
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                    >
                                                        Singles
                                                    </Text>

                                                    <Text fw={600}>
                                                        {
                                                            livingSingles.length
                                                        }
                                                    </Text>
                                                </div>
                                            </SimpleGrid>

                                            <div>
                                                <Text
                                                    fw={600}
                                                    mb="sm"
                                                >
                                                    Living singles
                                                </Text>

                                                {livingSingles.length > 0 ? (
                                                    <Stack gap="xs">
                                                        {livingSingles.map(
                                                            (colonist) => (
                                                                <Card
                                                                    key={
                                                                        colonist.id
                                                                    }
                                                                    padding="sm"
                                                                    radius="md"
                                                                    withBorder
                                                                    bg="#111111"
                                                                    style={{
                                                                        borderColor:
                                                                            legacy.color ??
                                                                            "#292929",
                                                                    }}
                                                                >
                                                                    <Group
                                                                        justify="space-between"
                                                                        wrap="nowrap"
                                                                    >
                                                                        <a
                                                                            href={`/colonists/${colonist.id}`}
                                                                            style={{
                                                                                textDecoration:
                                                                                    "none",
                                                                                minWidth: 0,
                                                                            }}
                                                                        >
                                                                            <Text
                                                                                fw={
                                                                                    500
                                                                                }
                                                                                c="white"
                                                                            >
                                                                                {getColonistName(
                                                                                    colonist
                                                                                )}
                                                                            </Text>

                                                                            <Text
                                                                                size="xs"
                                                                                c="dimmed"
                                                                            >
                                                                                Living
                                                                                single
                                                                            </Text>
                                                                        </a>

                                                                        <Tooltip label="Find compatible partner">
                                                                            <ActionIcon
                                                                                component="a"
                                                                                href={`/colonists/compatibility?colonistId=${colonist.id}`}
                                                                                variant="subtle"
                                                                                color={
                                                                                    legacy.color
                                                                                        ? undefined
                                                                                        : "mesa"
                                                                                }
                                                                                aria-label={`Find compatible partner for ${getColonistName(
                                                                                    colonist
                                                                                )}`}
                                                                            >
                                                                                <HeartHandshake
                                                                                    size={
                                                                                        20
                                                                                    }
                                                                                />
                                                                            </ActionIcon>
                                                                        </Tooltip>
                                                                    </Group>
                                                                </Card>
                                                            )
                                                        )}
                                                    </Stack>
                                                ) : (
                                                    <Text
                                                        size="sm"
                                                        c="dimmed"
                                                    >
                                                        No living singles
                                                        currently recorded.
                                                    </Text>
                                                )}
                                            </div>

                                            <div>
                                                <Group
                                                    justify="space-between"
                                                    mb="sm"
                                                >
                                                    <Text fw={600}>
                                                        Family
                                                    </Text>

                                                    <Badge
                                                        variant="light"
                                                        color={
                                                            legacy.color
                                                                ? undefined
                                                                : "mesa"
                                                        }
                                                    >
                                                        {
                                                            livingAdultsWithChildren.length
                                                        }{" "}
                                                        with recorded children
                                                    </Badge>
                                                </Group>

                                                {livingAdultsWithChildren.length >
                                                    0 ? (
                                                    <Stack gap="xs">
                                                        {livingAdultsWithChildren.map(
                                                            (
                                                                adult
                                                            ) => (
                                                                <Card
                                                                    key={
                                                                        adult.id
                                                                    }
                                                                    padding="sm"
                                                                    radius="md"
                                                                    withBorder
                                                                    bg="#111111"
                                                                    style={{
                                                                        borderColor:
                                                                            legacy.color ??
                                                                            "#292929",
                                                                    }}
                                                                >
                                                                    <a
                                                                        href={`/colonists/${adult.id}`}
                                                                        style={{
                                                                            textDecoration:
                                                                                "none",
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            fw={
                                                                                500
                                                                            }
                                                                            c="white"
                                                                        >
                                                                            {getColonistName(
                                                                                adult
                                                                            )}
                                                                        </Text>

                                                                        <Text
                                                                            size="xs"
                                                                            c="dimmed"
                                                                        >
                                                                            {
                                                                                adult
                                                                                    .children
                                                                                    .length
                                                                            }{" "}
                                                                            recorded{" "}
                                                                            {adult
                                                                                .children
                                                                                .length ===
                                                                                1
                                                                                ? "child"
                                                                                : "children"}
                                                                        </Text>
                                                                    </a>
                                                                </Card>
                                                            )
                                                        )}
                                                    </Stack>
                                                ) : (
                                                    <Text
                                                        size="sm"
                                                        c="dimmed"
                                                    >
                                                        No living adults
                                                        currently have a child
                                                        recorded in the archive.
                                                    </Text>
                                                )}

                                                {livingAdultsWithoutChildren.length >
                                                    0 &&
                                                    livingAdultsWithChildren.length >
                                                    0 && (
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                            mt="sm"
                                                        >
                                                            {
                                                                livingAdultsWithoutChildren.length
                                                            }{" "}
                                                            living{" "}
                                                            {livingAdultsWithoutChildren.length ===
                                                                1
                                                                ? "adult has"
                                                                : "adults have"}{" "}
                                                            no recorded
                                                            children.
                                                        </Text>
                                                    )}
                                            </div>
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            );
                        })}
                    </Accordion>
                </div>
            </Stack>
        </main>
    );
}
