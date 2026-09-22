import { prisma } from "@/lib/prisma";
import CompatibilityFinder from "./CompatibilityFinder";

export const dynamic = "force-dynamic";

export default async function CompatibilityPage() {
    const colonists = await prisma.colonist.findMany({
        orderBy: [
            { lastName: "asc" },
            { firstName: "asc" },
        ],
        select: {
            id: true,
            firstName: true,
            nickname: true,
            lastName: true,
            title: true,
            gender: true,
            isDead: true,
            imageURL: true,

            legacy: {
                select: {
                    name: true,
                    color: true,
                },
            },

            // Only biological parents count toward blood relation.
            parents: {
                where: {
                    type: "Biological",
                },
                select: {
                    parentId: true,
                },
            },

            partnerARelationships: {
                where: {
                    type: {
                        in: ["Lover", "Married"],
                    },
                },
                select: {
                    partnerBId: true,
                },
            },

            partnerBRelationships: {
                where: {
                    type: {
                        in: ["Lover", "Married"],
                    },
                },
                select: {
                    partnerAId: true,
                },
            },
        },
    });

    /*
     * Map each colonist to their biological parents.
     */
    const parentMap = new Map<number, number[]>();

    for (const colonist of colonists) {
        parentMap.set(
            colonist.id,
            colonist.parents.map((parent) => parent.parentId)
        );
    }

    /*
     * Get all biological ancestors within three generations.
     *
     * 1 = parent
     * 2 = grandparent
     * 3 = great-grandparent
     *
     * If the same ancestor is reached through multiple paths,
     * retain the shortest distance.
     */
    function getAncestors(colonistId: number) {
        const ancestors = new Map<number, number>();
        const queue: { id: number; generation: number }[] = [];

        const parents = parentMap.get(colonistId) ?? [];

        for (const parentId of parents) {
            queue.push({
                id: parentId,
                generation: 1,
            });
        }

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.generation > 3) {
                continue;
            }

            const existing = ancestors.get(current.id);

            if (
                existing !== undefined &&
                existing <= current.generation
            ) {
                continue;
            }

            ancestors.set(current.id, current.generation);

            const grandparents = parentMap.get(current.id) ?? [];

            for (const parentId of grandparents) {
                queue.push({
                    id: parentId,
                    generation: current.generation + 1,
                });
            }
        }

        return Array.from(ancestors.entries()).map(
            ([id, generation]) => ({
                id,
                generation,
            })
        );
    }

    /*
     * Only living colonists can be selected as potential matches.
     */
    const livingColonists = colonists.filter(
        (colonist) => !colonist.isDead
    );

    const colonistData = livingColonists.map((colonist) => ({
        id: colonist.id,
        firstName: colonist.firstName,
        nickname: colonist.nickname,
        lastName: colonist.lastName,
        title: colonist.title,
        gender: colonist.gender,
        imageURL: colonist.imageURL,
        legacy: colonist.legacy,

        // A colonist is partnered if they have a current
        // Lover or Married relationship recorded on either side.
        isPartnered:
            colonist.partnerARelationships.length > 0 ||
            colonist.partnerBRelationships.length > 0,

        ancestors: getAncestors(colonist.id),
    }));

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <CompatibilityFinder colonists={colonistData} />
        </main>
    );
}