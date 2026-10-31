
import {
    ActionIcon,
    Button,
    Card,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { X } from "lucide-react";

import LegacyColorColonistSelect from "@/app/components/LegacyColorColonistSelect";

type Colonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    legacy: {
        color: string | null;
    } | null;
};

type Partnership = {
    partnerAId: number;
    partnerBId: number;
    type: string;
};

type Location = {
    id: number;
    name: string;
    doubleBeds: {
        id: number;
        name: string | null;
        assignments: {
            id: number;
            colonistId: number;
            colonist: Colonist;
        }[];
    }[];
};

type EmptyBedOverviewProps = {
    locations: Location[];
    livingColonists: Colonist[];
    partnerships: Partnership[];
    assignedColonistIds: number[];
};

function getColonistName(colonist: Colonist) {
    return `${colonist.firstName}${colonist.nickname ? ` "${colonist.nickname}"` : ""} ${colonist.lastName}`;
}

export default function EmptyBedOverview({
    locations,
    livingColonists,
    partnerships,
    assignedColonistIds,
}: EmptyBedOverviewProps) {
    const beds = locations.flatMap((location) =>
        location.doubleBeds
            .map((bed, index) => ({
                ...bed,
                locationName: location.name,
                bedName: bed.name?.trim() || `Bed #${index + 1}`,
            }))
            .filter((bed) => bed.assignments.length < 2)
    );

    const livingColonistIds = new Set(
        livingColonists.map((colonist) => colonist.id)
    );

    // Only consider partnerships where both colonists are living.
    const livingPartnerships = partnerships.filter(
        (partnership) =>
            livingColonistIds.has(partnership.partnerAId) &&
            livingColonistIds.has(partnership.partnerBId) &&
            (partnership.type === "Lover" || partnership.type === "Married")
    );

    const partneredColonistIds = new Set<number>();

    for (const partnership of livingPartnerships) {
        partneredColonistIds.add(partnership.partnerAId);
        partneredColonistIds.add(partnership.partnerBId);
    }

    const assignedIds = new Set(assignedColonistIds);

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <div>
                    <Title order={2}>Empty Bed Overview</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Quickly assign or remove occupants from beds with
                        available space.
                    </Text>
                </div>

                <Text size="sm" c="dimmed">
                    {beds.length}{" "}
                    {beds.length === 1 ? "available bed" : "available beds"}
                </Text>
            </Group>

            {beds.length > 0 ? (
                <SimpleGrid
                    cols={{
                        base: 1,
                        sm: 2,
                        md: 3,
                    }}
                    spacing="lg"
                >
                    {beds.map((bed) => {
                        const currentOccupantIds = bed.assignments.map(
                            (assignment) => assignment.colonistId
                        );

                        // Prioritize current partners of occupants in this bed.
                        const preferredPartnerIds = new Set<number>();

                        for (const partnership of livingPartnerships) {
                            if (
                                currentOccupantIds.includes(
                                    partnership.partnerAId
                                )
                            ) {
                                preferredPartnerIds.add(
                                    partnership.partnerBId
                                );
                            }

                            if (
                                currentOccupantIds.includes(
                                    partnership.partnerBId
                                )
                            ) {
                                preferredPartnerIds.add(
                                    partnership.partnerAId
                                );
                            }
                        }

                        const eligibleColonists = livingColonists
                            .filter(
                                (colonist) =>
                                    !assignedIds.has(colonist.id)
                            )
                            .sort((a, b) => {
                                const getPriority = (colonistId: number) => {
                                    if (preferredPartnerIds.has(colonistId)) {
                                        return 0;
                                    }

                                    if (partneredColonistIds.has(colonistId)) {
                                        return 1;
                                    }

                                    return 2;
                                };

                                const difference =
                                    getPriority(a.id) - getPriority(b.id);

                                if (difference !== 0) {
                                    return difference;
                                }

                                return getColonistName(a).localeCompare(
                                    getColonistName(b)
                                );
                            });

                        const selectOptions = eligibleColonists.map(
                            (colonist) => {
                                // Only show a relationship indicator when
                                // the candidate is partnered with an occupant.
                                const partnership = livingPartnerships.find(
                                    (item) =>
                                        (
                                            item.partnerAId === colonist.id &&
                                            currentOccupantIds.includes(
                                                item.partnerBId
                                            )
                                        ) ||
                                        (
                                            item.partnerBId === colonist.id &&
                                            currentOccupantIds.includes(
                                                item.partnerAId
                                            )
                                        )
                                );

                                const partnerId = partnership
                                    ? partnership.partnerAId === colonist.id
                                        ? partnership.partnerBId
                                        : partnership.partnerAId
                                    : null;

                                const partner = partnerId !== null
                                    ? livingColonists.find(
                                        (candidate) =>
                                            candidate.id === partnerId
                                    )
                                    : null;

                                const relationshipType:
                                    "Lover" | "Married" | null =
                                    partnership?.type === "Lover"
                                        ? "Lover"
                                        : partnership?.type === "Married"
                                            ? "Married"
                                            : null;

                                return {
                                    value: String(colonist.id),
                                    label: getColonistName(colonist),
                                    color: colonist.legacy?.color ?? null,
                                    partnership:
                                        relationshipType && partner
                                            ? {
                                                type: relationshipType,
                                                partnerName: getColonistName(partner),
                                            }
                                            : null,
                                };
                            }
                        );

                        return (
                            <Card
                                key={bed.id}
                                shadow="sm"
                                padding="md"
                                radius="md"
                                withBorder
                                bg="#161616"
                                style={{
                                    borderColor: "#292929",
                                }}
                            >
                                <Stack gap="xs">
                                    <div>
                                        <Text
                                            fw={600}
                                            size="md"
                                            style={{
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {bed.bedName}
                                        </Text>

                                        <Text size="xs" c="dimmed">
                                            {bed.locationName}
                                        </Text>
                                    </div>

                                    <SimpleGrid cols={2} spacing="xs" mt="xs">
                                        {[0, 1].map((slot) => {
                                            const assignment =
                                                bed.assignments[slot];

                                            const colonist =
                                                assignment?.colonist;

                                            return (
                                                <Card
                                                    key={slot}
                                                    padding="sm"
                                                    radius="md"
                                                    bg="#111"
                                                    withBorder
                                                    style={{
                                                        borderColor: "#292929",
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    {colonist && assignment ? (
                                                        <Group
                                                            align="center"
                                                            justify="space-between"
                                                            wrap="nowrap"
                                                            gap={4}
                                                        >
                                                            <Text
                                                                component="a"
                                                                href={`/colonists/${colonist.id}`}
                                                                size="md"
                                                                fw={500}
                                                                c={
                                                                    colonist.legacy?.color ??
                                                                    "var(--mantine-color-text)"
                                                                }
                                                                style={{
                                                                    textDecoration: "none",
                                                                    overflowWrap: "anywhere",
                                                                    minWidth: 0,
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                {getColonistName(colonist)}
                                                            </Text>

                                                            <form
                                                                method="POST"
                                                                action={`/api/locations/beds/${bed.id}/assignments/${assignment.id}/remove`}
                                                            >
                                                                <Tooltip label="Remove occupant">
                                                                    <ActionIcon
                                                                        component="button"
                                                                        type="submit"
                                                                        variant="subtle"
                                                                        color="gray"
                                                                        size="sm"
                                                                        aria-label={`Remove ${getColonistName(colonist)} from ${bed.bedName}`}
                                                                    >
                                                                        <X size={15} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            </form>
                                                        </Group>
                                                    ) : (
                                                        <form
                                                            method="POST"
                                                            action={`/api/locations/beds/${bed.id}/assignments`}
                                                        >
                                                            <Stack gap="xs">
                                                                <LegacyColorColonistSelect
                                                                    name="colonistId"
                                                                    placeholder="Select colonist"
                                                                    data={selectOptions}
                                                                    searchable
                                                                    nothingFoundMessage="No eligible colonists"
                                                                    size="sm"
                                                                    clearable
                                                                    required
                                                                    comboboxProps={{
                                                                        withinPortal: true,
                                                                    }}
                                                                />

                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    color="mesa"
                                                                    fullWidth
                                                                    disabled={
                                                                        eligibleColonists.length === 0
                                                                    }
                                                                >
                                                                    Assign
                                                                </Button>
                                                            </Stack>
                                                        </form>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </SimpleGrid>
                                </Stack>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Card
                    padding="lg"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: "#292929",
                    }}
                >
                    <Text size="sm" c="dimmed" ta="center">
                        All double beds are currently full.
                    </Text>
                </Card>
            )}
        </Stack>
    );
}
