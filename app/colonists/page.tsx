import {
    ActionIcon,
    Card,
    Group,
    SimpleGrid,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Pencil, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import DeleteButton from "@/app/components/DeleteButton";
import ColonistFilters from "./ColonistFilters";

type ColonistsPageProps = {
    searchParams: Promise<{
        search?: string;
        legacy?: string | string[];
        group?: string | string[];
        status?: string;
        portrait?: string;
        relationship?: string | string[];
    }>;
};

export default async function ColonistsPage({
    searchParams,
}: ColonistsPageProps) {
    const params = await searchParams;

    const search = params.search?.trim() ?? "";

    /*
     * ---------------------------------------------------------
     * Legacy options
     * ---------------------------------------------------------
     */

    const legacies = await prisma.legacy.findMany({
        orderBy: {
            name: "asc",
        },
    });

    const legacyOptions = legacies.map((legacy) => ({
        value: legacy.id.toString(),
        label: legacy.name,
        color: legacy.color,
    }));

    /*
     * ---------------------------------------------------------
     * Group options
     * ---------------------------------------------------------
     */

    const groups = await prisma.group.findMany({
        orderBy: {
            name: "asc",
        },
    });

    const groupOptions = groups.map((group) => ({
        value: group.id.toString(),
        label: group.name,
    }));

    /*
     * ---------------------------------------------------------
     * Legacy filters
     *
     * Include:
     *   legacy=1
     *   legacy=2
     *
     * Exclude:
     *   legacy=!3
     *   legacy=!4
     *
     * Special:
     *   legacy=none
     *   legacy=!none
     * ---------------------------------------------------------
     */

    const legacyValues = params.legacy
        ? Array.isArray(params.legacy)
            ? params.legacy
            : [params.legacy]
        : [];

    const includedLegacyIds = legacyValues
        .filter(
            (value) =>
                !value.startsWith("!") &&
                value !== "none"
        )
        .map(Number)
        .filter((value) => !Number.isNaN(value));

    const excludedLegacyIds = legacyValues
        .filter(
            (value) =>
                value.startsWith("!") &&
                value !== "!none"
        )
        .map((value) => Number(value.slice(1)))
        .filter((value) => !Number.isNaN(value));

    const includeNoLegacy =
        legacyValues.includes("none");

    const excludeNoLegacy =
        legacyValues.includes("!none");

    /*
     * ---------------------------------------------------------
     * Group filters
     * ---------------------------------------------------------
     */

    const groupValues = params.group
        ? Array.isArray(params.group)
            ? params.group
            : [params.group]
        : [];

    const selectedGroupIds = groupValues
        .map(Number)
        .filter((value) => !Number.isNaN(value));

    /*
     * ---------------------------------------------------------
     * Status filter
     * ---------------------------------------------------------
     */

    const statusFilter =
        params.status === "alive"
            ? { isDead: false }
            : params.status === "dead"
                ? { isDead: true }
                : {};

    /*
* ---------------------------------------------------------
* Relationship filters
* ---------------------------------------------------------
*/


    const relationshipValues = params.relationship
        ? Array.isArray(params.relationship)
            ? params.relationship
            : [params.relationship]
        : [];
    const relationshipConditions = [];

    if (relationshipValues.includes("partner")) {
        relationshipConditions.push({
            OR: [
                {
                    partnerARelationships: {
                        some: {},
                    },
                },
                {
                    partnerBRelationships: {
                        some: {},
                    },
                },
            ],
        });
    }

    if (relationshipValues.includes("noPartner")) {
        relationshipConditions.push({
            AND: [
                {
                    partnerARelationships: {
                        none: {},
                    },
                },
                {
                    partnerBRelationships: {
                        none: {},
                    },
                },
            ],
        });
    }

    if (relationshipValues.includes("parent")) {
        relationshipConditions.push({
            parents: {
                some: {},
            },
        });
    }

    if (relationshipValues.includes("noParent")) {
        relationshipConditions.push({
            parents: {
                none: {},
            },
        });
    }

    if (relationshipValues.includes("child")) {
        relationshipConditions.push({
            children: {
                some: {},
            },
        });
    }

    if (relationshipValues.includes("noChild")) {
        relationshipConditions.push({
            children: {
                none: {},
            },
        });
    }
    /*
     * ---------------------------------------------------------
     * Portrait filter
     * ---------------------------------------------------------
     */

    const portraitFilter =
        params.portrait === "with"
            ? {
                imageURL: {
                    not: null,
                },
            }
            : params.portrait === "without"
                ? {
                    imageURL: null,
                }
                : {};
    const colonists = await prisma.colonist.findMany({
        where: {
            ...(search
                ? {
                    OR: [
                        {
                            firstName: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            nickname: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            lastName: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    ],
                }
                : {}),

            /*
             * Include legacies.
             */
            ...(includedLegacyIds.length > 0 ||
                includeNoLegacy
                ? {
                    OR: [
                        ...(includedLegacyIds.length > 0
                            ? [
                                {
                                    legacyId: {
                                        in: includedLegacyIds,
                                    },
                                },
                            ]
                            : []),

                        ...(includeNoLegacy
                            ? [
                                {
                                    legacyId: null,
                                },
                            ]
                            : []),
                    ],
                }
                : {}),

            /*
             * Exclude legacies.
             */
            ...(excludedLegacyIds.length > 0
                ? {
                    legacyId: {
                        notIn: excludedLegacyIds,
                    },
                }
                : {}),

            /*
             * Exclude colonists without a legacy.
             */
            ...(excludeNoLegacy
                ? {
                    legacyId: {
                        not: null,
                    },
                }
                : {}),

            /*
             * Groups.
             */
            ...(selectedGroupIds.length > 0
                ? {
                    groups: {
                        some: {
                            groupId: {
                                in: selectedGroupIds,
                            },
                        },
                    },
                }
                : {}),

            /*
             * Status.
             */
            ...statusFilter,
            /*
             * Relationships.
             */
            ...(relationshipConditions.length > 0
                ? {
                    AND: relationshipConditions,
                }
                : {}),
            /*
             * Portrait.
             */
            ...portraitFilter,
        },

        include: {
            legacy: true,

            groups: {
                include: {
                    group: true,
                },
            },
        },

        orderBy: {
            id: "asc",
        },
    });

    return (
        <main style={{ padding: "2rem" }}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1}>Colonists</Title>
                    <Text c="dimmed">
                        Browse the colonists of the colony.
                    </Text>
                </div>

                <Tooltip label="Add colonist">
                    <ActionIcon
                        component="a"
                        href="/colonists/create"
                        size="lg"
                        variant="filled"
                        color="mesa"
                        aria-label="Add colonist"
                    >
                        <Plus size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <ColonistFilters
                legacyOptions={legacyOptions}
                groupOptions={groupOptions}
                initialSearch={search}
                initialLegacies={legacyValues}
                initialGroups={groupValues}
                initialStatus={params.status ?? ""}
                initialPortrait={params.portrait ?? ""}
                initialRelationships={relationshipValues}
            />
            <Text c="dimmed" size="sm" mb="md">
                {colonists.length}{" "}
                {colonists.length === 1 ? "colonist" : "colonists"}
            </Text>
            {colonists.length > 0 ? (
                <SimpleGrid
                    cols={{
                        base: 1,
                        sm: 2,
                        md: 3,
                        lg: 4,
                    }}
                    spacing="lg"
                >
                    {colonists.map((colonist) => (
                        <Card
                            key={colonist.id}
                            shadow="sm"
                            padding="lg"
                            radius="md"
                            withBorder
                            bg="#161616"
                            style={{
                                position: "relative",
                                borderColor: "#292929",
                                transition:
                                    "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                                "--legacy-color":
                                    colonist.legacy?.color ?? "#3a3a3a",
                            } as React.CSSProperties}
                            className="colonist-card"
                        >
                            <a
                                href={`/colonists/${colonist.id}`}
                                className="colonist-card-link"
                                aria-label={`View ${colonist.firstName} ${colonist.lastName}`}
                            />

                            <Group align="flex-start" wrap="nowrap">
                                {/* Portrait */}
                                {colonist.imageURL ? (
                                    <img
                                        src={`/api/images/${colonist.imageURL}`}
                                        alt={`${colonist.firstName} ${colonist.lastName} portrait`}
                                        style={{
                                            width: 70,
                                            height: 90,
                                            objectFit: "cover",
                                            borderRadius:
                                                "var(--mantine-radius-md)",
                                            border: "1px solid #292929",
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 70,
                                            height: 90,
                                            borderRadius:
                                                "var(--mantine-radius-md)",
                                            border: "1px dashed #444",
                                            backgroundColor: "#111",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#666",
                                            fontSize: "1.5rem",
                                            flexShrink: 0,
                                        }}
                                    >
                                        ?
                                    </div>
                                )}

                                {/* Information */}
                                <div style={{ minWidth: 0 }}>
                                    <Text fw={600} size="lg">
                                        {colonist.firstName}{" "}
                                        {colonist.nickname &&
                                            `"${colonist.nickname}"`}{" "}
                                        {colonist.lastName}
                                    </Text>

                                    {colonist.title && (
                                        <Text
                                            size="sm"
                                            mt={4}
                                            fw={500}
                                            style={
                                                colonist.legacy?.color
                                                    ? {
                                                        color:
                                                            colonist.legacy.color,
                                                    }
                                                    : undefined
                                            }
                                        >
                                            {colonist.title}
                                        </Text>
                                    )}

                                    {colonist.legacy && (
                                        <Text
                                            c={
                                                colonist.legacy.color
                                                    ? undefined
                                                    : "dimmed"
                                            }
                                            size="sm"
                                            mt={2}
                                            style={
                                                colonist.legacy.color
                                                    ? {
                                                        color:
                                                            colonist.legacy.color,
                                                    }
                                                    : undefined
                                            }
                                        >
                                            {colonist.legacy.name}
                                        </Text>
                                    )}
                                    {colonist.groups.length > 0 && (
                                        <Text
                                            c="dimmed"
                                            size="sm"
                                            mt={2}
                                        >
                                            {colonist.groups
                                                .map(
                                                    (membership) =>
                                                        membership.group.name
                                                )
                                                .join(", ")}
                                        </Text>
                                    )}
                                </div>
                            </Group>

                            <Group
                                mt="lg"
                                justify="flex-end"
                                gap="xs"
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                <Tooltip label="Edit colonist">
                                    <ActionIcon
                                        component="a"
                                        href={`/colonists/${colonist.id}/edit`}
                                        variant="subtle"
                                        aria-label="Edit colonist"
                                    >
                                        <Pencil size={18} />
                                    </ActionIcon>
                                </Tooltip>

                                <DeleteButton
                                    action={`/api/colonists/${colonist.id}/delete`}
                                    colonistName={`${colonist.firstName} "${colonist.nickname}" ${colonist.lastName}`}
                                />
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
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
                        No colonists found
                    </Text>

                    <Text
                        size="sm"
                        c="dimmed"
                        mt="xs"
                    >
                        Try changing your search or legacy filters.
                    </Text>
                </Card>
            )}
        </main>
    );
}