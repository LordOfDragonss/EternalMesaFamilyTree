
"use client";

import {
    Accordion,
    Badge,
    Button,
    Card,
    Divider,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Blend, Heart } from "lucide-react";

import LegacyColorColonistSelect from "@/app/components/LegacyColorColonistSelect";

type CoupleColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    legacy: {
        color: string | null;
    } | null;
};

type CoupleBed = {
    bedId: number;
    bedName: string;
    locationName: string;
} | undefined;

type PotentialBed = {
    bedId: number;
    bedName: string;
    locationName: string;
    availability: "empty" | "partner" | "move-occupant";
    occupantId: number | null;
    occupantName: string | null;
};

type Partnership = {
    partnerAId: number;
    partnerBId: number;
    type: string;
};

type Couple = {
    id: string;
    type: string;
    partnerA: CoupleColonist;
    partnerB: CoupleColonist;
    bedA: CoupleBed;
    bedB: CoupleBed;
    potentialBeds: PotentialBed[];
};

type CouplesOverviewProps = {
    couples: Couple[];
    livingColonists: CoupleColonist[];
    assignedColonistIds: number[];
    partnerships: Partnership[];
};

function getColonistName(colonist: CoupleColonist) {
    return `${colonist.firstName}${colonist.nickname ? ` "${colonist.nickname}"` : ""} ${colonist.lastName}`;
}

function CoupleMember({
    colonist,
    bed,
}: {
    colonist: CoupleColonist;
    bed: CoupleBed;
}) {
    return (
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text
                component="a"
                href={`/colonists/${colonist.id}`}
                fw={600}
                c={colonist.legacy?.color ?? "var(--mantine-color-text)"}
                style={{
                    textDecoration: "none",
                    overflowWrap: "anywhere",
                }}
            >
                {getColonistName(colonist)}
            </Text>

            <Text size="xs" c="dimmed" lineClamp={2}>
                {bed
                    ? `${bed.bedName} · ${bed.locationName}`
                    : "No bed assigned"}
            </Text>
        </Stack>
    );
}

function PotentialBedList({
    beds,
    couple,
    livingColonists,
    assignedColonistIds,
    partnerships,
}: {
    beds: PotentialBed[];
    couple: Couple;
    livingColonists: CoupleColonist[];
    assignedColonistIds: number[];
    partnerships: Partnership[];
}) {
    if (beds.length === 0) {
        return (
            <Text size="xs" c="dimmed">
                No potential beds available.
            </Text>
        );
    }

    const assignedIds = new Set(assignedColonistIds);

    const partneredColonistIds = new Set<number>();

    for (const partnership of partnerships) {
        partneredColonistIds.add(partnership.partnerAId);
        partneredColonistIds.add(partnership.partnerBId);
    }

    return (
        <Stack gap="sm">
            {beds.map((bed) => {
                const availability = {
                    empty: {
                        label: "Empty",
                        color: "green",
                        description: "This bed is currently empty.",
                    },
                    partner: {
                        label: "Partner here",
                        color: "blue",
                        description: "One partner already occupies this bed.",
                    },
                    "move-occupant": {
                        label: "Can be reassigned",
                        color: "orange",
                        description: "The current single occupant would need to move.",
                    },
                }[bed.availability];

                const couplePriority = new Map([
                    [couple.partnerA.id, 0],
                    [couple.partnerB.id, 1],
                ]);

                const eligibleColonists = livingColonists
                    .filter(
                        (colonist) => !assignedIds.has(colonist.id)
                    )
                    .sort((a, b) => {
                        const priorityA = couplePriority.get(a.id);
                        const priorityB = couplePriority.get(b.id);

                        if (priorityA !== undefined || priorityB !== undefined) {
                            return (
                                (priorityA ?? 2) -
                                (priorityB ?? 2)
                            );
                        }

                        const partneredDifference =
                            Number(!partneredColonistIds.has(a.id)) -
                            Number(!partneredColonistIds.has(b.id));

                        if (partneredDifference !== 0) {
                            return partneredDifference;
                        }

                        return getColonistName(a).localeCompare(
                            getColonistName(b)
                        );
                    });

                const selectOptions = eligibleColonists.map((colonist) => {
                    const partnership = bed.occupantId
                        ? partnerships.find(
                            (item) =>
                                (
                                    item.partnerAId === colonist.id &&
                                    item.partnerBId === bed.occupantId
                                ) ||
                                (
                                    item.partnerBId === colonist.id &&
                                    item.partnerAId === bed.occupantId
                                )
                        )
                        : undefined;

                    const partnerId = partnership
                        ? partnership.partnerAId === colonist.id
                            ? partnership.partnerBId
                            : partnership.partnerAId
                        : null;

                    const partner = partnerId
                        ? livingColonists.find(
                            (candidate) => candidate.id === partnerId
                        )
                        : null;

                    return {
                        value: String(colonist.id),
                        label: getColonistName(colonist),
                        color: colonist.legacy?.color ?? null,
                        partnership: partnership
                            ? {
                                type: partnership.type as "Lover" | "Married",
                                partnerName: partner
                                    ? getColonistName(partner)
                                    : undefined,
                            }
                            : null,
                    };
                });

                return (
                    <Stack key={bed.bedId} gap="xs">
                        <Group
                            justify="space-between"
                            align="center"
                            gap="xs"
                            wrap="nowrap"
                        >
                            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                                <Text size="sm" fw={500}>
                                    {bed.bedName}
                                </Text>

                                <Text size="xs" c="dimmed">
                                    {bed.locationName}
                                    {bed.occupantName
                                        ? ` · ${bed.occupantName}`
                                        : ""}
                                </Text>
                            </Stack>

                            <Tooltip label={availability.description}>
                                <Badge
                                    color={availability.color}
                                    variant="light"
                                    size="sm"
                                    style={{ flexShrink: 0 }}
                                >
                                    {availability.label}
                                </Badge>
                            </Tooltip>
                        </Group>

                        <form
                            method="POST"
                            action={`/api/locations/beds/${bed.bedId}/assignments`}
                        >
                            <Group gap="xs" wrap="nowrap">
                                <LegacyColorColonistSelect
                                    name="colonistId"
                                    placeholder="Select partner"
                                    data={selectOptions}
                                    searchable
                                    nothingFoundMessage="No eligible colonists"
                                    size="sm"
                                    clearable
                                    required
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                    comboboxProps={{
                                        withinPortal: true,
                                    }}
                                />

                                <Button
                                    type="submit"
                                    size="sm"
                                    color="mesa"
                                    disabled={eligibleColonists.length === 0}
                                >
                                    Assign
                                </Button>
                            </Group>
                        </form>

                        {bed.availability === "move-occupant" && (
                            <Text size="xs" c="dimmed">
                                The existing occupant will need to be moved
                                separately if the couple is to share this bed.
                            </Text>
                        )}
                    </Stack>
                );
            })}
        </Stack>
    );
}

export default function CouplesOverview({
    couples,
    livingColonists,
    assignedColonistIds,
    partnerships,
}: CouplesOverviewProps) {
    return (
        <Card
            padding="lg"
            radius="md"
            withBorder
            bg="#131313"
            style={{
                borderColor: "#39302a",
            }}
        >
            <Group justify="space-between" align="center" mb="md">
                <div>
                    <Title order={2}>
                        Couples without a shared bed
                    </Title>

                    <Text size="xs" c="dimmed" mt={4}>
                        Current lovers and married couples who aren't
                        assigned to the same double bed.
                    </Text>
                </div>

                <Text size="sm" c="dimmed">
                    {couples.length}{" "}
                    {couples.length === 1 ? "couple" : "couples"}
                </Text>
            </Group>

            {couples.length > 0 ? (
                <SimpleGrid
                    cols={{
                        base: 1,
                        sm: 2,
                        md: 3,
                    }}
                    spacing="md"
                >
                    {couples.map((couple) => {
                        const isLover = couple.type === "Lover";
                        const relationshipColor = isLover
                            ? "#D66B9A"
                            : "#D4A84F";
                        const RelationshipIcon = isLover
                            ? Heart
                            : Blend;

                        return (
                            <Card
                                key={couple.id}
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
                                        align="center"
                                        gap="sm"
                                        wrap="nowrap"
                                    >
                                        <CoupleMember
                                            colonist={couple.partnerA}
                                            bed={couple.bedA}
                                        />

                                        <Tooltip label={couple.type}>
                                            <div
                                                style={{
                                                    flexShrink: 0,
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: "50%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: "#161616",
                                                    border: `2px solid ${relationshipColor}`,
                                                    color: relationshipColor,
                                                }}
                                            >
                                                <RelationshipIcon
                                                    size={16}
                                                    strokeWidth={2.5}
                                                />
                                            </div>
                                        </Tooltip>

                                        <CoupleMember
                                            colonist={couple.partnerB}
                                            bed={couple.bedB}
                                        />
                                    </Group>

                                    <Divider color="#292929" />

                                    <Accordion
                                        multiple
                                        variant="separated"
                                    >
                                        <Accordion.Item
                                            value="potential-beds"
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
                                                    <Text
                                                        size="xs"
                                                        fw={600}
                                                        c="dimmed"
                                                    >
                                                        Potential beds
                                                    </Text>

                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                    >
                                                        {couple.potentialBeds.length}
                                                    </Text>
                                                </Group>
                                            </Accordion.Control>

                                            <Accordion.Panel>
                                                <PotentialBedList
                                                    beds={couple.potentialBeds}
                                                    couple={couple}
                                                    livingColonists={livingColonists}
                                                    assignedColonistIds={assignedColonistIds}
                                                    partnerships={partnerships}
                                                />
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    </Accordion>
                                </Stack>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Text size="sm" c="dimmed">
                    All current couples share a double bed.
                </Text>
            )}
        </Card>
    );
}
