
import type { HighlightRecord, HighlightValuePart } from "./highlights-data";

type DiscoveryColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    legacy: { color: string | null } | null;
    parents: { parentId: number; type: string }[];
    children: { childId: number; type: string }[];
    colonistSkills: {
        level: number;
        passion: string;
        isKnown: boolean;
        skill: { name: string };
    }[];
    colonistTraits: {
        trait: { name: string | null; defName: string };
    }[];
};

function getName(colonist: DiscoveryColonist): string {
    const firstName = colonist.firstName.trim();
    const nickname = colonist.nickname?.trim();
    const lastName = colonist.lastName.trim();

    const name = nickname && nickname !== firstName
        ? `${firstName} "${nickname}"`
        : firstName;

    return `${name} ${lastName}`.trim();
}

function colonistPart(
    colonist: DiscoveryColonist,
): HighlightValuePart {
    return {
        label: getName(colonist),
        href: `/colonists/${colonist.id}`,
        color: colonist.legacy?.color ?? null,
    };
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function colonistRecord(
    id: string,
    title: string,
    value: string,
    winners: DiscoveryColonist[],
    description: string,
    icon: HighlightRecord["icon"] = "sparkles",
): HighlightRecord {
    return {
        id,
        title,
        value,
        description,
        icon,
        ...(winners.length === 1
            ? {
                href: `/colonists/${winners[0].id}`,
                color: winners[0].legacy?.color ?? null,
            }
            : {}),
        valueParts: winners.map(colonistPart),
    };
}

function getBiologicalParents(
    colonist: DiscoveryColonist,
    colonistById: Map<number, DiscoveryColonist>,
): DiscoveryColonist[] {
    return colonist.parents
        .filter((parent) => parent.type === "Biological")
        .map((parent) => colonistById.get(parent.parentId))
        .filter(
            (parent): parent is DiscoveryColonist =>
                parent !== undefined,
        );
}

export function getColonyDiscoveries(
    colonists: DiscoveryColonist[],
) {
    const colonistById = new Map(
        colonists.map((colonist) => [colonist.id, colonist]),
    );

    // Calculate biological lineage depth with cycle protection.
    const depthCache = new Map<number, number>();
    const calculating = new Set<number>();

    function getLineageDepth(colonist: DiscoveryColonist): number {
        const cached = depthCache.get(colonist.id);
        if (cached !== undefined) return cached;

        // Malformed or circular parent links must not cause infinite recursion.
        if (calculating.has(colonist.id)) return 0;

        calculating.add(colonist.id);

        const parents = getBiologicalParents(colonist, colonistById);
        const depth =
            parents.length === 0
                ? 0
                : 1 +
                Math.max(
                    ...parents.map((parent) => getLineageDepth(parent)),
                );

        calculating.delete(colonist.id);
        depthCache.set(colonist.id, depth);

        return depth;
    }

    const depths = colonists.map((colonist) => ({
        colonist,
        depth: getLineageDepth(colonist),
    }));

    const deepestDepth = Math.max(
        0,
        ...depths.map((entry) => entry.depth),
    );

    const deepestWinners =
        deepestDepth > 0
            ? depths
                .filter((entry) => entry.depth === deepestDepth)
                .map((entry) => entry.colonist)
            : [];

    const deepestLineage: HighlightRecord[] =
        deepestWinners.length > 0
            ? [
                colonistRecord(
                    "deepest-lineage",
                    "Deepest recorded lineage",
                    `${deepestDepth} generations`,
                    deepestWinners,
                    deepestWinners.length === 1
                        ? `${deepestDepth} generations of recorded biological ancestry.`
                        : `${deepestWinners.length} colonists share the deepest recorded biological lineage.`,
                ),
            ]
            : [];

    // Highest known positive skill level, preserving all tied colonists.
    const highestBySkill = new Map<
        string,
        { level: number; winners: DiscoveryColonist[] }
    >();

    for (const colonist of colonists) {
        for (const entry of colonist.colonistSkills) {
            if (!entry.isKnown || entry.level <= 0) continue;

            const skillName = entry.skill.name;
            const current = highestBySkill.get(skillName);

            if (!current || entry.level > current.level) {
                highestBySkill.set(skillName, {
                    level: entry.level,
                    winners: [colonist],
                });
            } else if (entry.level === current.level) {
                if (!current.winners.some((winner) => winner.id === colonist.id)) {
                    current.winners.push(colonist);
                }
            }
        }
    }

    const skillRecords: HighlightRecord[] = [
        ...[...highestBySkill.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([skillName, result]) =>
                colonistRecord(
                    `highest-skill-${slugify(skillName)}`,
                    `Highest ${skillName}`,
                    `Level ${result.level}`,
                    result.winners,
                    result.winners.length === 1
                        ? `Highest recorded ${skillName} level among known skills.`
                        : `${result.winners.length} colonists share the highest recorded ${skillName} level.`,
                    "trophy",
                ),
            ),
    ];

    // Preserve all colonists tied for the most burning passions.
    const burningCounts = colonists.map((colonist) => ({
        colonist,
        count: colonist.colonistSkills.filter(
            (skill) => skill.isKnown && skill.passion === "Major",
        ).length,
    }));

    const mostBurning = Math.max(
        0,
        ...burningCounts.map((entry) => entry.count),
    );

    const burningWinners =
        mostBurning > 0
            ? burningCounts
                .filter((entry) => entry.count === mostBurning)
                .map((entry) => entry.colonist)
            : [];

    if (burningWinners.length > 0) {
        skillRecords.push(
            colonistRecord(
                "most-burning-passions",
                "Most burning passions",
                `${mostBurning} burning passions`,
                burningWinners,
                `${burningWinners.length} colonist${burningWinners.length === 1 ? "" : "s"} share the highest recorded number of burning passions.`,
                "sparkles",
            ),
        );
    }

    // Count each trait at most once per colonist.
    const traitCounts = new Map<
        string,
        { name: string; colonists: DiscoveryColonist[] }
    >();

    for (const colonist of colonists) {
        const seenByColonist = new Set<string>();

        for (const entry of colonist.colonistTraits) {
            const key = entry.trait.defName;
            if (seenByColonist.has(key)) continue;
            seenByColonist.add(key);

            const name = entry.trait.name || entry.trait.defName;
            const current = traitCounts.get(key);

            if (current) {
                current.colonists.push(colonist);
            } else {
                traitCounts.set(key, {
                    name,
                    colonists: [colonist],
                });
            }
        }
    }

    const traitEntries = [...traitCounts.entries()];
    const uniqueTraits = traitEntries.filter(
        ([, entry]) => entry.colonists.length === 1,
    );

    const rarestCount =
        traitEntries.length > 0
            ? Math.min(
                ...traitEntries.map(([, entry]) => entry.colonists.length),
            )
            : 0;

    // Prefer every unique trait. If none exist, show every trait tied
    // for the lowest recorded frequency instead.
    const rareTraits =
        uniqueTraits.length > 0
            ? uniqueTraits
            : traitEntries.filter(
                ([, entry]) => entry.colonists.length === rarestCount,
            );

    const traitRecords: HighlightRecord[] = rareTraits
        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
        .map(([key, entry]) => ({
            id: `rare-trait-${slugify(key)}`,
            title:
                entry.colonists.length === 1
                    ? "Unique recorded trait"
                    : "Rarest recorded trait",
            value: entry.name,
            description: `Recorded on ${entry.colonists.length} colonist${entry.colonists.length === 1 ? "" : "s"}.`,
            icon: "sparkles",
            valueParts: entry.colonists.map(colonistPart),
        }));

    return {
        deepestLineage,
        skillRecords,
        traitRecords,
    };
}
