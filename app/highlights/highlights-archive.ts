
import { prisma } from "@/lib/prisma";
import type {
    HighlightRecord,
    HighlightSectionData,
    HighlightValuePart,
} from "./highlights-data";

const MONTHS = ["Aprimay", "Jugust", "Septober", "Decembary"];

type HighlightEntity = {
    id: number;
    name: string;
    color?: string | null;
    href: string;
};

function rimWorldDay(year: number, month: number, day: number) {
    return year * 60 + (month - 1) * 15 + day - 1;
}

function formatDate(year: number, month: number, day: number) {
    const suffix =
        day % 100 >= 11 && day % 100 <= 13
            ? "th"
            : day % 10 === 1
                ? "st"
                : day % 10 === 2
                    ? "nd"
                    : day % 10 === 3
                        ? "rd"
                        : "th";

    return `${day}${suffix} of ${MONTHS[month - 1] ?? `Month ${month}`}, ${year}`;
}

function entityValuePart(entity: HighlightEntity): HighlightValuePart {
    return {
        label: entity.name,
        href: entity.href,
        color: entity.color ?? null,
    };
}

/**
 * Creates one record for the highest positive count.
 * Tied winners share one record and remain individually navigable through valueParts.
 */
function mostRecords<T>(
    entries: T[],
    getCount: (entry: T) => number,
    getEntity: (entry: T) => HighlightEntity,
    options: {
        id: string;
        title: string;
        value: (count: number) => string;
        description: (entity: HighlightEntity, count: number) => string;
        icon: HighlightRecord["icon"];
        winnerLabel: string;
        minimum?: number;
    },
): HighlightRecord[] {
    if (entries.length === 0) return [];

    const counts = entries.map((entry) => ({
        entry,
        count: getCount(entry),
    }));

    const highest = Math.max(0, ...counts.map(({ count }) => count));

    if (highest < (options.minimum ?? 1)) return [];

    const winners = counts
        .filter(({ count }) => count === highest)
        .map(({ entry }) => getEntity(entry));

    const singleWinner = winners.length === 1 ? winners[0] : null;

    return [
        {
            id: options.id,
            title: options.title,
            value: singleWinner
                ? singleWinner.name
                : options.value(highest),
            description: singleWinner
                ? options.description(singleWinner, highest)
                : `${winners.length} ${options.winnerLabel} share this record.`,
            href: singleWinner?.href,
            color: singleWinner?.color ?? null,
            icon: options.icon,
            valueParts: singleWinner
                ? undefined
                : winners.map(entityValuePart),
        },
    ];
}

function getWordCount(value: unknown): number {
    let count = 0;

    function visit(node: unknown) {
        if (!node || typeof node !== "object") return;

        const record = node as Record<string, unknown>;

        if (typeof record.text === "string") {
            const words = record.text.trim();
            if (words) count += words.split(/\s+/).length;
        }

        if (Array.isArray(record.content)) {
            record.content.forEach(visit);
        }
    }

    visit(value);
    return count;
}

export async function getArchiveHighlightSections(): Promise<
    HighlightSectionData[]
> {
    const completeStory = { story: { status: "COMPLETE" as const } };

    const [
        colonists,
        relics,
        legacies,
        locations,
        groups,
        stories,
        references,
    ] = await Promise.all([
        prisma.colonist.findMany({
            include: {
                images: true,
                legacy: true,
                children: true,
                storyAssociations: {
                    where: completeStory,
                },
                colonistSkills: {
                    include: {
                        expertises: {
                            include: {
                                expertise: true,
                            },
                        },
                    },
                },
            },
        }),

        prisma.relic.findMany({
            include: {
                images: true,
                location: true,
                storyAssociations: {
                    where: completeStory,
                },
            },
        }),

        prisma.legacy.findMany({
            include: {
                members: {
                    include: {
                        children: true,
                    },
                },
                storyAssociations: {
                    where: completeStory,
                },
            },
        }),

        prisma.location.findMany({
            include: {
                previousNames: true,
                images: true,
                landmarks: {
                    include: {
                        images: true,
                    },
                },
                colonists: {
                    select: { id: true },
                },
                legacies: {
                    select: { id: true },
                },
                relics: {
                    select: { id: true },
                },
                storyAssociations: {
                    where: completeStory,
                },
            },
        }),

        prisma.group.findMany({
            include: {
                colonists: {
                    select: { colonistId: true },
                },
                storyAssociations: {
                    where: completeStory,
                },
            },
        }),

        prisma.story.findMany({
            where: { status: "COMPLETE" },
            include: {
                tags: {
                    include: { tag: true },
                },
                collectionLinks: {
                    include: { collection: true },
                },
                referenceLinks: {
                    include: { reference: true },
                },
                inlineAssets: true,
                relatedColonists: true,
                relatedLegacies: true,
                relatedGroups: true,
                relatedLocations: true,
                relatedRelics: true,
                relatedStories: true,
                referencedBy: {
                    where: {
                        story: { status: "COMPLETE" },
                    },
                },
            },
        }),

        prisma.referenceMaterial.findMany({
            include: {
                stories: {
                    where: {
                        story: { status: "COMPLETE" },
                    },
                },
            },
        }),
    ]);

    const colonistById = new Map(
        colonists.map((colonist) => [colonist.id, colonist]),
    );

    const colonistEntity = (
        colonist: (typeof colonists)[number],
    ): HighlightEntity => ({
        id: colonist.id,
        name: `${colonist.firstName}${colonist.nickname && colonist.nickname !== colonist.firstName
            ? ` "${colonist.nickname}"`
            : ""
            } ${colonist.lastName}`,
        color: colonist.legacy?.color,
        href: `/colonists/${colonist.id}`,
    });

    const relicEntity = (
        relic: (typeof relics)[number],
    ): HighlightEntity => ({
        id: relic.id,
        name: relic.name,
        href: `/relics/${relic.id}`,
    });

    const legacyEntity = (
        legacy: (typeof legacies)[number],
    ): HighlightEntity => ({
        id: legacy.id,
        name: legacy.name,
        color: legacy.color,
        href: `/legacies/${legacy.id}`,
    });

    const locationEntity = (
        location: (typeof locations)[number],
    ): HighlightEntity => ({
        id: location.id,
        name: location.name,
        href: `/locations/${location.id}`,
    });

    const groupEntity = (
        group: (typeof groups)[number],
    ): HighlightEntity => ({
        id: group.id,
        name: group.name,
        href: `/groups/${group.id}`,
    });

    const storyEntity = (
        story: (typeof stories)[number],
    ): HighlightEntity => ({
        id: story.id,
        name: story.title,
        href: `/stories/${story.id}`,
    });

    const referenceEntity = (
        reference: (typeof references)[number],
    ): HighlightEntity => ({
        id: reference.id,
        name: reference.title,
        href: "/stories",
    });

    // ---------------------------------------------------------------------
    // Legacy & archive history
    // ---------------------------------------------------------------------

    const datedLegacyChildren = legacies
        .map((legacy) => {
            const children = legacy.members.flatMap((member) =>
                member.children
                    .map((relationship) => colonistById.get(relationship.childId))
                    .filter(
                        (child): child is NonNullable<typeof child> =>
                            child !== undefined &&
                            child.birthYear !== null &&
                            child.birthMonth !== null &&
                            child.birthDay !== null,
                    ),
            );

            const earliestChild = children.reduce<
                (typeof children)[number] | null
            >((earliest, child) => {
                if (!earliest) return child;

                return rimWorldDay(
                    child.birthYear!,
                    child.birthMonth!,
                    child.birthDay!,
                ) < rimWorldDay(
                    earliest.birthYear!,
                    earliest.birthMonth!,
                    earliest.birthDay!,
                )
                    ? child
                    : earliest;
            }, null);

            return { legacy, earliestChild };
        })
        .filter(
            (
                entry,
            ): entry is typeof entry & {
                earliestChild: NonNullable<typeof entry.earliestChild>;
            } => entry.earliestChild !== null,
        );

    const earliestChildDay = datedLegacyChildren.length
        ? Math.min(
            ...datedLegacyChildren.map(({ earliestChild }) =>
                rimWorldDay(
                    earliestChild.birthYear!,
                    earliestChild.birthMonth!,
                    earliestChild.birthDay!,
                ),
            ),
        )
        : null;

    const oldestLegacyWinners =
        earliestChildDay === null
            ? []
            : datedLegacyChildren.filter(
                ({ earliestChild }) =>
                    rimWorldDay(
                        earliestChild.birthYear!,
                        earliestChild.birthMonth!,
                        earliestChild.birthDay!,
                    ) === earliestChildDay,
            );

    const oldestLegacyRecords: HighlightRecord[] =
        oldestLegacyWinners.length === 0
            ? []
            : (() => {
                const winners = oldestLegacyWinners.map(({ legacy }) =>
                    legacyEntity(legacy),
                );

                const firstChild = oldestLegacyWinners[0].earliestChild;
                const date = formatDate(
                    firstChild.birthYear!,
                    firstChild.birthMonth!,
                    firstChild.birthDay!,
                );
                const singleWinner = winners.length === 1 ? winners[0] : null;

                return [
                    {
                        id: "archive-oldest-legacy",
                        title: "Oldest recorded legacy",
                        value: singleWinner
                            ? singleWinner.name
                            : `${winners.length} legacies`,
                        description: singleWinner
                            ? `${firstChild.firstName} ${firstChild.lastName} was born on ${date}, the earliest recorded child birth among legacy members.`
                            : `${winners.length} legacies share the earliest recorded child birth, on ${date}.`,
                        href: singleWinner?.href,
                        color: singleWinner?.color ?? null,
                        icon: "legacy",
                        valueParts: singleWinner
                            ? undefined
                            : winners.map(entityValuePart),
                    },
                ];
            })();

    const legacyRecords = [
        ...oldestLegacyRecords,
        ...mostRecords(
            legacies,
            (legacy) => legacy.storyAssociations.length,
            legacyEntity,
            {
                id: "archive-documented-legacy",
                title: "Most documented legacy",
                value: (count) =>
                    `${count} ${count === 1 ? "story" : "stories"}`,
                description: (entity, count) =>
                    `${entity.name} is associated with ${count} completed ${count === 1 ? "story" : "stories"}.`,
                icon: "legacy",
                winnerLabel: "legacies",
            },
        ),
    ];

    // ---------------------------------------------------------------------
    // Galleries & visual archive
    // ---------------------------------------------------------------------

    const galleryRecords = [
        ...mostRecords(
            colonists,
            (colonist) => colonist.images.length,
            colonistEntity,
            {
                id: "archive-largest-colonist-gallery",
                title: "Largest colonist gallery",
                value: (count) =>
                    `${count} ${count === 1 ? "image" : "images"}`,
                description: (entity, count) =>
                    `${entity.name}'s gallery contains ${count} images.`,
                icon: "users",
                winnerLabel: "colonists",
                minimum: 1,
            },
        ),

        ...mostRecords(
            relics,
            (relic) => relic.images.length,
            relicEntity,
            {
                id: "archive-largest-relic-gallery",
                title: "Largest relic gallery",
                value: (count) =>
                    `${count} ${count === 1 ? "image" : "images"}`,
                description: (entity, count) =>
                    `${entity.name} has ${count} gallery images.`,
                icon: "relic",
                winnerLabel: "relics",
                minimum: 1,
            },
        ),

        ...mostRecords(
            locations,
            (location) =>
                location.images.length +
                location.landmarks.reduce(
                    (total, landmark) => total + landmark.images.length,
                    0,
                ),
            locationEntity,
            {
                id: "archive-most-photographed-location",
                title: "Most photographed location",
                value: (count) =>
                    `${count} ${count === 1 ? "image" : "images"}`,
                description: (entity, count) =>
                    `${entity.name} has ${count} images across its location gallery and landmarks.`,
                icon: "sparkles",
                winnerLabel: "locations",
                minimum: 1,
            },
        ),

        ...mostRecords(
            locations,
            (location) => location.landmarks.length,
            locationEntity,
            {
                id: "archive-most-landmarks",
                title: "Most landmarks at one location",
                value: (count) =>
                    `${count} ${count === 1 ? "landmark" : "landmarks"}`,
                description: (entity, count) =>
                    `${entity.name} has ${count} recorded landmarks.`,
                icon: "sparkles",
                winnerLabel: "locations",
                minimum: 1,
            },
        ),
    ];

    // ---------------------------------------------------------------------
    // Locations
    // ---------------------------------------------------------------------

    const locationRecords = [
        ...mostRecords(
            locations,
            (location) => location.previousNames.length,
            locationEntity,
            {
                id: "archive-most-renamed-location",
                title: "Most renamed location",
                value: (count) =>
                    `${count} previous ${count === 1 ? "name" : "names"}`,
                description: (entity, count) =>
                    `${entity.name} has ${count} recorded previous names.`,
                icon: "calendar",
                winnerLabel: "locations",
            },
        ),

        ...mostRecords(
            locations,
            (location) => location.storyAssociations.length,
            locationEntity,
            {
                id: "archive-most-documented-location",
                title: "Most documented location",
                value: (count) =>
                    `${count} ${count === 1 ? "story" : "stories"}`,
                description: (entity, count) =>
                    `${entity.name} is associated with ${count} completed ${count === 1 ? "story" : "stories"}.`,
                icon: "sparkles",
                winnerLabel: "locations",
            },
        ),

        ...mostRecords(
            locations,
            (location) =>
                location.colonists.length +
                location.legacies.length +
                location.relics.length,
            locationEntity,
            {
                id: "archive-most-connected-location",
                title: "Most connected location",
                value: (count) =>
                    `${count} archive ${count === 1 ? "connection" : "connections"}`,
                description: (entity, count) =>
                    `${entity.name} is linked to ${count} colonist, legacy, and relic records combined.`,
                icon: "sparkles",
                winnerLabel: "locations",
            },
        ),
    ];

    // ---------------------------------------------------------------------
    // Stories & documentation
    // ---------------------------------------------------------------------

    const storyRecords = [
        ...mostRecords(
            colonists,
            (colonist) => colonist.storyAssociations.length,
            colonistEntity,
            {
                id: "archive-most-documented-colonist",
                title: "Most documented colonist",
                value: (count) =>
                    `${count} ${count === 1 ? "story" : "stories"}`,
                description: (entity, count) =>
                    `${entity.name} is associated with ${count} completed ${count === 1 ? "story" : "stories"}.`,
                icon: "users",
                winnerLabel: "colonists",
            },
        ),

        ...mostRecords(
            relics,
            (relic) => relic.storyAssociations.length,
            relicEntity,
            {
                id: "archive-most-storied-relic",
                title: "Most storied relic",
                value: (count) =>
                    `${count} ${count === 1 ? "story" : "stories"}`,
                description: (entity, count) =>
                    `${entity.name} appears in ${count} completed ${count === 1 ? "story" : "stories"}.`,
                icon: "relic",
                winnerLabel: "relics",
            },
        ),

        ...mostRecords(
            groups,
            (group) => group.storyAssociations.length,
            groupEntity,
            {
                id: "archive-most-documented-group",
                title: "Most documented group",
                value: (count) =>
                    `${count} ${count === 1 ? "story" : "stories"}`,
                description: (entity, count) =>
                    `${entity.name} is associated with ${count} completed ${count === 1 ? "story" : "stories"}.`,
                icon: "users",
                winnerLabel: "groups",
            },
        ),

        ...mostRecords(
            locations,
            (location) => location.storyAssociations.length,
            locationEntity,
            {
                id: "archive-most-storied-location",
                title: "Most storied location",
                value: (count) =>
                    `${count} ${count === 1 ? "story" : "stories"}`,
                description: (entity, count) =>
                    `${entity.name} is associated with ${count} completed ${count === 1 ? "story" : "stories"}.`,
                icon: "sparkles",
                winnerLabel: "locations",
            },
        ),

        ...mostRecords(
            stories,
            (story) => story.referencedBy.length,
            storyEntity,
            {
                id: "archive-most-referenced-story",
                title: "Most referenced story",
                value: (count) =>
                    `${count} ${count === 1 ? "link" : "links"}`,
                description: (entity, count) =>
                    `${entity.name} is linked to by ${count} other completed ${count === 1 ? "story" : "stories"}.`,
                icon: "sparkles",
                winnerLabel: "stories",
            },
        ),

        ...mostRecords(
            stories,
            (story) =>
                story.relatedColonists.length +
                story.relatedLegacies.length +
                story.relatedGroups.length +
                story.relatedLocations.length +
                story.relatedRelics.length,
            storyEntity,
            {
                id: "archive-most-archive-links",
                title: "Most archive-connected story",
                value: (count) =>
                    `${count} ${count === 1 ? "archive link" : "archive links"}`,
                description: (entity, count) =>
                    `${entity.name} is associated with ${count} colonist, legacy, group, location, and relic records.`,
                icon: "sparkles",
                winnerLabel: "stories",
            },
        ),

        ...mostRecords(
            stories,
            (story) => getWordCount(story.content),
            storyEntity,
            {
                id: "archive-longest-story",
                title: "Longest story",
                value: (count) =>
                    `${count.toLocaleString()} ${count === 1 ? "word" : "words"}`,
                description: (entity, count) =>
                    `${entity.name} contains approximately ${count.toLocaleString()} words of story text.`,
                icon: "sparkles",
                winnerLabel: "stories",
                minimum: 1,
            },
        ),

        ...mostRecords(
            stories,
            (story) => story.inlineAssets.length,
            storyEntity,
            {
                id: "archive-most-illustrated-story",
                title: "Most illustrated story",
                value: (count) =>
                    `${count} inline ${count === 1 ? "image" : "images"}`,
                description: (entity, count) =>
                    `${entity.name} contains ${count} recorded inline image assets.`,
                icon: "sparkles",
                winnerLabel: "stories",
            },
        ),

        ...mostRecords(
            stories,
            (story) => story.referenceLinks.length,
            storyEntity,
            {
                id: "archive-most-sourced-story",
                title: "Most sourced story",
                value: (count) =>
                    `${count} ${count === 1 ? "reference" : "references"}`,
                description: (entity, count) =>
                    `${entity.name} has ${count} attached reference materials.`,
                icon: "sparkles",
                winnerLabel: "stories",
            },
        ),
    ];

    // Aggregate complete stories into their many-to-many collections and tags.
    const collectionCounts = new Map<
        number,
        {
            collection: (typeof stories)[number]["collectionLinks"][number]["collection"];
            count: number;
        }
    >();

    const tagCounts = new Map<
        number,
        {
            tag: (typeof stories)[number]["tags"][number]["tag"];
            count: number;
        }
    >();

    for (const story of stories) {
        for (const membership of story.collectionLinks) {
            const current = collectionCounts.get(membership.collection.id);

            collectionCounts.set(membership.collection.id, {
                collection: membership.collection,
                count: (current?.count ?? 0) + 1,
            });
        }

        for (const association of story.tags) {
            const current = tagCounts.get(association.tag.id);

            tagCounts.set(association.tag.id, {
                tag: association.tag,
                count: (current?.count ?? 0) + 1,
            });
        }
    }

    const mostStoriesInCollection = mostRecords(
        [...collectionCounts.values()],
        (entry) => entry.count,
        (entry) => ({
            id: entry.collection.id,
            name: entry.collection.name,
            href: "/stories",
        }),
        {
            id: "archive-largest-story-collection",
            title: "Largest story collection",
            value: (count) =>
                `${count} ${count === 1 ? "story" : "stories"}`,
            description: (entity, count) =>
                `${entity.name} contains ${count} completed ${count === 1 ? "story" : "stories"}.`,
            icon: "sparkles",
            winnerLabel: "collections",
        },
    );

    const mostUsedTags = mostRecords(
        [...tagCounts.values()],
        (entry) => entry.count,
        (entry) => ({
            id: entry.tag.id,
            name: entry.tag.name,
            href: "/stories",
        }),
        {
            id: "archive-most-used-story-tag",
            title: "Most used story tag",
            value: (count) =>
                `${count} ${count === 1 ? "story" : "stories"}`,
            description: (entity, count) =>
                `The tag "${entity.name}" is used by ${count} completed ${count === 1 ? "story" : "stories"}.`,
            icon: "sparkles",
            winnerLabel: "tags",
        },
    );

    const mostReusedReferences = mostRecords(
        references,
        (reference) => reference.stories.length,
        referenceEntity,
        {
            id: "archive-most-reused-reference",
            title: "Most reused reference",
            value: (count) =>
                `${count} ${count === 1 ? "story" : "stories"}`,
            description: (entity, count) =>
                `${entity.name} is attached to ${count} completed ${count === 1 ? "story" : "stories"}.`,
            icon: "sparkles",
            winnerLabel: "references",
        },
    );

    storyRecords.push(
        ...mostStoriesInCollection,
        ...mostUsedTags,
        ...mostReusedReferences,
    );

    const sections: HighlightSectionData[] = [
        {
            id: "legacy-archive",
            title: "Legacy & archive history",
            description:
                "Records about the age of legacy members and how the archive documents each family name.",
            records: legacyRecords,
        },
        {
            id: "galleries",
            title: "Galleries & visual archive",
            description:
                "The largest image collections and the locations with the most visual documentation.",
            records: galleryRecords,
        },
        {
            id: "locations",
            title: "Locations & landmarks",
            description:
                "Places distinguished by their recorded names, connections, and stories.",
            records: locationRecords,
        },
        {
            id: "stories",
            title: "Stories & documentation",
            description:
                "The stories, sources, tags, and collections that make up the colony's written archive.",
            records: storyRecords,
        },
    ];

    // Don't display empty categories when the archive doesn't contain
    // any qualifying records yet.
    return sections.filter((section) => section.records.length > 0);
}
