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
import {
    ArrowLeft,
    ArrowRight,
    BedDouble,
    Pencil,
    Plus,
    X,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import BedFilters from "./BedFilters";
import DeleteButton from "@/app/components/DeleteButton";
import LegacyColorColonistSelect from "@/app/components/LegacyColorColonistSelect";
import BedReorderControls from "./BedReorderControls";

type DoubleBedsPageProps = {
    searchParams: Promise<{
        location?: string;
        search?: string;
    }>;
};

function getColonistName(colonist: {
    firstName: string;
    nickname: string | null;
    lastName: string;
}) {
    return `${colonist.firstName}${colonist.nickname ? ` "${colonist.nickname}"` : ""
        } ${colonist.lastName}`;
}

export default async function DoubleBedsPage({
    searchParams,
}: DoubleBedsPageProps) {
    const params = await searchParams;
    const selectedLocation = params.location ?? "";
    const search = params.search ?? "";


    const [locations, livingColonists, partnerships] = await Promise.all([
        prisma.location.findMany({
            where: {
                type: "PLAYABLE_MAP",
            },
            include: {
                doubleBeds: {
                    include: {
                        assignments: {
                            where: {
                                vacatedAt: null,
                            },
                            include: {
                                colonist: {
                                    include: {
                                        legacy: {
                                            select: {
                                                color: true,
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: {
                                assignedAt: "asc",
                            },
                        },
                    },
                    orderBy: [
                        { order: "asc" },
                        { id: "asc" },
                    ],
                },
            },
            orderBy: {
                name: "asc",
            },
        }),

        prisma.colonist.findMany({
            where: {
                isDead: false,
            },
            select: {
                id: true,
                firstName: true,
                nickname: true,
                lastName: true,
                legacy: {
                    select: {
                        color: true,
                    },
                },
            },
            orderBy: [
                { firstName: "asc" },
                { lastName: "asc" },
            ],
        }),

        prisma.partnership.findMany({
            where: {
                type: {
                    in: ["Lover", "Married"],
                },
            },
            select: {
                partnerAId: true,
                partnerBId: true,
                type: true,
            },
        }),
    ]);

    const filteredLocations = locations
        .filter((location) =>
            selectedLocation
                ? String(location.id) === selectedLocation
                : true
        )
        .map((location) => ({
            ...location,
            doubleBeds: location.doubleBeds.filter((bed) =>
                bed.name?.toLowerCase().includes(search.toLowerCase())
            ),
        }));

    const totalBeds = filteredLocations.reduce(
        (total, location) =>
            total + location.doubleBeds.length,
        0
    );

    const locationOptions = locations.map((location) => ({
        value: String(location.id),
        label: location.name,
    }));

    // Colonists with an active assignment anywhere in the colony
    // cannot be assigned to another bed.
    const assignedColonistIds = new Set(
        locations.flatMap((location) =>
            location.doubleBeds.flatMap((bed) =>
                bed.assignments.map(
                    (assignment) => assignment.colonistId
                )
            )
        )
    );

    const partneredColonistIds = new Set<number>();

    for (const partnership of partnerships) {
        partneredColonistIds.add(partnership.partnerAId);
        partneredColonistIds.add(partnership.partnerBId);
    }

    return (
        <main style={{ padding: "2rem" }}>
            <Group
                justify="space-between"
                align="center"
                mb="xl"
                gap="md"
                wrap="wrap"
            >
                <div>
                    <Title order={1}>Double Bed Manager</Title>

                    <Text c="dimmed" mt={4}>
                        Manage double beds and their occupants across the colony.
                    </Text>
                </div>

                <Group gap="xs">
                    <Tooltip label="Back to locations">
                        <ActionIcon
                            component="a"
                            href="/locations"
                            variant="subtle"
                            size="lg"
                            aria-label="Back to locations"
                            color="mesa"
                        >
                            <ArrowLeft size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Add double bed">
                        <ActionIcon
                            component="a"
                            href="/locations/beds/create"
                            variant="filled"
                            color="mesa"
                            size="lg"
                            aria-label="Add double bed"
                        >
                            <Plus size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <BedFilters
                initialLocation={selectedLocation}
                initialSearch={search}
                locations={locationOptions}
            />

            <Text size="sm" c="dimmed" mb="lg">
                {totalBeds}{" "}
                {totalBeds === 1 ? "bed" : "beds"} across{" "}
                {filteredLocations.length}{" "}
                {filteredLocations.length === 1
                    ? "location"
                    : "locations"}
            </Text>

            {filteredLocations.length > 0 ? (
                <Stack gap="xl">
                    {filteredLocations.map((location) => (
                        <Card
                            key={location.id}
                            padding="lg"
                            radius="md"
                            withBorder
                            bg="#131313"
                            style={{
                                borderColor: "#39302a",
                            }}
                        >
                            <Group
                                justify="space-between"
                                align="center"
                                mb="lg"
                            >
                                <div>
                                    <Title order={2}>
                                        {location.name}
                                    </Title>

                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        mt={4}
                                    >
                                        Playable map
                                    </Text>
                                </div>

                                <Text size="sm" c="dimmed">
                                    {location.doubleBeds.length}{" "}
                                    {location.doubleBeds.length === 1
                                        ? "bed"
                                        : "beds"}
                                </Text>
                            </Group>

                            {location.doubleBeds.length > 0 ? (
                                <SimpleGrid
                                    data-bed-grid
                                    cols={{
                                        base: 1,
                                        sm: 2,
                                        md: 3,
                                    }}
                                    spacing="lg"
                                >
                                    {location.doubleBeds.map(
                                        (bed, index) => {
                                            const currentOccupantIds =
                                                bed.assignments.map(
                                                    (assignment) =>
                                                        assignment.colonistId
                                                );

                                            // Find the current partners of occupants
                                            // already assigned to this bed.
                                            const preferredPartnerIds =
                                                new Set<number>();

                                            for (const partnership of partnerships) {
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

                                            const eligibleColonists =
                                                livingColonists
                                                    .filter(
                                                        (colonist) =>
                                                            !assignedColonistIds.has(
                                                                colonist.id
                                                            )
                                                    )
                                                    .sort((a, b) => {
                                                        const getPriority = (
                                                            colonistId: number
                                                        ) => {
                                                            if (
                                                                preferredPartnerIds.has(
                                                                    colonistId
                                                                )
                                                            ) {
                                                                return 0;
                                                            }

                                                            if (
                                                                partneredColonistIds.has(
                                                                    colonistId
                                                                )
                                                            ) {
                                                                return 1;
                                                            }

                                                            return 2;
                                                        };

                                                        const priorityDifference =
                                                            getPriority(a.id) -
                                                            getPriority(b.id);

                                                        if (
                                                            priorityDifference !== 0
                                                        ) {
                                                            return priorityDifference;
                                                        }

                                                        return getColonistName(
                                                            a
                                                        ).localeCompare(
                                                            getColonistName(b)
                                                        );
                                                    });

                                            const selectOptions = eligibleColonists.map((colonist) => {
                                                // Only show a partnership indicator when this colonist
                                                // is partnered with someone already occupying this bed.
                                                const partnership = partnerships.find(
                                                    (item) =>
                                                        (
                                                            item.partnerAId === colonist.id &&
                                                            currentOccupantIds.includes(item.partnerBId)
                                                        ) ||
                                                        (
                                                            item.partnerBId === colonist.id &&
                                                            currentOccupantIds.includes(item.partnerAId)
                                                        )
                                                );

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

                                            const bedName =
                                                bed.name?.trim() ||
                                                `Bed #${index + 1}`;

                                            return (
                                                <Card
                                                    key={bed.id}
                                                    data-bed-card
                                                    shadow="sm"
                                                    padding="lg"
                                                    radius="md"
                                                    withBorder
                                                    bg="#161616"
                                                    style={{
                                                        borderColor: "#292929",
                                                    }}
                                                >

                                                    {/* Reordering controls */}
                                                    <BedReorderControls
                                                        bedId={bed.id}
                                                        isFirst={index === 0}
                                                        isLast={index === location.doubleBeds.length - 1}
                                                    />

                                                    {/* Screenshot */}
                                                    <div
                                                        style={{
                                                            width: "100%",
                                                            height: 220,
                                                            borderRadius: "var(--mantine-radius-md)",
                                                            border: "1px dashed #444",
                                                            backgroundColor: "#111",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {bed.screenshotURL ? (
                                                            <img
                                                                src={`/api/images/${bed.screenshotURL}`}
                                                                alt={`Screenshot of ${bedName}`}
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "contain",
                                                                }}
                                                            />
                                                        ) : (
                                                            <BedDouble size={32} color="#666" />
                                                        )}
                                                    </div>


                                                    {/* Bed information */}
                                                    <Stack mt="md" gap="xs">
                                                        <Group
                                                            justify="space-between"
                                                            align="center"
                                                            wrap="nowrap"
                                                        >
                                                            <Text
                                                                fw={600}
                                                                size="lg"
                                                                style={{
                                                                    overflowWrap: "anywhere",
                                                                }}
                                                            >
                                                                {bedName}
                                                            </Text>

                                                            <Group gap={4} wrap="nowrap">
                                                                <Tooltip label="Edit bed">
                                                                    <ActionIcon
                                                                        component="a"
                                                                        href={`/locations/beds/${bed.id}/edit`}
                                                                        variant="subtle"
                                                                        color="mesa"
                                                                        aria-label={`Edit ${bedName}`}
                                                                    >
                                                                        <Pencil size={18} />
                                                                    </ActionIcon>
                                                                </Tooltip>

                                                                <DeleteButton
                                                                    action={`/api/locations/beds/${bed.id}/delete`}
                                                                    name={bedName}
                                                                    type="Double Bed"
                                                                />
                                                            </Group>
                                                        </Group>
                                                    </Stack>


                                                    {/* Occupant slots */}
                                                    <SimpleGrid
                                                        cols={2}
                                                        spacing="xs"
                                                        mt="lg"
                                                    >
                                                        {[0, 1].map((slot) => {
                                                            const assignment = bed.assignments[slot];
                                                            const colonist = assignment?.colonist;

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
                                                                                        aria-label={`Remove ${getColonistName(colonist)} from ${bedName}`}
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
                                                                            <Group
                                                                                align="center"
                                                                                gap="xs"
                                                                                wrap="nowrap"
                                                                            >
                                                                                <LegacyColorColonistSelect
                                                                                    name="colonistId"
                                                                                    placeholder="Select colonist"
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
                                                                                    disabled={
                                                                                        eligibleColonists.length === 0
                                                                                    }
                                                                                >
                                                                                    Assign
                                                                                </Button>
                                                                            </Group>
                                                                        </form>
                                                                    )}
                                                                </Card>
                                                            );
                                                        })}
                                                    </SimpleGrid>
                                                    {/* Notes */}
                                                    <div
                                                        style={{
                                                            minHeight: 22,
                                                            marginTop: "var(--mantine-spacing-md)",
                                                        }}
                                                    >
                                                        {bed.notes && (
                                                            <Text size="sm" c="dimmed">
                                                                {bed.notes}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </Card>
                                            );
                                        }
                                    )}
                                </SimpleGrid>
                            ) : (
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    ta="center"
                                    py="xl"
                                >
                                    No double beds have been added for this location yet.
                                </Text>
                            )}
                        </Card>
                    ))}
                </Stack>
            ) : (
                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: "#292929",
                        textAlign: "center",
                    }}
                >
                    <Text fw={600}>
                        {locations.length === 0
                            ? "No playable maps found"
                            : "No matching location found"}
                    </Text>

                    <Text
                        size="sm"
                        c="dimmed"
                        mt="xs"
                    >
                        {locations.length === 0
                            ? "Create a playable map location before adding double beds."
                            : "Try selecting another location."}
                    </Text>
                </Card>
            )}
        </main>
    );
}