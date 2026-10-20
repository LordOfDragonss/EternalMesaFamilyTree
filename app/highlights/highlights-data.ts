import { prisma } from "@/lib/prisma";
import { getColonyDiscoveries } from "./highlights-discoveries";

const MONTHS = ["Aprimay", "Jugust", "Septober", "Decembary"];

export type HighlightValuePart = {
    label: string;
    href?: string;
    color?: string | null;
};

export type HighlightRecord = {
    id: string;
    title: string;
    value: string;
    description?: string;
    href?: string;
    color?: string | null;
    imageURL?: string | null;
    icon: "users" | "calendar" | "trophy" | "heart" | "legacy" | "relic" | "sparkles";
    titleParts?: HighlightValuePart[];
    valueParts?: HighlightValuePart[];
};

export type HighlightSectionData = {
    id: string;
    title: string;
    description: string;
    records: HighlightRecord[];
};


export type ActivityColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    imageURL: string | null;
    legacy: {
        name: string;
        color: string | null;
    } | null;
};

export type ActivityYear = {
    year: number;
    births: number;
    deaths: number;
    birthColonists: ActivityColonist[];
    deathColonists: ActivityColonist[];
};


function getName(colonist: {
    firstName: string;
    nickname: string | null;
    lastName: string;
}) {
    const firstName = colonist.firstName.trim();
    const nickname = colonist.nickname?.trim();
    const lastName = colonist.lastName.trim();

    const name = nickname && nickname !== firstName
        ? `${firstName} "${nickname}"`
        : firstName;

    return `${name} ${lastName}`.trim();
}

function colonistPart(colonist: {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    legacy?: { color: string | null } | null;
}): HighlightValuePart {
    return {
        label: getName(colonist),
        href: `/colonists/${colonist.id}`,
        color: colonist.legacy?.color,
    };
}

function rimWorldDay(year: number, month: number, day: number) {
    return year * 60 + (month - 1) * 15 + day - 1;
}

function formatDate(year: number, month: number, day: number) {
    const monthName = MONTHS[month - 1] ?? `Month ${month}`;

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

    return `${day}${suffix} of ${monthName}, ${year}`;
}

function formatLifespan(days: number) {
    const years = Math.floor(days / 60);
    const remainingDays = days % 60;
    const months = Math.floor(remainingDays / 15);
    const daysLeft = remainingDays % 15;

    const parts: string[] = [];

    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (daysLeft > 0 || parts.length === 0) {
        parts.push(`${daysLeft} ${daysLeft === 1 ? "day" : "days"}`);
    }

    return parts.join(", ");
}

function getAllMostFrequent<T>(
    entries: Map<T, number>,
): [T, number][] {
    const values = [...entries.entries()];
    if (values.length === 0) return [];

    const highest = Math.max(...values.map(([, count]) => count));
    return values.filter(([, count]) => count === highest);
}

// Stable hash used to vary the featured selection when the archive changes.
const FEATURED_LIMIT = 5;
const FEATURED_SNAPSHOT_KEY = "featured-highlights";
const UPDATES_SNAPSHOT_KEY = "highlight-updates";
const UPDATE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

type SnapshotValue = {
    title: string;
    titleParts: HighlightValuePart[];
    value: string;
    description: string;
    href: string;
    color: string | null;
    valueParts: HighlightValuePart[];
};

function normalizeParts(parts: HighlightValuePart[] = []) {
    return parts
        .map((part) => ({
            label: part.label,
            href: part.href ?? "",
        }))
        .sort((a, b) =>
            `${a.href}|${a.label}`.localeCompare(`${b.href}|${b.label}`),
        );
}

function getRecordFingerprint(record: HighlightRecord): string {
    return JSON.stringify({
        title: record.title,
        titleParts: record.titleParts ?? [],
        value: record.value,
        description: record.description ?? "",
        href: record.href ?? "",
        color: record.color ?? null,
        valueParts: record.valueParts ?? [],
    });
}

/**
 * Compares the actual result, not its presentation.
 * For multi-person records, the order of the same people doesn't matter.
 */
function getRecordResultKey(snapshot: SnapshotValue): string {
    if (snapshot.valueParts.length > 0) {
        return JSON.stringify(normalizeParts(snapshot.valueParts));
    }

    return snapshot.value.trim();
}

function parseSnapshotValue(fingerprint: string): SnapshotValue | null {
    try {
        const parsed = JSON.parse(fingerprint) as Partial<SnapshotValue>;

        if (
            typeof parsed.title !== "string" ||
            typeof parsed.value !== "string"
        ) {
            return null;
        }

        return {
            title: parsed.title,
            titleParts: Array.isArray(parsed.titleParts)
                ? parsed.titleParts
                : [],
            value: parsed.value,
            description: parsed.description ?? "",
            href: parsed.href ?? "",
            color: parsed.color ?? null,
            valueParts: Array.isArray(parsed.valueParts)
                ? parsed.valueParts
                : [],
        };
    } catch {
        return null;
    }
}

export type HighlightUpdate = {
    id: string;
    title: string;
    detectedAt: string;
    previous: SnapshotValue;
    current: SnapshotValue;
};

type FeaturedCandidate = {
    record: HighlightRecord;
    sectionId: string;
    colonistIds: Set<number>;
};

function getCurrentHighlightSnapshot(
    sections: HighlightSectionData[],
): Record<string, string> {
    const snapshot: Record<string, string> = {};

    for (const section of sections) {
        for (const record of section.records) {
            if (record.value === "No data") continue;

            snapshot[record.id] = getRecordFingerprint(record);
        }
    }

    return snapshot;
}

async function trackHighlightUpdates(
    sections: HighlightSectionData[],
): Promise<HighlightUpdate[]> {
    const currentSnapshot = getCurrentHighlightSnapshot(sections);
    const currentRecords = new Map<string, HighlightRecord>();

    for (const section of sections) {
        for (const record of section.records) {
            currentRecords.set(record.id, record);
        }
    }

    const previous = await prisma.highlightSnapshot.findUnique({
        where: { key: FEATURED_SNAPSHOT_KEY },
    });

    let newUpdates: HighlightUpdate[] = [];

    if (!previous) {
        // First run establishes a baseline instead of reporting every
        // existing highlight as a new change.
        await prisma.highlightSnapshot.create({
            data: {
                key: FEATURED_SNAPSHOT_KEY,
                value: JSON.stringify(currentSnapshot),
            },
        });
    } else {
        const previousSnapshot = JSON.parse(previous.value) as Record<
            string,
            string
        >;

        for (const section of sections) {
            for (const record of section.records) {
                currentRecords.set(record.id, record);
            }
        }

        const detectedAt = new Date().toISOString();

        for (const [id, fingerprint] of Object.entries(currentSnapshot)) {
            const previousFingerprint = previousSnapshot[id];

            // Only report changes to an existing highlight. New entries
            // aren't necessarily records that have changed hands.
            if (
                !previousFingerprint ||
                previousFingerprint === fingerprint
            ) {
                continue;
            }

            const oldValue = parseSnapshotValue(previousFingerprint);
            const record = currentRecords.get(id);
            const currentValue = parseSnapshotValue(fingerprint);

            if (!oldValue || !record || !currentValue) continue;

            // Ignore changes to formatting, descriptions, links, and ordering
            // when the actual record result is unchanged.
            if (
                getRecordResultKey(oldValue) ===
                getRecordResultKey(currentValue)
            ) {
                continue;
            }

            newUpdates.push({
                id,
                title: record.title,
                detectedAt,
                previous: oldValue,
                current: currentValue,
            });
        }

        // Advance the baseline regardless of whether the change is
        // interesting enough to produce a visible update.
        await prisma.highlightSnapshot.update({
            where: { key: FEATURED_SNAPSHOT_KEY },
            data: {
                value: JSON.stringify(currentSnapshot),
            },
        });
    }

    const historyRow = await prisma.highlightSnapshot.findUnique({
        where: { key: UPDATES_SNAPSHOT_KEY },
    });

    const now = Date.now();
    const cutoff = now - UPDATE_RETENTION_MS;

    let history: HighlightUpdate[] = [];

    if (historyRow) {
        try {
            const parsed = JSON.parse(historyRow.value) as HighlightUpdate[];
            if (Array.isArray(parsed)) history = parsed;
        } catch {
            // Recover gracefully if the stored history is malformed.
            history = [];
        }
    }

    history = history.filter((update) => {
        const timestamp = Date.parse(update.detectedAt);
        return Number.isFinite(timestamp) && timestamp >= cutoff;
    });

    history.push(...newUpdates);
    history.sort(
        (a, b) =>
            Date.parse(b.detectedAt) - Date.parse(a.detectedAt),
    );

    if (historyRow) {
        await prisma.highlightSnapshot.update({
            where: { key: UPDATES_SNAPSHOT_KEY },
            data: { value: JSON.stringify(history) },
        });
    } else {
        await prisma.highlightSnapshot.create({
            data: {
                key: UPDATES_SNAPSHOT_KEY,
                value: JSON.stringify(history),
            },
        });
    }

    return history;
}

async function selectFeaturedHighlights(
    sections: HighlightSectionData[],
): Promise<HighlightRecord[]> {
    const candidates: FeaturedCandidate[] = sections.flatMap((section) =>
        section.records
            .filter((record) => record.value !== "No data")
            .map((record) => ({
                record,
                sectionId: section.id,
                colonistIds: getFeaturedColonistIds(record),
            })),
    );

    if (candidates.length === 0) return [];

    // Featured is now a varied selection, independent of update tracking.
    const shuffled = candidates
        .map((candidate) => ({
            ...candidate,
            random: Math.random(),
        }))
        .sort((a, b) => a.random - b.random);

    const selected: typeof shuffled = [];
    const selectedIds = new Set<string>();
    const usedSections = new Set<string>();
    const usedColonists = new Set<number>();

    function trySelect(
        candidate: (typeof shuffled)[number],
        requireNewSection: boolean,
        requireNewColonists: boolean,
    ) {
        if (selected.length >= FEATURED_LIMIT) return;
        if (selectedIds.has(candidate.record.id)) return;

        if (
            requireNewSection &&
            usedSections.has(candidate.sectionId)
        ) {
            return;
        }

        if (
            requireNewColonists &&
            [...candidate.colonistIds].some((id) =>
                usedColonists.has(id),
            )
        ) {
            return;
        }

        selected.push(candidate);
        selectedIds.add(candidate.record.id);
        usedSections.add(candidate.sectionId);

        for (const id of candidate.colonistIds) {
            usedColonists.add(id);
        }
    }

    // Prefer variety across sections and colonists.
    for (const candidate of shuffled) {
        trySelect(candidate, true, true);
    }

    for (const candidate of shuffled) {
        trySelect(candidate, false, true);
    }

    // Relax the duplicate-colonist restriction only if needed.
    for (const candidate of shuffled) {
        trySelect(candidate, false, false);
    }

    return selected.map(({ record }) => record);
}

function getFeaturedColonistIds(record: HighlightRecord): Set<number> {
    const ids = new Set<number>();

    const addColonistId = (href?: string) => {
        const match = href?.match(/^\/colonists\/(\d+)$/);
        if (match) ids.add(Number(match[1]));
    };

    addColonistId(record.href);

    for (const part of record.valueParts ?? []) {
        addColonistId(part.href);
    }

    return ids;
}

export async function getHighlightsData() {
    const [colonists, relics] = await Promise.all([
        prisma.colonist.findMany({
            orderBy: { birthYear: "asc" },
            include: {
                parents: true,
                children: true,
                partnerARelationships: true,
                partnerBRelationships: true,
                legacy: true,
                foundedLegacy: true,
                colonistSkills: {
                    include: { skill: true },
                },
                colonistTraits: {
                    include: { trait: true },
                },
            },
        }),
        prisma.relic.findMany({
            include: {
                owner: true,
                ownershipHistory: {
                    include: {
                        colonist: {
                            include: { legacy: true },
                        },
                    },
                },
            },
        }),
    ]);

    const deadColonists = colonists.filter((colonist) => colonist.isDead);
    const livingColonists = colonists.filter((colonist) => !colonist.isDead);

    const colonistById = new Map(
        colonists.map((colonist) => [colonist.id, colonist]),
    );

    const discoveries = getColonyDiscoveries(colonists);

    const biologicalChildren = (colonist: (typeof colonists)[number]) =>
        colonist.children.filter((relationship) => relationship.type === "Biological");

    const biologicalParents = (colonist: (typeof colonists)[number]) =>
        colonist.parents.filter((relationship) => relationship.type === "Biological");

    const completeBirthDate = (colonist: (typeof colonists)[number]) =>
        colonist.birthYear !== null &&
        colonist.birthMonth !== null &&
        colonist.birthDay !== null;

    const completeDeathDate = (colonist: (typeof colonists)[number]) =>
        colonist.deathYear !== null &&
        colonist.deathMonth !== null &&
        colonist.deathDay !== null;

    const birthDateKey = (colonist: (typeof colonists)[number]) =>
        `${colonist.birthYear}-${colonist.birthMonth}-${colonist.birthDay}`;

    const deathDateKey = (colonist: (typeof colonists)[number]) =>
        `${colonist.deathYear}-${colonist.deathMonth}-${colonist.deathDay}`;

    const getBirthDay = (colonist: (typeof colonists)[number]) =>
        rimWorldDay(colonist.birthYear!, colonist.birthMonth!, colonist.birthDay!);

    const getDeathDay = (colonist: (typeof colonists)[number]) =>
        rimWorldDay(colonist.deathYear!, colonist.deathMonth!, colonist.deathDay!);

    // Descendants are unique biological descendants, not relationship rows.
    function countDescendants(colonist: (typeof colonists)[number]) {
        const visited = new Set<number>();
        const pending = [colonist.id];

        while (pending.length > 0) {
            const currentId = pending.pop()!;
            const current = colonistById.get(currentId);
            if (!current) continue;

            for (const relationship of biologicalChildren(current)) {
                if (relationship.childId === colonist.id) continue;
                if (visited.has(relationship.childId)) continue;

                visited.add(relationship.childId);
                pending.push(relationship.childId);
            }
        }

        return visited.size;
    }

    function countGrandchildren(colonist: (typeof colonists)[number]) {
        const ids = new Set<number>();

        for (const relationship of biologicalChildren(colonist)) {
            const child = colonistById.get(relationship.childId);
            if (!child) continue;

            for (const grandchild of biologicalChildren(child)) {
                ids.add(grandchild.childId);
            }
        }

        return ids.size;
    }

    function countSiblings(colonist: (typeof colonists)[number]) {
        const ids = new Set<number>();

        for (const relationship of biologicalParents(colonist)) {
            const parent = colonistById.get(relationship.parentId);
            if (!parent) continue;

            for (const childRelationship of biologicalChildren(parent)) {
                if (childRelationship.childId !== colonist.id) {
                    ids.add(childRelationship.childId);
                }
            }
        }

        return ids.size;
    }

    function countCoParents(colonist: (typeof colonists)[number]) {
        const ids = new Set<number>();

        for (const relationship of biologicalChildren(colonist)) {
            const child = colonistById.get(relationship.childId);
            if (!child) continue;

            for (const parent of biologicalParents(child)) {
                if (parent.parentId !== colonist.id) ids.add(parent.parentId);
            }
        }

        return ids.size;
    }

    function getPartnerIds(colonist: (typeof colonists)[number]) {
        const ids = new Set<number>();

        for (const relationship of colonist.partnerARelationships) {
            ids.add(relationship.partnerBId);
        }

        for (const relationship of colonist.partnerBRelationships) {
            ids.add(relationship.partnerAId);
        }

        return ids;
    }

    function countMarriages(colonist: (typeof colonists)[number]) {
        return (
            colonist.partnerARelationships.filter((relationship) => relationship.type === "Married").length +
            colonist.partnerBRelationships.filter((relationship) => relationship.type === "Married").length
        );
    }

    function countFormerPartners(colonist: (typeof colonists)[number]) {
        return (
            colonist.partnerARelationships.filter((relationship) => relationship.type === "Ex").length +
            colonist.partnerBRelationships.filter((relationship) => relationship.type === "Ex").length
        );
    }

    // Return every colonist tied for the highest positive score.
    function bestColonists(
        score: (colonist: (typeof colonists)[number]) => number,
    ) {
        const scored = colonists.map((colonist) => ({
            colonist,
            score: score(colonist),
        }));

        const highest = Math.max(0, ...scored.map((entry) => entry.score));
        if (highest <= 0) return [];

        return scored
            .filter((entry) => entry.score === highest)
            .map((entry) => entry.colonist);
    }

    // Keep the single-winner appearance when there is only one winner.
    // When there is a tie, show the shared score and list every winner.
    function colonistsRecord(
        id: string,
        title: string,
        winners: (typeof colonists)[number][],
        value: string,
        description: string,
        icon: HighlightRecord["icon"],
    ): HighlightRecord {
        const singleWinner = winners.length === 1 ? winners[0] : null;

        return {
            id,
            title,
            value: winners.length === 0
                ? "No data"
                : singleWinner
                    ? getName(singleWinner)
                    : value,
            href: singleWinner ? `/colonists/${singleWinner.id}` : undefined,
            color: singleWinner?.legacy?.color,
            imageURL: singleWinner?.imageURL ?? null,
            description: winners.length === 0
                ? "Not enough recorded data yet."
                : winners.length > 1
                    ? `${winners.length} colonists share this record.`
                    : description,
            icon,
            valueParts: winners.length > 1
                ? winners.map(colonistPart)
                : undefined,
        };
    }

    // Family and lineage
    const mostChildren = bestColonists(
        (colonist) => biologicalChildren(colonist).length,
    );
    const mostDescendants = bestColonists(countDescendants);
    const mostGrandchildren = bestColonists(countGrandchildren);
    const mostSiblings = bestColonists(countSiblings);
    const mostCoParents = bestColonists(countCoParents);

    const parentPairs = new Map<string, { ids: [number, number]; count: number }>();

    for (const child of colonists) {
        const parents = biologicalParents(child);
        if (parents.length !== 2) continue;

        const ids = parents
            .map((parent) => parent.parentId)
            .sort((a, b) => a - b) as [number, number];

        const key = `${ids[0]}-${ids[1]}`;
        const pair = parentPairs.get(key);

        if (pair) pair.count++;
        else parentPairs.set(key, { ids, count: 1 });
    }

    const highestPairCount = Math.max(
        0,
        ...[...parentPairs.values()].map((pair) => pair.count),
    );

    const mostProlificParentPairs = [...parentPairs.values()]
        .filter((pair) => pair.count === highestPairCount && pair.count > 0)
        .sort((a, b) => a.ids[0] - b.ids[0] || a.ids[1] - b.ids[1]);

    const familyRecords: HighlightRecord[] = [
        colonistsRecord(
            "most-children",
            "Most biological children",
            mostChildren,
            `${mostChildren.length > 0 ? biologicalChildren(mostChildren[0]).length : 0} biological children`,
            `${mostChildren.length > 0 ? biologicalChildren(mostChildren[0]).length : 0} biological children`,
            "users",
        ),
        ...mostProlificParentPairs.map((pair, index): HighlightRecord => {
            const parents = pair.ids
                .map((id) => colonistById.get(id))
                .filter((person): person is NonNullable<typeof person> => Boolean(person));

            return {
                id: `most-prolific-parents-${pair.ids.join("-")}`,
                title: mostProlificParentPairs.length > 1
                    ? `Most prolific parents (${index + 1})`
                    : "Most prolific parents",
                value: `${pair.count} children`,
                description: "Biological children shared by the same two recorded parents.",
                icon: "heart",
                valueParts: parents.map(colonistPart),
            };
        }),
        colonistsRecord(
            "most-descendants",
            "Most descendants",
            mostDescendants,
            `${mostDescendants.length > 0 ? countDescendants(mostDescendants[0]) : 0} unique biological descendants`,
            `${mostDescendants.length > 0 ? countDescendants(mostDescendants[0]) : 0} unique biological descendants`,
            "legacy",
        ),
        colonistsRecord(
            "most-grandchildren",
            "Most grandchildren",
            mostGrandchildren,
            `${mostGrandchildren.length > 0 ? countGrandchildren(mostGrandchildren[0]) : 0} biological grandchildren`,
            `${mostGrandchildren.length > 0 ? countGrandchildren(mostGrandchildren[0]) : 0} biological grandchildren`,
            "users",
        ),
        colonistsRecord(
            "most-siblings",
            "Most siblings",
            mostSiblings,
            `${mostSiblings.length > 0 ? countSiblings(mostSiblings[0]) : 0} recorded biological siblings`,
            `${mostSiblings.length > 0 ? countSiblings(mostSiblings[0]) : 0} recorded biological siblings`,
            "users",
        ),
        colonistsRecord(
            "most-co-parents",
            "Most different co-parents",
            mostCoParents,
            `${mostCoParents.length > 0 ? countCoParents(mostCoParents[0]) : 0} different biological co-parents`,
            `${mostCoParents.length > 0 ? countCoParents(mostCoParents[0]) : 0} different biological co-parents`,
            "heart",
        ),
        ...discoveries.deepestLineage,
    ];

    // Births and deaths by date
    const birthsByYear = new Map<number, number>();
    const deathsByYear = new Map<number, number>();
    const birthsByDay = new Map<string, { year: number; month: number; day: number; count: number }>();
    const deathsByDay = new Map<string, { year: number; month: number; day: number; count: number }>();
    const birthsByMonth = new Map<number, number>();
    const deathsByMonth = new Map<number, number>();
    const activity = new Map<number, { births: number; deaths: number }>();

    for (const colonist of colonists) {
        if (colonist.birthYear !== null) {
            birthsByYear.set(
                colonist.birthYear,
                (birthsByYear.get(colonist.birthYear) ?? 0) + 1,
            );

            const yearActivity = activity.get(colonist.birthYear) ?? {
                births: 0,
                deaths: 0,
            };

            yearActivity.births++;
            activity.set(colonist.birthYear, yearActivity);
        }

        if (colonist.birthMonth !== null) {
            birthsByMonth.set(
                colonist.birthMonth,
                (birthsByMonth.get(colonist.birthMonth) ?? 0) + 1,
            );
        }

        if (colonist.isDead && colonist.deathYear !== null) {
            deathsByYear.set(
                colonist.deathYear,
                (deathsByYear.get(colonist.deathYear) ?? 0) + 1,
            );

            if (colonist.deathMonth !== null) {
                deathsByMonth.set(
                    colonist.deathMonth,
                    (deathsByMonth.get(colonist.deathMonth) ?? 0) + 1,
                );
            }

            const yearActivity = activity.get(colonist.deathYear) ?? {
                births: 0,
                deaths: 0,
            };

            yearActivity.deaths++;
            activity.set(colonist.deathYear, yearActivity);
        }

        if (completeBirthDate(colonist)) {
            const key = birthDateKey(colonist);
            const existing = birthsByDay.get(key);

            if (existing) existing.count++;
            else {
                birthsByDay.set(key, {
                    year: colonist.birthYear!,
                    month: colonist.birthMonth!,
                    day: colonist.birthDay!,
                    count: 1,
                });
            }
        }

        if (colonist.isDead && completeDeathDate(colonist)) {
            const key = deathDateKey(colonist);
            const existing = deathsByDay.get(key);

            if (existing) existing.count++;
            else {
                deathsByDay.set(key, {
                    year: colonist.deathYear!,
                    month: colonist.deathMonth!,
                    day: colonist.deathDay!,
                    count: 1,
                });
            }
        }
    }

    function getTopDayEntries(
        entries: Map<string, { year: number; month: number; day: number; count: number }>,
    ) {
        const values = [...entries.values()];
        if (values.length === 0) return [];

        const highest = Math.max(...values.map((entry) => entry.count));
        return values
            .filter((entry) => entry.count === highest)
            .sort((a, b) =>
                a.year - b.year || a.month - b.month || a.day - b.day,
            );
    }

    const deadliestDays = getTopDayEntries(deathsByDay);
    const busiestBirthDays = getTopDayEntries(birthsByDay);
    const mostDeathsInYears = getAllMostFrequent(deathsByYear);
    const busiestBirthYears = getAllMostFrequent(birthsByYear);
    const busiestBirthMonths = getAllMostFrequent(birthsByMonth);
    const busiestDeathMonths = getAllMostFrequent(deathsByMonth);

    const datedLifespans = colonists.filter(
        (colonist) =>
            colonist.isDead &&
            completeBirthDate(colonist) &&
            completeDeathDate(colonist),
    );

    const lifespanDays = (colonist: (typeof colonists)[number]) =>
        getDeathDay(colonist) - getBirthDay(colonist);

    const longestDays = datedLifespans.length > 0
        ? Math.max(...datedLifespans.map(lifespanDays))
        : null;

    const shortestDays = datedLifespans.length > 0
        ? Math.min(...datedLifespans.map(lifespanDays))
        : null;

    const longestLived = longestDays === null
        ? []
        : datedLifespans.filter((colonist) => lifespanDays(colonist) === longestDays);

    const shortestLived = shortestDays === null
        ? []
        : datedLifespans.filter((colonist) => lifespanDays(colonist) === shortestDays);


    const activityYears: ActivityYear[] = [...activity.entries()]
        .sort(([a], [b]) => a - b)
        .map(([year, values]) => ({
            year,
            births: values.births,
            deaths: values.deaths,

            birthColonists: colonists
                .filter((colonist) => colonist.birthYear === year)
                .map((colonist) => ({
                    id: colonist.id,
                    firstName: colonist.firstName,
                    nickname: colonist.nickname,
                    lastName: colonist.lastName,
                    imageURL: colonist.imageURL,
                    legacy: colonist.legacy
                        ? {
                            name: colonist.legacy.name,
                            color: colonist.legacy.color,
                        }
                        : null,
                })),

            deathColonists: colonists
                .filter(
                    (colonist) =>
                        colonist.isDead && colonist.deathYear === year
                )
                .map((colonist) => ({
                    id: colonist.id,
                    firstName: colonist.firstName,
                    nickname: colonist.nickname,
                    lastName: colonist.lastName,
                    imageURL: colonist.imageURL,
                    legacy: colonist.legacy
                        ? {
                            name: colonist.legacy.name,
                            color: colonist.legacy.color,
                        }
                        : null,
                })),
        }));


    const populationChanges = activityYears.map((year) => ({
        ...year,
        change: year.births - year.deaths,
    }));

    const highestChange = populationChanges.length > 0
        ? Math.max(...populationChanges.map((entry) => entry.change))
        : null;

    const lowestChange = populationChanges.length > 0
        ? Math.min(...populationChanges.map((entry) => entry.change))
        : null;

    const greatestBoom = highestChange === null
        ? []
        : populationChanges.filter((entry) => entry.change === highestChange);

    const greatestLoss = lowestChange === null
        ? []
        : populationChanges.filter((entry) => entry.change === lowestChange);

    function dayValueParts(
        entries: { year: number; month: number; day: number; count: number }[],
    ): HighlightValuePart[] {
        return entries.map((entry) => ({
            label: formatDate(entry.year, entry.month, entry.day),
        }));
    }

    const dateRecords: HighlightRecord[] = [
        {
            id: "deadliest-day",
            title: "Deadliest day",
            value: deadliestDays.length > 1
                ? `${deadliestDays[0].count} deaths`
                : deadliestDays.length === 1
                    ? formatDate(
                        deadliestDays[0].year,
                        deadliestDays[0].month,
                        deadliestDays[0].day,
                    )
                    : "No data",
            description: deadliestDays.length > 1
                ? `Shared by ${deadliestDays.length} dates.`
                : deadliestDays.length === 1
                    ? `${deadliestDays[0].count} recorded deaths on this date.`
                    : "No complete death dates recorded.",
            icon: "calendar",
            valueParts: deadliestDays.length > 1
                ? dayValueParts(deadliestDays)
                : undefined,
        },
        {
            id: "busiest-birth-day",
            title: "Busiest birth day",
            value: busiestBirthDays.length > 1
                ? `${busiestBirthDays[0].count} births`
                : busiestBirthDays.length === 1
                    ? formatDate(
                        busiestBirthDays[0].year,
                        busiestBirthDays[0].month,
                        busiestBirthDays[0].day,
                    )
                    : "No data",
            description: busiestBirthDays.length > 1
                ? `Shared by ${busiestBirthDays.length} dates.`
                : busiestBirthDays.length === 1
                    ? `${busiestBirthDays[0].count} recorded births on this date.`
                    : "No complete birth dates recorded.",
            icon: "calendar",
            valueParts: busiestBirthDays.length > 1
                ? dayValueParts(busiestBirthDays)
                : undefined,
        },
        {
            id: "most-deaths-year",
            title: "Most deaths in a year",
            value: mostDeathsInYears.length > 0
                ? mostDeathsInYears.map(([year]) => String(year)).join(" · ")
                : "No data",
            description: mostDeathsInYears.length > 0
                ? `${mostDeathsInYears[0][1]} recorded deaths in each tied year.`
                : "No death years recorded.",
            icon: "calendar",
        },
        {
            id: "busiest-birth-year",
            title: "Busiest birth year",
            value: busiestBirthYears.length > 0
                ? busiestBirthYears.map(([year]) => String(year)).join(" · ")
                : "No data",
            description: busiestBirthYears.length > 0
                ? `${busiestBirthYears[0][1]} recorded births in each tied year.`
                : "No birth years recorded.",
            icon: "calendar",
        },
        {
            id: "birth-month",
            title: "Most common birth month",
            value: busiestBirthMonths.length > 0
                ? busiestBirthMonths
                    .map(([month]) => MONTHS[month - 1] ?? `Month ${month}`)
                    .join(" · ")
                : "No data",
            description: busiestBirthMonths.length > 0
                ? `${busiestBirthMonths[0][1]} births for each tied month.`
                : "No birth months recorded.",
            icon: "calendar",
        },
        {
            id: "death-month",
            title: "Most common death month",
            value: busiestDeathMonths.length > 0
                ? busiestDeathMonths
                    .map(([month]) => MONTHS[month - 1] ?? `Month ${month}`)
                    .join(" · ")
                : "No data",
            description: busiestDeathMonths.length > 0
                ? `${busiestDeathMonths[0][1]} deaths for each tied month.`
                : "No death months recorded.",
            icon: "calendar",
        },
        colonistsRecord(
            "longest-lived",
            "Longest-lived colonist",
            longestLived,
            longestDays === null ? "" : formatLifespan(longestDays),
            longestDays === null ? "" : formatLifespan(longestDays),
            "trophy",
        ),
        colonistsRecord(
            "shortest-lived",
            "Shortest-lived colonist",
            shortestLived,
            shortestDays === null ? "" : formatLifespan(shortestDays),
            shortestDays === null ? "" : formatLifespan(shortestDays),
            "calendar",
        ),
        {
            id: "greatest-boom",
            title: "Greatest yearly increase",
            value: greatestBoom.length > 0
                ? greatestBoom.map((entry) => String(entry.year)).join(" · ")
                : "No data",
            description: greatestBoom.length > 0
                ? `Net +${greatestBoom[0].change} in each tied year: ${greatestBoom[0].births} births and ${greatestBoom[0].deaths} deaths.`
                : "No dated birth or death activity recorded.",
            icon: "sparkles",
        },
        {
            id: "greatest-loss",
            title: "Greatest yearly decrease",
            value: greatestLoss.length > 0
                ? greatestLoss.map((entry) => String(entry.year)).join(" · ")
                : "No data",
            description: greatestLoss.length > 0
                ? `Net ${greatestLoss[0].change} in each tied year: ${greatestLoss[0].births} births and ${greatestLoss[0].deaths} deaths.`
                : "No dated birth or death activity recorded.",
            icon: "calendar",
        },
    ];

    // Legacy size and biological children
    const legacyStats = new Map<number, {
        name: string;
        color: string | null;
        members: number;
        biologicalChildren: number;
    }>();

    for (const colonist of colonists) {
        if (colonist.legacyId === null || colonist.legacy === null) continue;

        const stats = legacyStats.get(colonist.legacyId) ?? {
            name: colonist.legacy.name,
            color: colonist.legacy.color,
            members: 0,
            biologicalChildren: 0,
        };

        stats.members++;
        stats.biologicalChildren += biologicalChildren(colonist).length;
        legacyStats.set(colonist.legacyId, stats);
    }

    const legacyEntries = [...legacyStats.entries()];

    const largestLegacyCount = Math.max(
        0,
        ...legacyEntries.map(([, stats]) => stats.members),
    );

    const mostProlificLegacyCount = Math.max(
        0,
        ...legacyEntries.map(([, stats]) => stats.biologicalChildren),
    );

    const largestLegacies = legacyEntries
        .filter(([, stats]) => stats.members === largestLegacyCount && stats.members > 0)
        .sort((a, b) => a[1].name.localeCompare(b[1].name));

    const mostProlificLegacies = legacyEntries
        .filter(([, stats]) =>
            stats.biologicalChildren === mostProlificLegacyCount &&
            stats.biologicalChildren > 0,
        )
        .sort((a, b) => a[1].name.localeCompare(b[1].name));

    function legacyParts(
        entries: typeof largestLegacies,
    ): HighlightValuePart[] {
        return entries.map(([id, stats]) => ({
            label: stats.name,
            href: `/legacies/${id}`,
            color: stats.color,
        }));
    }

    const legacyRecords: HighlightRecord[] = [
        {
            id: "largest-legacy",
            title: "Largest legacy",
            value: largestLegacies.length === 0
                ? "No data"
                : largestLegacies.length === 1
                    ? largestLegacies[0][1].name
                    : `${largestLegacyCount} members`,
            href: largestLegacies.length === 1
                ? `/legacies/${largestLegacies[0][0]}`
                : undefined,
            color: largestLegacies.length === 1
                ? largestLegacies[0][1].color
                : undefined,
            description: largestLegacies.length > 0
                ? largestLegacies.length > 1
                    ? `${largestLegacies.length} legacies share this record.`
                    : `${largestLegacyCount} recorded members.`
                : "No legacy members recorded.",
            icon: "legacy",
            valueParts: largestLegacies.length > 1 ? legacyParts(largestLegacies) : undefined,
        },
        {
            id: "most-prolific-legacy",
            title: "Most prolific legacy",
            value: mostProlificLegacies.length === 0
                ? "No data"
                : mostProlificLegacies.length === 1
                    ? mostProlificLegacies[0][1].name
                    : `${mostProlificLegacyCount} biological children`,
            href: mostProlificLegacies.length === 1
                ? `/legacies/${mostProlificLegacies[0][0]}`
                : undefined,
            color: mostProlificLegacies.length === 1
                ? mostProlificLegacies[0][1].color
                : undefined,
            description: mostProlificLegacies.length > 0
                ? mostProlificLegacies.length > 1
                    ? `${mostProlificLegacies.length} legacies share this record.`
                    : `${mostProlificLegacyCount} biological children born to members of this legacy.`
                : "No legacy members recorded.",
            icon: "legacy",
            valueParts: mostProlificLegacies.length > 1
                ? legacyParts(mostProlificLegacies)
                : undefined,
        },
    ];

    // Relationships
    const mostPartners = bestColonists((colonist) => getPartnerIds(colonist).size);
    const mostMarriages = bestColonists(countMarriages);
    const mostFormerPartners = bestColonists(countFormerPartners);

    const relationshipRecords: HighlightRecord[] = [
        colonistsRecord(
            "most-partners",
            "Most recorded partners",
            mostPartners,
            `${mostPartners.length > 0 ? getPartnerIds(mostPartners[0]).size : 0} different recorded partners`,
            `${mostPartners.length > 0 ? getPartnerIds(mostPartners[0]).size : 0} different recorded partners`,
            "heart",
        ),
        colonistsRecord(
            "most-marriages",
            "Most marriages",
            mostMarriages,
            `${mostMarriages.length > 0 ? countMarriages(mostMarriages[0]) : 0} recorded marriages`,
            `${mostMarriages.length > 0 ? countMarriages(mostMarriages[0]) : 0} recorded marriages`,
            "heart",
        ),
        colonistsRecord(
            "most-former-partners",
            "Most former partners",
            mostFormerPartners,
            `${mostFormerPartners.length > 0
                ? `${countFormerPartners(mostFormerPartners[0])} former ${countFormerPartners(mostFormerPartners[0]) === 1 ? "partner" : "partners"}`
                : "0 former partners"}`,
            `${mostFormerPartners.length > 0 ? countFormerPartners(mostFormerPartners[0]) : 0} recorded former partnerships`,
            "heart",
        ),
    ];

    // Relic ownership history. Each tied relic gets its own linked record.
    const relicsWithHistory = relics
        .filter((relic) => relic.ownershipHistory.length > 0)
        .map((relic) => ({
            relic,
            entries: relic.ownershipHistory.slice().sort((a, b) => a.order - b.order),
        }));

    const longestOwnershipCount = Math.max(
        0,
        ...relicsWithHistory.map(({ entries }) => entries.length),
    );

    const longestOwnershipRelics = relicsWithHistory
        .filter(({ entries }) => entries.length === longestOwnershipCount && entries.length > 0)
        .sort((a, b) => a.relic.name.localeCompare(b.relic.name));

    const relicRecords: HighlightRecord[] = longestOwnershipRelics.length > 0
        ? longestOwnershipRelics.map(({ relic, entries }): HighlightRecord => {
            const distinctOwners = new Set(entries.map((entry) => entry.colonistId));

            return {
                id: `longest-ownership-chain-${relic.id}`,
                title: longestOwnershipRelics.length > 1
                    ? "Longest recorded relic ownership chain (tied)"
                    : "Longest recorded relic ownership chain",
                value: relic.name,
                href: `/relics/${relic.id}`,
                imageURL: relic.primaryImageURL ?? null,
                description: `${entries.length} recorded ownership entries across ${distinctOwners.size} distinct owners.`,
                icon: "relic",
                valueParts: entries.map((entry) => colonistPart(entry.colonist)),
            };
        })
        : [
            {
                id: "longest-ownership-chain",
                title: "Longest recorded relic ownership chain",
                value: "No data",
                description: "No relic ownership histories recorded.",
                icon: "relic",
            },
        ];

    // Database-derived Firsts. These are earliest complete recorded dates,
    // not claims about unrecorded events.
    const birthCandidates = colonists.filter(completeBirthDate);
    const deathCandidates = deadColonists.filter(completeDeathDate);

    const earliestBirthDay = birthCandidates.length > 0
        ? Math.min(...birthCandidates.map(getBirthDay))
        : null;

    const earliestDeathDay = deathCandidates.length > 0
        ? Math.min(...deathCandidates.map(getDeathDay))
        : null;

    const earliestBirths = earliestBirthDay === null
        ? []
        : birthCandidates.filter((colonist) => getBirthDay(colonist) === earliestBirthDay);

    const earliestDeaths = earliestDeathDay === null
        ? []
        : deathCandidates.filter((colonist) => getDeathDay(colonist) === earliestDeathDay);

    // First child of each legacy's founder who also belongs to that legacy.
    const firstLegacyChildren: HighlightRecord[] = colonists.flatMap(
        (founder): HighlightRecord[] => {
            const legacy = founder.foundedLegacy;

            if (!legacy) return [];

            const eligibleChildren = biologicalChildren(founder)
                .map((relationship) =>
                    colonistById.get(relationship.childId),
                )
                .filter(
                    (child): child is NonNullable<typeof child> =>
                        child !== undefined,
                )
                .filter(
                    (child) =>
                        child.legacyId === legacy.id &&
                        child.birthYear !== null,
                );

            if (eligibleChildren.length === 0) return [];

            // A known birth year is enough to establish the earliest
            // possible year, even when the exact date is incomplete.
            const earliestYear = Math.min(
                ...eligibleChildren.map((child) => child.birthYear!),
            );

            const candidates = eligibleChildren.filter(
                (child) => child.birthYear === earliestYear,
            );

            // If any candidate in the earliest year has an incomplete date,
            // we cannot reliably establish their exact order within that year.
            const hasIncompleteDate = candidates.some(
                (child) => !completeBirthDate(child),
            );

            let winners = candidates;

            if (!hasIncompleteDate) {
                const earliestDay = Math.min(
                    ...candidates.map(getBirthDay),
                );

                winners = candidates.filter(
                    (child) => getBirthDay(child) === earliestDay,
                );
            }

            const dateDescription = hasIncompleteDate
                ? `Earliest recorded birth year: ${earliestYear}. Exact birth order is uncertain because one or more dates are incomplete.`
                : `Born ${formatDate(
                    winners[0].birthYear!,
                    winners[0].birthMonth!,
                    winners[0].birthDay!,
                )}.`;

            const founderName = getName(founder);

            if (winners.length === 1) {
                const child = winners[0];

                return [{
                    id: `first-child-legacy-${legacy.id}`,
                    title: "First child of",
                    titleParts: [
                        {
                            label: legacy.name,
                            color: legacy.color,
                        },
                    ],
                    value: getName(child),
                    href: `/colonists/${child.id}`,
                    color: child.legacy?.color ?? legacy.color,
                    imageURL: child.imageURL ?? null,
                    description:
                        `First recorded biological child of ${founderName} ` +
                        `to carry the ${legacy.name} legacy. ${dateDescription}`,
                    icon: "legacy",
                }];
            }

            return [{
                id: `first-child-legacy-${legacy.id}`,
                title: "First child of",
                titleParts: [
                    {
                        label: legacy.name,
                        color: legacy.color,
                    },
                ],
                value: `${winners.length} possible first children`,
                description:
                    `These children are the earliest recorded candidates ` +
                    `of ${founderName} to carry the ${legacy.name} legacy. ` +
                    dateDescription,
                icon: "legacy",
                valueParts: winners.map(colonistPart),
            }];
        },
    );

    const firstRecords: HighlightRecord[] = [
        ...firstLegacyChildren,
        colonistsRecord(
            "first-recorded-birth",
            "Earliest recorded birth",
            earliestBirths,
            `${earliestBirths.length} tied colonists`,
            earliestBirths.length > 0
                ? formatDate(
                    earliestBirths[0].birthYear!,
                    earliestBirths[0].birthMonth!,
                    earliestBirths[0].birthDay!,
                )
                : "No complete birth date is recorded.",
            "sparkles",
        ),
        colonistsRecord(
            "first-recorded-death",
            "Earliest recorded death",
            earliestDeaths,
            `${earliestDeaths.length} tied colonists`,
            earliestDeaths.length > 0
                ? formatDate(
                    earliestDeaths[0].deathYear!,
                    earliestDeaths[0].deathMonth!,
                    earliestDeaths[0].deathDay!,
                )
                : "No complete death date is recorded.",
            "calendar",
        ),
    ];

    const membersByLegacy = new Map<
        number,
        typeof colonists
    >();

    for (const colonist of colonists) {
        if (
            colonist.legacyId === null ||
            colonist.legacy === null
        ) {
            continue;
        }

        const members =
            membersByLegacy.get(colonist.legacyId) ?? [];

        members.push(colonist);
        membersByLegacy.set(
            colonist.legacyId,
            members
        );
    }

    function getLatestBirthMembers(
        members: typeof colonists
    ) {
        const datedMembers = members.filter(
            (colonist) =>
                colonist.birthYear !== null
        );

        if (datedMembers.length === 0) {
            return [];
        }

        const latestYear = Math.max(
            ...datedMembers.map(
                (colonist) => colonist.birthYear!
            )
        );

        const candidates = datedMembers.filter(
            (colonist) =>
                colonist.birthYear === latestYear
        );

        // If any date in the latest year is incomplete,
        // don't guess which colonist is youngest.
        if (
            !candidates.every(completeBirthDate)
        ) {
            return candidates;
        }

        const latestDay = Math.max(
            ...candidates.map(getBirthDay)
        );

        return candidates.filter(
            (colonist) =>
                getBirthDay(colonist) === latestDay
        );
    }

    function getLatestDeathMembers(
        members: typeof colonists
    ) {
        const datedMembers = members.filter(
            (colonist) =>
                colonist.isDead &&
                colonist.deathYear !== null
        );

        if (datedMembers.length === 0) {
            return [];
        }

        const latestYear = Math.max(
            ...datedMembers.map(
                (colonist) => colonist.deathYear!
            )
        );

        const candidates = datedMembers.filter(
            (colonist) =>
                colonist.deathYear === latestYear
        );

        // Preserve ties when an exact comparison
        // isn't possible because a date is incomplete.
        if (
            !candidates.every(completeDeathDate)
        ) {
            return candidates;
        }

        const latestDay = Math.max(
            ...candidates.map(getDeathDay)
        );

        return candidates.filter(
            (colonist) =>
                getDeathDay(colonist) === latestDay
        );
    }


    function makeLastRecord(
        id: string,
        title: string,
        legacyName: string,
        legacyColor: string | null,
        winners: typeof colonists,
        dateLabel: string,
        icon: HighlightRecord["icon"]
    ): HighlightRecord {
        const first = winners[0];

        const titleParts: HighlightValuePart[] = [
            {
                label: legacyName,
                color: legacyColor,
            },
        ];

        if (winners.length === 1) {
            return {
                id,
                title,
                titleParts,
                value: getName(first),
                href: `/colonists/${first.id}`,
                color: first.legacy?.color ?? legacyColor,
                imageURL: first.imageURL ?? null,
                description: dateLabel,
                icon,
            };
        }

        return {
            id,
            title,
            titleParts,
            value: `${winners.length} colonists`,
            color: first.legacy?.color ?? legacyColor,
            description: `${dateLabel}. ${winners.length} colonists share this record.`,
            icon,
            valueParts: winners.map(colonistPart),
        };
    }


    const youngestMemberRecords: HighlightRecord[] = [];
    const latestDeathRecords: HighlightRecord[] = [];

    for (const [legacyId, members] of membersByLegacy) {
        const legacy = members[0].legacy!;

        const youngestMembers =
            getLatestBirthMembers(members);

        if (youngestMembers.length > 0) {
            const birthYear =
                youngestMembers[0].birthYear!;

            const hasCompleteDates =
                youngestMembers.every(
                    completeBirthDate
                );

            const dateLabel = hasCompleteDates
                ? `Born ${formatDate(
                    youngestMembers[0].birthYear!,
                    youngestMembers[0].birthMonth!,
                    youngestMembers[0].birthDay!
                )}`
                : `Latest recorded birth year: ${birthYear}`;

            youngestMemberRecords.push(
                makeLastRecord(
                    `last-youngest-${legacyId}`,
                    "Youngest member of",
                    legacy.name,
                    legacy.color,
                    youngestMembers,
                    dateLabel,
                    "users"
                )
            );
        }

        const latestDeaths =
            getLatestDeathMembers(members);

        if (latestDeaths.length > 0) {
            const deathYear =
                latestDeaths[0].deathYear!;

            const hasCompleteDates =
                latestDeaths.every(
                    completeDeathDate
                );

            const dateLabel = hasCompleteDates
                ? `Died ${formatDate(
                    latestDeaths[0].deathYear!,
                    latestDeaths[0].deathMonth!,
                    latestDeaths[0].deathDay!
                )}`
                : `Latest recorded death year: ${deathYear}`;

            latestDeathRecords.push(
                makeLastRecord(
                    `last-death-${legacyId}`,
                    "Latest death in",
                    legacy.name,
                    legacy.color,
                    latestDeaths,
                    dateLabel,
                    "calendar"
                )
            );
        }
    }

    // Show the most recent birth/death years first.
    youngestMemberRecords.sort((a, b) => {
        const aYear = membersByLegacy
            .get(Number(a.id.replace("last-youngest-", "")))!
            .find((colonist) =>
                colonist.id === Number(a.href?.split("/").pop())
            )?.birthYear ?? 0;

        const bYear = membersByLegacy
            .get(Number(b.id.replace("last-youngest-", "")))!
            .find((colonist) =>
                colonist.id === Number(b.href?.split("/").pop())
            )?.birthYear ?? 0;

        return bYear - aYear;
    });

    latestDeathRecords.sort((a, b) => {
        const aLegacyId = Number(
            a.id.replace("last-death-", "")
        );
        const bLegacyId = Number(
            b.id.replace("last-death-", "")
        );

        const aYear = Math.max(
            ...membersByLegacy
                .get(aLegacyId)!
                .filter(
                    (colonist) =>
                        colonist.isDead &&
                        colonist.deathYear !== null
                )
                .map((colonist) => colonist.deathYear!)
        );

        const bYear = Math.max(
            ...membersByLegacy
                .get(bLegacyId)!
                .filter(
                    (colonist) =>
                        colonist.isDead &&
                        colonist.deathYear !== null
                )
                .map((colonist) => colonist.deathYear!)
        );

        return bYear - aYear;
    });

    const lastsRecords: HighlightRecord[] = [
        ...youngestMemberRecords,
        ...latestDeathRecords,
    ];

    const sections: HighlightSectionData[] = [
        {
            id: "family",
            title: "Family & lineage",
            description: "The family connections that shaped the colony.",
            records: familyRecords,
        },
        {
            id: "skills",
            title: "Skills & talents",
            description: "The standout skills and passions recorded among the colony.",
            records: discoveries.skillRecords,
        },
        {
            id: "traits",
            title: "Traits",
            description: "Uncommon traits that make individual colonists stand out.",
            records: discoveries.traitRecords,
        },
        {
            id: "history",
            title: "Births & deaths",
            description: "The dates and years that stand out in the colony's recorded history.",
            records: dateRecords,
        },
        {
            id: "legacies",
            title: "Legacies",
            description: "The family names with the largest presence and most recorded descendants by birth.",
            records: legacyRecords,
        },
        {
            id: "relationships",
            title: "Relationships",
            description: "Long-running histories of partnership and marriage.",
            records: relationshipRecords,
        },
        {
            id: "relics",
            title: "Relics",
            description: "The relics whose ownership histories stretch the furthest.",
            records: relicRecords,
        },
        {
            id: "firsts",
            title: "Firsts",
            description: "Earliest events that can be established from complete dates currently in the database.",
            records: firstRecords,
        },
        {
            id: "lasts",
            title: "Lasts",
            description:
                "The youngest recorded members and most recent deaths in each legacy.",
            records: lastsRecords,
        },
    ];

    const [featured, updates] = await Promise.all([
        selectFeaturedHighlights(sections),
        trackHighlightUpdates(sections),
    ]);

    return {
        totals: {
            colonists: colonists.length,
            living: livingColonists.length,
            dead: deadColonists.length,
            legacies: legacyStats.size,
            relics: relics.length,
        },
        sections,
        featured,
        updates,
        activityYears,
    };
}

export type HighlightsData = Awaited<ReturnType<typeof getHighlightsData>>;