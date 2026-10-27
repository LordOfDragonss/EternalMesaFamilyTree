import { prisma } from "@/lib/prisma";
import {
    makeArchiveRecordKey,
    type ArchiveRecord,
    type ArchiveRecordCategory,
} from "./types";

function makeRecord(
    category: ArchiveRecordCategory,
    id: number,
    title: string,
    href: string,
    color: string | null = null,
    subtitle: string | null = null,
): ArchiveRecord {
    return {
        key: makeArchiveRecordKey(category, id),
        id,
        category,
        title,
        href,
        color,
        subtitle,
    };
}

export async function getStoryArchiveRecords(
    excludeStoryId?: number,
): Promise<ArchiveRecord[]> {
    const [
        colonists,
        legacies,
        groups,
        locations,
        relics,
        stories,
    ] = await Promise.all([
        prisma.colonist.findMany({
            select: {
                id: true,
                firstName: true,
                nickname: true,
                lastName: true,
                legacy: {
                    select: {
                        name: true,
                        color: true,
                    },
                },
            },
            orderBy: [
                { firstName: "asc" },
                { lastName: "asc" },
            ],
        }),

        prisma.legacy.findMany({
            select: {
                id: true,
                name: true,
                color: true,
            },
            orderBy: { name: "asc" },
        }),

        prisma.group.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        }),

        prisma.location.findMany({
            select: {
                id: true,
                name: true,
                type: true,
            },
            orderBy: { name: "asc" },
        }),

        prisma.relic.findMany({
            select: {
                id: true,
                name: true,
                type: true,
            },
            orderBy: { name: "asc" },
        }),

        prisma.story.findMany({
            where: excludeStoryId === undefined
                ? undefined
                : { id: { not: excludeStoryId } },
            select: {
                id: true,
                title: true,
                type: true,
                status: true,
            },
            orderBy: { title: "asc" },
        }),
    ]);

    const records: ArchiveRecord[] = [
        ...colonists.map((colonist) => {
            const name = colonist.nickname
                ? `${colonist.firstName} "${colonist.nickname}" ${colonist.lastName}`
                : `${colonist.firstName} ${colonist.lastName}`;

            return makeRecord(
                "Colonist",
                colonist.id,
                name,
                `/colonists/${colonist.id}`,
                colonist.legacy?.color ?? null,
                colonist.legacy ? `${colonist.legacy.name} family` : null,
            );
        }),

        ...legacies.map((legacy) =>
            makeRecord(
                "Legacy",
                legacy.id,
                legacy.name,
                `/legacies/${legacy.id}`,
                legacy.color,
                "Legacy",
            ),
        ),

        ...groups.map((group) =>
            makeRecord(
                "Group",
                group.id,
                group.name,
                `/groups/${group.id}`,
                null,
                "Group",
            ),
        ),

        ...locations.map((location) =>
            makeRecord(
                "Location",
                location.id,
                location.name,
                `/locations/${location.id}`,
                null,
                location.type
                    .toLowerCase()
                    .replaceAll("_", " "),
            ),
        ),

        ...relics.map((relic) =>
            makeRecord(
                "Relic",
                relic.id,
                relic.name,
                `/relics/${relic.id}`,
                null,
                relic.type ?? "Relic",
            ),
        ),

        ...stories.map((story) =>
            makeRecord(
                "Story",
                story.id,
                story.title,
                `/stories/${story.id}`,
                null,
                `${story.type} · ${story.status === "DRAFT" ? "Draft" : "Complete"}`,
            ),
        ),
    ];

    const categoryOrder: ArchiveRecordCategory[] = [
        "Colonist",
        "Legacy",
        "Group",
        "Location",
        "Relic",
        "Story",
    ];

    return records.sort((a, b) => {
        const categoryDifference =
            categoryOrder.indexOf(a.category) -
            categoryOrder.indexOf(b.category);

        return categoryDifference || a.title.localeCompare(b.title);
    });
}