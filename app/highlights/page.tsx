import Link from "next/link";
import type { ReactNode } from "react";
import {
    Card,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import { prisma } from "@/lib/prisma";

export default async function HighlightsPage() {
    const [colonists, relics] =
        await Promise.all([
            prisma.colonist.findMany({
                orderBy: {
                    birthYear: "asc",
                },
                include: {
                    parents: true,
                    children: true,
                    partnerARelationships: true,
                    partnerBRelationships: true,
                    legacy: true,
                },
            }),
            prisma.relic.findMany({
                include: {
                    owner: true,
                    ownershipHistory: {
                        include: {
                            colonist: {
                                include: {
                                    legacy: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

    const deadColonists = colonists.filter(
        (colonist) => colonist.isDead
    );

    /*
     * ---------------------------------------------------------
     * Helpers
     * ---------------------------------------------------------
     */

    function getColonistName(colonist: {
        firstName: string;
        nickname: string | null;
        lastName: string;
    }) {
        const firstName =
            colonist.nickname ||
            colonist.firstName;

        return `${firstName} ${colonist.lastName}`;
    }

    function getColonistLink(
        colonist:
            | {
                id: number;
                firstName: string;
                nickname: string | null;
                lastName: string;
                legacy?: {
                    color: string | null;
                } | null;
            }
            | null
            | undefined
    ) {
        if (!colonist) {
            return null;
        }

        return (
            <Link
                href={`/colonists/${colonist.id}`}
                style={{
                    color:
                        colonist.legacy?.color ??
                        "inherit",
                    textDecoration: "none",
                    fontWeight: 600,
                }}
            >
                {getColonistName(colonist)}
            </Link>
        );
    }

    function getLegacyLink(
        legacyId: number,
        name: string,
        color: string | null
    ) {
        return (
            <Link
                href={`/legacies/${legacyId}`}
                style={{
                    color:
                        color ?? "inherit",
                    textDecoration: "none",
                    fontWeight: 600,
                }}
            >
                {name}
            </Link>
        );
    }

    function getRelicLink(
        relic:
            | typeof relics[number]
            | null
            | undefined
    ) {
        if (!relic) {
            return null;
        }

        return (
            <Link
                href={`/relics/${relic.id}`}
                style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontWeight: 600,
                }}
            >
                {relic.name}
            </Link>
        );
    }

    function formatRimWorldDate(
        year: number,
        month: number,
        day: number
    ) {
        const months = [
            "Aprimay",
            "Jugust",
            "Septober",
            "Decembary",
        ];

        const monthName =
            months[month - 1] ??
            `Month ${month}`;

        let suffix = "th";

        if (
            day % 100 < 11 ||
            day % 100 > 13
        ) {
            if (day % 10 === 1) {
                suffix = "st";
            } else if (day % 10 === 2) {
                suffix = "nd";
            } else if (day % 10 === 3) {
                suffix = "rd";
            }
        }

        return `${day}${suffix} of ${monthName}, ${year}`;
    }

    function rimWorldDay(
        year: number,
        month: number,
        day: number
    ) {
        return (
            year * 60 +
            (month - 1) * 15 +
            (day - 1)
        );
    }

    function getBiologicalChildren(
        colonist: typeof colonists[number]
    ) {
        return colonist.children.filter(
            (child) =>
                child.type === "Biological"
        );
    }

    /*
     * ---------------------------------------------------------
     * Most children
     * ---------------------------------------------------------
     */

    const mostChildren =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) => {
                    const biologicalChildren =
                        getBiologicalChildren(
                            colonist
                        );

                    const mostBiologicalChildren =
                        getBiologicalChildren(
                            most
                        );

                    if (
                        biologicalChildren.length >
                        mostBiologicalChildren.length
                    ) {
                        return colonist;
                    }

                    return most;
                }
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Most prolific parents
     * ---------------------------------------------------------
     */

    const parentPairs = new Map<
        string,
        {
            parentA: number;
            parentB: number;
            children: number;
        }
    >();

    for (const child of colonists) {
        const biologicalParents =
            child.parents.filter(
                (parent) =>
                    parent.type ===
                    "Biological"
            );

        if (
            biologicalParents.length !== 2
        ) {
            continue;
        }

        const parentIds =
            biologicalParents
                .map(
                    (parent) =>
                        parent.parentId
                )
                .sort(
                    (a, b) => a - b
                );

        const pairKey =
            `${parentIds[0]}-${parentIds[1]}`;

        const existing =
            parentPairs.get(pairKey);

        if (existing) {
            existing.children++;
        } else {
            parentPairs.set(pairKey, {
                parentA: parentIds[0],
                parentB: parentIds[1],
                children: 1,
            });
        }
    }

    const mostProlificParents =
        parentPairs.size > 0
            ? Array.from(
                parentPairs.values()
            ).reduce(
                (most, pair) =>
                    pair.children >
                        most.children
                        ? pair
                        : most
            )
            : null;

    const prolificParentNames =
        mostProlificParents
            ? [
                colonists.find(
                    (colonist) =>
                        colonist.id ===
                        mostProlificParents.parentA
                ),
                colonists.find(
                    (colonist) =>
                        colonist.id ===
                        mostProlificParents.parentB
                ),
            ]
            : null;

    /*
     * ---------------------------------------------------------
     * Most descendants
     * ---------------------------------------------------------
     */

    const colonistById = new Map(
        colonists.map(
            (colonist) => [
                colonist.id,
                colonist,
            ]
        )
    );

    const descendantCache = new Map<
        number,
        number
    >();

    function countDescendants(
        colonistId: number,
        visited = new Set<number>()
    ): number {
        if (
            descendantCache.has(
                colonistId
            ) &&
            visited.size === 0
        ) {
            return descendantCache.get(
                colonistId
            )!;
        }

        if (visited.has(colonistId)) {
            return 0;
        }

        const nextVisited =
            new Set(visited);

        nextVisited.add(colonistId);

        const colonist =
            colonistById.get(colonistId);

        if (!colonist) {
            return 0;
        }

        const biologicalChildren =
            getBiologicalChildren(
                colonist
            );

        let count = 0;

        for (const relationship of biologicalChildren) {
            if (
                nextVisited.has(
                    relationship.childId
                )
            ) {
                continue;
            }

            count++;

            count += countDescendants(
                relationship.childId,
                nextVisited
            );
        }

        if (visited.size === 0) {
            descendantCache.set(
                colonistId,
                count
            );
        }

        return count;
    }

    const mostDescendants =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) =>
                    countDescendants(
                        colonist.id
                    ) >
                        countDescendants(
                            most.id
                        )
                        ? colonist
                        : most
            )
            : null;

    const mostDescendantCount =
        mostDescendants
            ? countDescendants(
                mostDescendants.id
            )
            : 0;

    /*
     * ---------------------------------------------------------
     * Most grandchildren
     * ---------------------------------------------------------
     */

    function getGrandchildrenCount(
        colonist: typeof colonists[number]
    ) {
        const grandchildren =
            new Set<number>();

        for (const childRelationship of
            getBiologicalChildren(
                colonist
            )) {
            const child =
                colonistById.get(
                    childRelationship.childId
                );

            if (!child) {
                continue;
            }

            for (const grandchildRelationship of
                getBiologicalChildren(
                    child
                )) {
                grandchildren.add(
                    grandchildRelationship.childId
                );
            }
        }

        return grandchildren.size;
    }

    const mostGrandchildren =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) =>
                    getGrandchildrenCount(
                        colonist
                    ) >
                        getGrandchildrenCount(
                            most
                        )
                        ? colonist
                        : most
            )
            : null;

    const mostGrandchildrenCount =
        mostGrandchildren
            ? getGrandchildrenCount(
                mostGrandchildren
            )
            : 0;

    /*
     * ---------------------------------------------------------
     * Most siblings
     * ---------------------------------------------------------
     */

    function getSiblingCount(
        colonist: typeof colonists[number]
    ) {
        const siblingIds =
            new Set<number>();

        for (const parentRelationship of
            colonist.parents.filter(
                (parent) =>
                    parent.type ===
                    "Biological"
            )) {
            const parent =
                colonistById.get(
                    parentRelationship.parentId
                );

            if (!parent) {
                continue;
            }

            for (const childRelationship of
                getBiologicalChildren(
                    parent
                )) {
                if (
                    childRelationship.childId !==
                    colonist.id
                ) {
                    siblingIds.add(
                        childRelationship.childId
                    );
                }
            }
        }

        return siblingIds.size;
    }

    const mostSiblings =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) =>
                    getSiblingCount(
                        colonist
                    ) >
                        getSiblingCount(
                            most
                        )
                        ? colonist
                        : most
            )
            : null;

    const mostSiblingsCount =
        mostSiblings
            ? getSiblingCount(
                mostSiblings
            )
            : 0;

    /*
     * ---------------------------------------------------------
     * Most children with different co-parents
     * ---------------------------------------------------------
     */

    function getDifferentCoParentCount(
        colonist: typeof colonists[number]
    ) {
        const coParents =
            new Set<number>();

        for (const childRelationship of
            getBiologicalChildren(
                colonist
            )) {
            const child =
                colonistById.get(
                    childRelationship.childId
                );

            if (!child) {
                continue;
            }

            for (const parentRelationship of
                child.parents.filter(
                    (parent) =>
                        parent.type ===
                        "Biological"
                )) {
                if (
                    parentRelationship.parentId !==
                    colonist.id
                ) {
                    coParents.add(
                        parentRelationship.parentId
                    );
                }
            }
        }

        return coParents.size;
    }

    const mostChildrenWithDifferentPartners =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) =>
                    getDifferentCoParentCount(
                        colonist
                    ) >
                        getDifferentCoParentCount(
                            most
                        )
                        ? colonist
                        : most
            )
            : null;

    const mostDifferentPartnerCount =
        mostChildrenWithDifferentPartners
            ? getDifferentCoParentCount(
                mostChildrenWithDifferentPartners
            )
            : 0;

    /*
     * ---------------------------------------------------------
     * Deadliest day
     * ---------------------------------------------------------
     */

    const deathDates = new Map<
        string,
        {
            year: number;
            month: number;
            day: number;
            count: number;
        }
    >();

    for (const colonist of deadColonists) {
        if (
            colonist.deathYear === null ||
            colonist.deathMonth === null ||
            colonist.deathDay === null
        ) {
            continue;
        }

        const key =
            `${colonist.deathYear}-${colonist.deathMonth}-${colonist.deathDay}`;

        const existing =
            deathDates.get(key);

        if (existing) {
            existing.count++;
        } else {
            deathDates.set(key, {
                year: colonist.deathYear,
                month: colonist.deathMonth,
                day: colonist.deathDay,
                count: 1,
            });
        }
    }

    const deadliestDay =
        deathDates.size > 0
            ? Array.from(
                deathDates.values()
            ).reduce(
                (deadliest, date) =>
                    date.count >
                        deadliest.count
                        ? date
                        : deadliest
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Most deaths in a year
     * ---------------------------------------------------------
     */

    const deathsByYear = new Map<
        number,
        number
    >();

    for (const colonist of deadColonists) {
        if (
            colonist.deathYear === null
        ) {
            continue;
        }

        deathsByYear.set(
            colonist.deathYear,
            (deathsByYear.get(
                colonist.deathYear
            ) ?? 0) + 1
        );
    }

    const mostDeathsInYear =
        deathsByYear.size > 0
            ? Array.from(
                deathsByYear.entries()
            ).reduce(
                (most, current) =>
                    current[1] > most[1]
                        ? current
                        : most
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Busiest birth year
     * ---------------------------------------------------------
     */

    const birthsByYear = new Map<
        number,
        number
    >();

    for (const colonist of colonists) {
        if (
            colonist.birthYear === null
        ) {
            continue;
        }

        birthsByYear.set(
            colonist.birthYear,
            (birthsByYear.get(
                colonist.birthYear
            ) ?? 0) + 1
        );
    }

    const busiestBirthYear =
        birthsByYear.size > 0
            ? Array.from(
                birthsByYear.entries()
            ).reduce(
                (most, current) =>
                    current[1] > most[1]
                        ? current
                        : most
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Busiest birth day
     * ---------------------------------------------------------
     */

    const birthsByDay = new Map<
        string,
        {
            year: number;
            month: number;
            day: number;
            count: number;
        }
    >();

    for (const colonist of colonists) {
        if (
            colonist.birthYear === null ||
            colonist.birthMonth === null ||
            colonist.birthDay === null
        ) {
            continue;
        }

        const key =
            `${colonist.birthYear}-${colonist.birthMonth}-${colonist.birthDay}`;

        const existing =
            birthsByDay.get(key);

        if (existing) {
            existing.count++;
        } else {
            birthsByDay.set(key, {
                year: colonist.birthYear,
                month: colonist.birthMonth,
                day: colonist.birthDay,
                count: 1,
            });
        }
    }

    const busiestBirthDay =
        birthsByDay.size > 0
            ? Array.from(
                birthsByDay.values()
            ).reduce(
                (busiest, date) =>
                    date.count >
                        busiest.count
                        ? date
                        : busiest
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Most common birth month
     * ---------------------------------------------------------
     */

    const birthsByMonth = new Map<
        number,
        number
    >();

    for (const colonist of colonists) {
        if (
            colonist.birthMonth === null
        ) {
            continue;
        }

        birthsByMonth.set(
            colonist.birthMonth,
            (birthsByMonth.get(
                colonist.birthMonth
            ) ?? 0) + 1
        );
    }

    const busiestBirthMonth =
        birthsByMonth.size > 0
            ? Array.from(
                birthsByMonth.entries()
            ).reduce(
                (most, current) =>
                    current[1] > most[1]
                        ? current
                        : most
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Most common death month
     * ---------------------------------------------------------
     */

    const deathsByMonth = new Map<
        number,
        number
    >();

    for (const colonist of deadColonists) {
        if (
            colonist.deathMonth === null
        ) {
            continue;
        }

        deathsByMonth.set(
            colonist.deathMonth,
            (deathsByMonth.get(
                colonist.deathMonth
            ) ?? 0) + 1
        );
    }

    const busiestDeathMonth =
        deathsByMonth.size > 0
            ? Array.from(
                deathsByMonth.entries()
            ).reduce(
                (most, current) =>
                    current[1] > most[1]
                        ? current
                        : most
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Longest-lived / shortest-lived
     * ---------------------------------------------------------
     */

    const colonistsWithFullLifespans =
        colonists.filter(
            (colonist) =>
                colonist.birthYear !== null &&
                colonist.birthMonth !== null &&
                colonist.birthDay !== null &&
                colonist.deathYear !== null &&
                colonist.deathMonth !== null &&
                colonist.deathDay !== null
        );

    function getLifespan(
        colonist: typeof colonists[number]
    ) {
        return (
            rimWorldDay(
                colonist.deathYear!,
                colonist.deathMonth!,
                colonist.deathDay!
            ) -
            rimWorldDay(
                colonist.birthYear!,
                colonist.birthMonth!,
                colonist.birthDay!
            )
        );
    }

    const longestLived =
        colonistsWithFullLifespans.length >
            0
            ? colonistsWithFullLifespans.reduce(
                (longest, colonist) =>
                    getLifespan(
                        colonist
                    ) >
                        getLifespan(
                            longest
                        )
                        ? colonist
                        : longest
            )
            : null;

    const shortestLived =
        colonistsWithFullLifespans.length >
            0
            ? colonistsWithFullLifespans.reduce(
                (shortest, colonist) =>
                    getLifespan(
                        colonist
                    ) <
                        getLifespan(
                            shortest
                        )
                        ? colonist
                        : shortest
            )
            : null;

    const longestLivedYears =
        longestLived
            ? Math.floor(
                getLifespan(
                    longestLived
                ) / 60
            )
            : null;

    const shortestLivedYears =
        shortestLived
            ? Math.floor(
                getLifespan(
                    shortestLived
                ) / 60
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Population boom / loss
     * ---------------------------------------------------------
     */

    const populationByYear =
        new Map<
            number,
            {
                births: number;
                deaths: number;
            }
        >();

    for (const colonist of colonists) {
        if (
            colonist.birthYear !== null
        ) {
            const existing =
                populationByYear.get(
                    colonist.birthYear
                ) ?? {
                    births: 0,
                    deaths: 0,
                };

            existing.births++;

            populationByYear.set(
                colonist.birthYear,
                existing
            );
        }

        if (
            colonist.deathYear !== null
        ) {
            const existing =
                populationByYear.get(
                    colonist.deathYear
                ) ?? {
                    births: 0,
                    deaths: 0,
                };

            existing.deaths++;

            populationByYear.set(
                colonist.deathYear,
                existing
            );
        }
    }

    const populationChanges =
        Array.from(
            populationByYear.entries()
        ).map(
            ([year, data]) => ({
                year,
                births: data.births,
                deaths: data.deaths,
                change:
                    data.births -
                    data.deaths,
            })
        );

    const greatestPopulationBoom =
        populationChanges.length > 0
            ? populationChanges.reduce(
                (most, current) =>
                    current.change >
                        most.change
                        ? current
                        : most
            )
            : null;

    const greatestLoss =
        populationChanges.length > 0
            ? populationChanges.reduce(
                (most, current) =>
                    current.change <
                        most.change
                        ? current
                        : most
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Legacy statistics
     * ---------------------------------------------------------
     */

    const legacySizes = new Map<
        number,
        {
            name: string;
            color: string | null;
            count: number;
        }
    >();

    for (const colonist of colonists) {
        if (
            colonist.legacyId === null ||
            colonist.legacy === null
        ) {
            continue;
        }

        const existing =
            legacySizes.get(
                colonist.legacyId
            );

        if (existing) {
            existing.count++;
        } else {
            legacySizes.set(
                colonist.legacyId,
                {
                    name:
                        colonist.legacy
                            .name,
                    color:
                        colonist.legacy
                            .color,
                    count: 1,
                }
            );
        }
    }

    const largestLegacy =
        legacySizes.size > 0
            ? Array.from(
                legacySizes.entries()
            ).reduce(
                (largest, current) =>
                    current[1].count >
                        largest[1].count
                        ? current
                        : largest
            )
            : null;

    const legacyBirths = new Map<
        number,
        {
            name: string;
            color: string | null;
            count: number;
        }
    >();

    for (const colonist of colonists) {
        if (
            colonist.legacyId === null ||
            colonist.legacy === null
        ) {
            continue;
        }

        const biologicalChildren =
            getBiologicalChildren(
                colonist
            );

        const existing =
            legacyBirths.get(
                colonist.legacyId
            );

        if (existing) {
            existing.count +=
                biologicalChildren.length;
        } else {
            legacyBirths.set(
                colonist.legacyId,
                {
                    name:
                        colonist.legacy
                            .name,
                    color:
                        colonist.legacy
                            .color,
                    count:
                        biologicalChildren.length,
                }
            );
        }
    }

    const mostProlificLegacy =
        legacyBirths.size > 0
            ? Array.from(
                legacyBirths.entries()
            ).reduce(
                (most, current) =>
                    current[1].count >
                        most[1].count
                        ? current
                        : most
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Partnership statistics
     * ---------------------------------------------------------
     */

    function getPartnerIds(
        colonist: typeof colonists[number]
    ) {
        const partnerIds =
            new Set<number>();

        for (const relationship of
            colonist.partnerARelationships) {
            partnerIds.add(
                relationship.partnerBId
            );
        }

        for (const relationship of
            colonist.partnerBRelationships) {
            partnerIds.add(
                relationship.partnerAId
            );
        }

        return partnerIds;
    }

    const mostPartners =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) =>
                    getPartnerIds(
                        colonist
                    ).size >
                        getPartnerIds(
                            most
                        ).size
                        ? colonist
                        : most
            )
            : null;

    function getPartnerCount(
        colonist: typeof colonists[number]
    ) {
        return getPartnerIds(colonist)
            .size;
    }

    function getMarriageCount(
        colonist: typeof colonists[number]
    ) {
        return (
            colonist.partnerARelationships.filter(
                (relationship) =>
                    relationship.type ===
                    "Married"
            ).length +
            colonist.partnerBRelationships.filter(
                (relationship) =>
                    relationship.type ===
                    "Married"
            ).length
        );
    }

    const mostMarriages =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) =>
                    getMarriageCount(
                        colonist
                    ) >
                        getMarriageCount(
                            most
                        )
                        ? colonist
                        : most
            )
            : null;

    function getFormerPartnerCount(
        colonist: typeof colonists[number]
    ) {
        return (
            colonist.partnerARelationships.filter(
                (relationship) =>
                    relationship.type ===
                    "Ex"
            ).length +
            colonist.partnerBRelationships.filter(
                (relationship) =>
                    relationship.type ===
                    "Ex"
            ).length
        );
    }

    const mostFormerPartners =
        colonists.length > 0
            ? colonists.reduce(
                (most, colonist) =>
                    getFormerPartnerCount(
                        colonist
                    ) >
                        getFormerPartnerCount(
                            most
                        )
                        ? colonist
                        : most
            )
            : null;

    /*
     * ---------------------------------------------------------
     * Relic statistics
     * ---------------------------------------------------------
     */

    const mostPassedDownRelic =
        relics.length > 0
            ? relics.reduce(
                (most, relic) =>
                    relic.ownershipHistory
                        .length >
                        most.ownershipHistory
                            .length
                        ? relic
                        : most
            )
            : null;

    function getRelicOwnershipNames(
        relic:
            | typeof relics[number]
            | null
            | undefined
    ) {
        if (
            !relic ||
            relic.ownershipHistory.length === 0
        ) {
            return null;
        }

        const owners =
            relic.ownershipHistory
                .slice()
                .sort(
                    (a, b) =>
                        a.order - b.order
                )
                .map(
                    (ownership) =>
                        ownership.colonist
                );

        return owners;
    }

    /*
     * ---------------------------------------------------------
     * Firsts
     * ---------------------------------------------------------
     */

    const maiaGrate =
        colonists.find(
            (colonist) =>
                colonist.firstName ===
                "Maia" &&
                colonist.lastName ===
                "Grate"
        ) ?? null;

    const sophie =
        colonists.find(
            (colonist) =>
                colonist.firstName ===
                "Sophie"
        ) ?? null;

    /*
     * ---------------------------------------------------------
     * Month names
     * ---------------------------------------------------------
     */

    const rimWorldMonths = [
        "Aprimay",
        "Jugust",
        "Septober",
        "Decembary",
    ];

    /*
     * ---------------------------------------------------------
     * Reusable card
     * ---------------------------------------------------------
     */

    function HighlightCard({
        title,
        value,
        description,
    }: {
        title: string;
        value: ReactNode;
        description?: ReactNode;
    }) {
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
                <Stack gap={4}>
                    <Text
                        size="sm"
                        c="dimmed"
                    >
                        {title}
                    </Text>

                    <Title order={3}>
                        {value}
                    </Title>

                    {description && (
                        <Text
                            size="sm"
                            c="dimmed"
                        >
                            {description}
                        </Text>
                    )}
                </Stack>
            </Card>
        );
    }

    const mostPassedDownRelicOwners =
        getRelicOwnershipNames(
            mostPassedDownRelic
        );

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 1100,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <Stack gap="xl">
                <div>
                    <Title order={1}>
                        Highlights
                    </Title>

                    <Text
                        c="dimmed"
                        size="sm"
                        mt={4}
                    >
                        Notable facts and records from the Eternal Mesa archive.
                    </Text>
                </div>

                <Stack gap="md">
                    <Title order={2}>
                        Family & Lineage
                    </Title>

                    <SimpleGrid
                        cols={{
                            base: 1,
                            sm: 2,
                        }}
                        spacing="md"
                    >
                        <HighlightCard
                            title="Most Children"
                            value={
                                mostChildren
                                    ? getColonistLink(
                                        mostChildren
                                    )
                                    : "No data"
                            }
                            description={
                                mostChildren
                                    ? `${getBiologicalChildren(
                                        mostChildren
                                    ).length
                                    } biological children`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Prolific Parents"
                            value={
                                prolificParentNames &&
                                    prolificParentNames[0] &&
                                    prolificParentNames[1] ? (
                                    <>
                                        {getColonistLink(
                                            prolificParentNames[0]
                                        )}{" "}
                                        &{" "}
                                        {getColonistLink(
                                            prolificParentNames[1]
                                        )}
                                    </>
                                ) : (
                                    "No data"
                                )
                            }
                            description={
                                mostProlificParents
                                    ? `${mostProlificParents.children} biological children together`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Descendants"
                            value={
                                mostDescendants
                                    ? getColonistLink(
                                        mostDescendants
                                    )
                                    : "No data"
                            }
                            description={
                                mostDescendants
                                    ? `${mostDescendantCount} biological descendants`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Grandchildren"
                            value={
                                mostGrandchildren
                                    ? getColonistLink(
                                        mostGrandchildren
                                    )
                                    : "No data"
                            }
                            description={
                                mostGrandchildren
                                    ? `${mostGrandchildrenCount} biological grandchildren`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Siblings"
                            value={
                                mostSiblings
                                    ? getColonistLink(
                                        mostSiblings
                                    )
                                    : "No data"
                            }
                            description={
                                mostSiblings
                                    ? `${mostSiblingsCount} biological siblings`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Children with Different Co-Parents"
                            value={
                                mostChildrenWithDifferentPartners
                                    ? getColonistLink(
                                        mostChildrenWithDifferentPartners
                                    )
                                    : "No data"
                            }
                            description={
                                mostChildrenWithDifferentPartners
                                    ? `Biological children with ${mostDifferentPartnerCount} different co-parents`
                                    : undefined
                            }
                        />
                    </SimpleGrid>
                </Stack>

                <Stack gap="md">
                    <Title order={2}>
                        Births & Deaths
                    </Title>

                    <SimpleGrid
                        cols={{
                            base: 1,
                            sm: 2,
                        }}
                        spacing="md"
                    >
                        <HighlightCard
                            title="Deadliest Day"
                            value={
                                deadliestDay
                                    ? formatRimWorldDate(
                                        deadliestDay.year,
                                        deadliestDay.month,
                                        deadliestDay.day
                                    )
                                    : "No data"
                            }
                            description={
                                deadliestDay
                                    ? `${deadliestDay.count} colonists died`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Busiest Birth Day"
                            value={
                                busiestBirthDay
                                    ? formatRimWorldDate(
                                        busiestBirthDay.year,
                                        busiestBirthDay.month,
                                        busiestBirthDay.day
                                    )
                                    : "No data"
                            }
                            description={
                                busiestBirthDay
                                    ? `${busiestBirthDay.count} colonists born`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Deaths in a Year"
                            value={
                                mostDeathsInYear
                                    ? `${mostDeathsInYear[0]}`
                                    : "No data"
                            }
                            description={
                                mostDeathsInYear
                                    ? `${mostDeathsInYear[1]} colonists died`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Busiest Birth Year"
                            value={
                                busiestBirthYear
                                    ? `${busiestBirthYear[0]}`
                                    : "No data"
                            }
                            description={
                                busiestBirthYear
                                    ? `${busiestBirthYear[1]} colonists born`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Common Birth Month"
                            value={
                                busiestBirthMonth
                                    ? rimWorldMonths[
                                    busiestBirthMonth[0] -
                                    1
                                    ] ??
                                    `Month ${busiestBirthMonth[0]}`
                                    : "No data"
                            }
                            description={
                                busiestBirthMonth
                                    ? `${busiestBirthMonth[1]} colonists born`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Common Death Month"
                            value={
                                busiestDeathMonth
                                    ? rimWorldMonths[
                                    busiestDeathMonth[0] -
                                    1
                                    ] ??
                                    `Month ${busiestDeathMonth[0]}`
                                    : "No data"
                            }
                            description={
                                busiestDeathMonth
                                    ? `${busiestDeathMonth[1]} colonists died`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Longest-Lived Colonist"
                            value={
                                longestLived
                                    ? getColonistLink(
                                        longestLived
                                    )
                                    : "No data"
                            }
                            description={
                                longestLivedYears !==
                                    null
                                    ? `About ${longestLivedYears} years`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Shortest-Lived Colonist"
                            value={
                                shortestLived
                                    ? getColonistLink(
                                        shortestLived
                                    )
                                    : "No data"
                            }
                            description={
                                shortestLivedYears !==
                                    null
                                    ? `About ${shortestLivedYears} years`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Greatest Population Boom"
                            value={
                                greatestPopulationBoom
                                    ? `${greatestPopulationBoom.year}`
                                    : "No data"
                            }
                            description={
                                greatestPopulationBoom
                                    ? `+${greatestPopulationBoom.change} net colonists (${greatestPopulationBoom.births} births, ${greatestPopulationBoom.deaths} deaths)`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Greatest Loss"
                            value={
                                greatestLoss
                                    ? `${greatestLoss.year}`
                                    : "No data"
                            }
                            description={
                                greatestLoss
                                    ? `${greatestLoss.change} net colonists (${greatestLoss.births} births, ${greatestLoss.deaths} deaths)`
                                    : undefined
                            }
                        />
                    </SimpleGrid>
                </Stack>

                <Stack gap="md">
                    <Title order={2}>
                        Legacies
                    </Title>

                    <SimpleGrid
                        cols={{
                            base: 1,
                            sm: 2,
                        }}
                        spacing="md"
                    >
                        <HighlightCard
                            title="Largest Legacy"
                            value={
                                largestLegacy
                                    ? getLegacyLink(
                                        largestLegacy[0],
                                        largestLegacy[1].name,
                                        largestLegacy[1].color
                                    )
                                    : "No data"
                            }
                            description={
                                largestLegacy
                                    ? `${largestLegacy[1].count} members`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Prolific Legacy"
                            value={
                                mostProlificLegacy
                                    ? getLegacyLink(
                                        mostProlificLegacy[0],
                                        mostProlificLegacy[1].name,
                                        mostProlificLegacy[1].color
                                    )
                                    : "No data"
                            }
                            description={
                                mostProlificLegacy
                                    ? `${mostProlificLegacy[1].count} biological children from its members`
                                    : undefined
                            }
                        />
                    </SimpleGrid>
                </Stack>

                <Stack gap="md">
                    <Title order={2}>
                        Relationships
                    </Title>

                    <SimpleGrid
                        cols={{
                            base: 1,
                            sm: 2,
                        }}
                        spacing="md"
                    >
                        <HighlightCard
                            title="Most Partners"
                            value={
                                mostPartners
                                    ? getColonistLink(
                                        mostPartners
                                    )
                                    : "No data"
                            }
                            description={
                                mostPartners
                                    ? `${getPartnerCount(
                                        mostPartners
                                    )} different partners`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Marriages"
                            value={
                                mostMarriages
                                    ? getColonistLink(
                                        mostMarriages
                                    )
                                    : "No data"
                            }
                            description={
                                mostMarriages
                                    ? `${getMarriageCount(
                                        mostMarriages
                                    )} marriages`
                                    : undefined
                            }
                        />

                        <HighlightCard
                            title="Most Former Partners"
                            value={
                                mostFormerPartners
                                    ? getColonistLink(
                                        mostFormerPartners
                                    )
                                    : "No data"
                            }
                            description={
                                mostFormerPartners
                                    ? `${getFormerPartnerCount(
                                        mostFormerPartners
                                    )} former partnerships`
                                    : undefined
                            }
                        />
                    </SimpleGrid>
                </Stack>

                <Stack gap="md">
                    <Title order={2}>
                        Relics
                    </Title>

                    <SimpleGrid
                        cols={{
                            base: 1,
                            sm: 2,
                        }}
                        spacing="md"
                    >
                        <HighlightCard
                            title="Most Passed-Down Relic"
                            value={
                                mostPassedDownRelic
                                    ? getRelicLink(
                                        mostPassedDownRelic
                                    )
                                    : "No data"
                            }
                            description={
                                mostPassedDownRelic
                                    ? `${mostPassedDownRelic.ownershipHistory.length} recorded owners`
                                    : undefined
                            }
                        />

                        {mostPassedDownRelicOwners &&
                            mostPassedDownRelicOwners.length >
                            0 && (
                                <HighlightCard
                                    title="Relic's Ownership History"
                                    value={
                                        mostPassedDownRelicOwners.map(
                                            (
                                                owner,
                                                index
                                            ) => (
                                                <span
                                                    key={
                                                        owner.id
                                                    }
                                                >
                                                    {index >
                                                        0 &&
                                                        " → "}
                                                    {getColonistLink(
                                                        owner
                                                    )}
                                                </span>
                                            )
                                        )}
                                    description={
                                        mostPassedDownRelic
                                            ? getRelicLink(
                                                mostPassedDownRelic
                                            )
                                            : undefined
                                    }
                                />
                            )}
                    </SimpleGrid>
                </Stack>

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
                    <Stack gap="md">
                        <div>
                            <Title order={2}>
                                Firsts
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Important firsts from the history of the colony.
                            </Text>
                        </div>

                        <Stack gap="sm">
                            <Text>
                                {maiaGrate
                                    ? getColonistLink(
                                        maiaGrate
                                    )
                                    : "Maia Grate"}{" "}
                                was the first colonist to gain the Eternal gene through growth.
                            </Text>

                            <Text>
                                {sophie
                                    ? getColonistLink(
                                        sophie
                                    )
                                    : "Sophie"}{" "}
                                was the first colonist to inherit the Eternal gene.
                            </Text>
                        </Stack>
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}