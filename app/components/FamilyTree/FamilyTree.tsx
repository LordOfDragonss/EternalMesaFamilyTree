"use client";

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import FamilyTreeSearch from "./FamilyTreeSearch";
import FamilyTreeConnections from "./FamilyTreeConnections";
import FamilyTreeNode from "./FamilyTreeNode";
import FamilyTreeNavigation from "./FamilyTreeNavigation";

type FamilyTreeColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    isDead: boolean;
    imageURL: string | null;
    legacy: {
        name: string;
        color: string | null;
    } | null;
};

type FamilyTreeParentChild = {
    parentId: number;
    childId: number;
    type: "Biological" | "Surrogate" | "Other";
};

type FamilyTreePartnership = {
    partnerAId: number;
    partnerBId: number;
    type: "Lover" | "Married" | "Ex";
};

type Props = {
    colonists: FamilyTreeColonist[];
    parentChildren: FamilyTreeParentChild[];
    partnerships: FamilyTreePartnership[];
};

type PositionedNode = {
    colonist: FamilyTreeColonist;
    x: number;
    y: number;
    generation: number;
};

type LayoutGroup = {
    id: number;
    memberIds: number[];
    generation: number;
    isPartnershipGroup: boolean;
};

type SiblingCluster = {
    id: number;
    memberIds: number[];
    generation: number;
    parentIds: number[];
};

const nodeWidth = 208;
const nodeHeight = 100;

const xGap = 70;
const yGap = 220;

const minimumNodeSpacing =
    nodeWidth + xGap;

const partnerSpacing = 30;

const componentGap = 180;

const minZoom = 0.3;
const maxZoom = 2.2;

/*
 * ---------------------------------------------------------
 * Layout debugging
 * ---------------------------------------------------------
 *
 * Set to false once we're done diagnosing the ordering.
 */
const DEBUG_LAYOUT = true;

function getColonistName(
    colonist: FamilyTreeColonist
) {
    return `${colonist.firstName}${colonist.nickname
        ? ` "${colonist.nickname}"`
        : ""
        } ${colonist.lastName}`;
}

/*
 * A colonist is relevant to layout debugging if they are part
 * of an actual family branch.
 *
 * Relevant:
 * - has parents
 * - has children
 * - has a partner AND that partner has parents or children
 *
 * This deliberately does NOT treat an isolated partner-only
 * couple as a relevant branch.
 *
 * Completely standalone colonists:
 * - no parents
 * - no children
 * - no partner with family connections
 *
 * are omitted from debug output only.
 */
function isDebugRelevantColonist(
    id: number,
    parentsMap: Map<number, number[]>,
    childrenMap: Map<number, number[]>,
    partnershipMap: Map<number, Set<number>>
) {
    const hasParents =
        (parentsMap.get(id)?.length ?? 0) > 0;

    const hasChildren =
        (childrenMap.get(id)?.length ?? 0) > 0;

    if (hasParents || hasChildren) {
        return true;
    }

    const partners =
        partnershipMap.get(id) ??
        new Set<number>();

    return [...partners].some((partnerId) => {
        const partnerHasParents =
            (parentsMap.get(partnerId)?.length ?? 0) > 0;

        const partnerHasChildren =
            (childrenMap.get(partnerId)?.length ?? 0) > 0;

        return (
            partnerHasParents ||
            partnerHasChildren
        );
    });
}

function getDebugName(
    id: number,
    colonistMap: Map<number, FamilyTreeColonist>
) {
    const colonist =
        colonistMap.get(id);

    return colonist
        ? `${getColonistName(colonist)} [${id}]`
        : `Unknown [${id}]`;
}

function getDebugNames(
    ids: number[],
    colonistMap: Map<number, FamilyTreeColonist>
) {
    return ids
        .map((id) =>
            getDebugName(
                id,
                colonistMap
            )
        )
        .join(" | ");
}

/*
 * ---------------------------------------------------------
 * Relationship maps
 * ---------------------------------------------------------
 */

function buildRelationshipMaps(
    colonists: FamilyTreeColonist[],
    parentChildren: FamilyTreeParentChild[],
    partnerships: FamilyTreePartnership[]
) {
    const colonistMap =
        new Map<number, FamilyTreeColonist>(
            colonists.map((colonist) => [
                colonist.id,
                colonist,
            ])
        );
    const parentsMap =
        new Map<number, number[]>();

    const childrenMap =
        new Map<number, number[]>();

    const parentChildMap =
        new Map<number, FamilyTreeParentChild[]>();

    for (const relationship of parentChildren) {
        if (!parentsMap.has(relationship.childId)) {
            parentsMap.set(
                relationship.childId,
                []
            );
        }

        parentsMap
            .get(relationship.childId)!
            .push(
                relationship.parentId
            );

        if (!childrenMap.has(relationship.parentId)) {
            childrenMap.set(
                relationship.parentId,
                []
            );
        }

        childrenMap
            .get(relationship.parentId)!
            .push(
                relationship.childId
            );

        if (!parentChildMap.has(relationship.childId)) {
            parentChildMap.set(
                relationship.childId,
                []
            );
        }

        parentChildMap
            .get(relationship.childId)!
            .push(
                relationship
            );
    }

    const partnershipMap =
        new Map<number, Set<number>>();

    const partnershipRelationshipMap =
        new Map<number, FamilyTreePartnership[]>();

    for (const relationship of partnerships) {
        if (
            !partnershipMap.has(
                relationship.partnerAId
            )
        ) {
            partnershipMap.set(
                relationship.partnerAId,
                new Set()
            );
        }

        if (
            !partnershipMap.has(
                relationship.partnerBId
            )
        ) {
            partnershipMap.set(
                relationship.partnerBId,
                new Set()
            );
        }

        partnershipMap
            .get(relationship.partnerAId)!
            .add(
                relationship.partnerBId
            );

        partnershipMap
            .get(relationship.partnerBId)!
            .add(
                relationship.partnerAId
            );

        if (
            !partnershipRelationshipMap.has(
                relationship.partnerAId
            )
        ) {
            partnershipRelationshipMap.set(
                relationship.partnerAId,
                []
            );
        }

        if (
            !partnershipRelationshipMap.has(
                relationship.partnerBId
            )
        ) {
            partnershipRelationshipMap.set(
                relationship.partnerBId,
                []
            );
        }

        partnershipRelationshipMap
            .get(relationship.partnerAId)!
            .push(
                relationship
            );

        partnershipRelationshipMap
            .get(relationship.partnerBId)!
            .push(
                relationship
            );
    }

    return {
        colonistMap,
        parentsMap,
        childrenMap,
        partnershipMap,
        parentChildMap,
        partnershipRelationshipMap,
    };

}


/*
 * ---------------------------------------------------------
 * Connected components
 * ---------------------------------------------------------
 */

function buildConnectedComponents(
    colonists: FamilyTreeColonist[],
    parentsMap: Map<number, number[]>,
    childrenMap: Map<number, number[]>,
    partnershipMap: Map<number, Set<number>>
) {
    const visited =
        new Set<number>();

    const components: number[][] = [];

    for (const colonist of colonists) {
        if (visited.has(colonist.id)) {
            continue;
        }

        const component: number[] = [];

        const queue = [colonist.id];

        visited.add(colonist.id);

        while (queue.length > 0) {
            const id = queue.shift()!;

            component.push(id);

            const connected = [
                ...(parentsMap.get(id) ?? []),
                ...(childrenMap.get(id) ?? []),
                ...(partnershipMap.get(id) ?? []),
            ];

            for (const connectedId of connected) {
                if (visited.has(connectedId)) {
                    continue;
                }

                visited.add(connectedId);
                queue.push(connectedId);
            }
        }

        components.push(component);
    }

    return components;
}

/*
 * ---------------------------------------------------------
 * Generation calculation
 * ---------------------------------------------------------
 */

function calculateGenerations(
    component: number[],
    parentsMap: Map<number, number[]>,
    childrenMap: Map<number, number[]>,
    partnershipMap: Map<number, Set<number>>
) {
    const generation = new Map<number, number>();
    const componentSet = new Set(component);

    /*
     * First establish the normal family generations from ancestry.
     *
     * Parent/child relationships provide the initial structure,
     * but they are not necessarily the final positions because
     * partnerships can legitimately move people further down the tree.
     */
    const roots = component.filter((id) => {
        const parents = parentsMap.get(id) ?? [];

        return !parents.some((parentId) =>
            componentSet.has(parentId)
        );
    });

    const queue: number[] = [];

    for (const root of roots) {
        generation.set(root, 0);
        queue.push(root);
    }

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentGeneration = generation.get(currentId);

        if (currentGeneration === undefined) continue;

        const children = childrenMap.get(currentId) ?? [];

        for (const childId of children) {
            if (!componentSet.has(childId)) continue;

            const proposedGeneration = currentGeneration + 1;
            const existingGeneration = generation.get(childId);

            if (
                existingGeneration === undefined ||
                proposedGeneration > existingGeneration
            ) {
                generation.set(childId, proposedGeneration);
                queue.push(childId);
            }
        }
    }

    /*
     * Anything disconnected from the ancestry structure starts at
     * generation 0.
     */
    for (const id of component) {
        if (!generation.has(id)) {
            generation.set(id, 0);
        }
    }

    /*
     * Partnerships can legitimately move people further down the tree.
     *
     * IMPORTANT:
     * We do NOT protect parents from being moved down.
     *
     * If an Eternal such as Ellen forms a later-life relationship with
     * someone from a much later generation, Ellen can move down with
     * that partner. Her descendants must then follow her.
     *
     * Therefore we repeatedly propagate:
     *
     *   partnership -> same generation
     *   parent      -> child is at least parent + 1
     *
     * until no generation changes remain.
     *
     * Both operations only ever increase a generation number, so this
     * naturally settles once all relationship consequences have
     * propagated through the component.
     */
    let changed = true;
    let iterations = 0;
    const maxIterations = Math.max(component.length * 2, 1);

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        /*
         * First propagate partnership generations.
         *
         * A partnership group is placed at its deepest current
         * generation. This allows either partner to pull the other
         * downward.
         */
        const visited = new Set<number>();

        for (const id of component) {
            if (visited.has(id)) continue;

            const partnershipGroup: number[] = [];
            const partnershipQueue = [id];
            visited.add(id);

            while (partnershipQueue.length > 0) {
                const currentId = partnershipQueue.shift()!;
                partnershipGroup.push(currentId);

                const partners =
                    partnershipMap.get(currentId) ??
                    new Set<number>();

                for (const partnerId of partners) {
                    if (
                        !componentSet.has(partnerId) ||
                        visited.has(partnerId)
                    ) {
                        continue;
                    }

                    visited.add(partnerId);
                    partnershipQueue.push(partnerId);
                }
            }

            if (partnershipGroup.length <= 1) continue;

            const targetGeneration = Math.max(
                ...partnershipGroup.map(
                    (memberId) => generation.get(memberId) ?? 0
                )
            );

            for (const memberId of partnershipGroup) {
                const currentGeneration =
                    generation.get(memberId) ?? 0;

                if (currentGeneration < targetGeneration) {
                    generation.set(memberId, targetGeneration);
                    changed = true;
                }
            }
        }

        /*
         * Now propagate any generation changes through the family tree.
         *
         * This is the part that fixes the Ellen -> Brandy problem.
         *
         * If Ellen moves from generation 1 to generation 3 because
         * of Topaz, Brandy is raised from generation 2 to generation 4.
         *
         * The same applies recursively to any descendants.
         */
        for (const parentId of component) {
            const parentGeneration =
                generation.get(parentId) ?? 0;

            const children = childrenMap.get(parentId) ?? [];

            for (const childId of children) {
                if (!componentSet.has(childId)) continue;

                const minimumChildGeneration =
                    parentGeneration + 1;

                const currentChildGeneration =
                    generation.get(childId) ?? 0;

                if (
                    currentChildGeneration <
                    minimumChildGeneration
                ) {
                    generation.set(
                        childId,
                        minimumChildGeneration
                    );

                    changed = true;
                }
            }
        }
    }

    if (iterations >= maxIterations && DEBUG_LAYOUT) {
        console.warn(
            "[FamilyTree] Generation propagation reached iteration limit",
            {
                component,
                generations: Object.fromEntries(generation),
            }
        );
    }

    return generation;
}

/*
 * ---------------------------------------------------------
 * Horizontal branch ordering
 * ---------------------------------------------------------
 */

function buildBranchOrder(
    component: number[],
    parentsMap: Map<number, number[]>,
    childrenMap: Map<number, number[]>,
    partnershipMap: Map<number, Set<number>>,
    colonistMap: Map<number, FamilyTreeColonist>
) {
    const componentSet = new Set(component);

    /*
     * ---------------------------------------------------------
     * 1. Find true ancestry roots
     * ---------------------------------------------------------
     */

    const roots = component.filter(
        (id) =>
            (parentsMap.get(id) ?? []).filter(
                (parentId) =>
                    componentSet.has(parentId)
            ).length === 0
    );

    /*
     * Natural root order is only used as a stabilizer.
     * It is NOT the primary ordering signal.
     */
    const rootOrder =
        new Map<number, number>();

    roots.forEach(
        (rootId, index) => {
            rootOrder.set(
                rootId,
                index
            );
        }
    );

    /*
     * ---------------------------------------------------------
     * 2. Create initial branches
     *
     * Partnered roots belong to the same branch.
     * ---------------------------------------------------------
     */

    const rootBranch =
        new Map<number, number>();

    const branchRoots =
        new Map<number, number[]>();

    let nextBranchId = 0;

    for (const rootId of roots) {
        if (
            rootBranch.has(rootId)
        ) {
            continue;
        }

        const branchId =
            nextBranchId++;

        const rootsForBranch: number[] =
            [];

        const queue = [rootId];

        const visited =
            new Set<number>();

        while (
            queue.length > 0
        ) {
            const currentId =
                queue.shift()!;

            if (
                visited.has(
                    currentId
                )
            ) {
                continue;
            }

            visited.add(
                currentId
            );

            if (
                rootBranch.has(
                    currentId
                )
            ) {
                continue;
            }

            rootBranch.set(
                currentId,
                branchId
            );

            rootsForBranch.push(
                currentId
            );

            for (
                const partnerId of
                partnershipMap.get(
                    currentId
                ) ?? []
            ) {
                if (
                    !componentSet.has(
                        partnerId
                    )
                ) {
                    continue;
                }

                /*
                 * Only true roots participate in the initial
                 * branch merging.
                 */
                if (
                    !rootOrder.has(
                        partnerId
                    )
                ) {
                    continue;
                }

                if (
                    !visited.has(
                        partnerId
                    )
                ) {
                    queue.push(
                        partnerId
                    );
                }
            }
        }

        branchRoots.set(
            branchId,
            rootsForBranch
        );
    }

    /*
     * ---------------------------------------------------------
     * 3. Propagate branch membership down ancestry
     * ---------------------------------------------------------
     */

    const branchMembership =
        new Map<
            number,
            Set<number>
        >();

    const branchDepth =
        new Map<
            string,
            number
        >();

    for (
        const branchId of
        branchRoots.keys()
    ) {
        branchMembership.set(
            branchId,
            new Set<number>()
        );
    }

    const ancestryQueue: {
        colonistId: number;
        branchId: number;
        depth: number;
    }[] = [];

    for (
        const [
            rootId,
            branchId,
        ] of rootBranch
    ) {
        ancestryQueue.push({
            colonistId:
                rootId,

            branchId,

            depth: 0,
        });
    }

    const visitedBranchColonists =
        new Set<string>();

    while (
        ancestryQueue.length > 0
    ) {
        const current =
            ancestryQueue.shift()!;

        const {
            colonistId,
            branchId,
            depth,
        } = current;

        const visitKey =
            `${colonistId}:${branchId}`;

        if (
            visitedBranchColonists.has(
                visitKey
            )
        ) {
            continue;
        }

        visitedBranchColonists.add(
            visitKey
        );

        const existingDepth =
            branchDepth.get(
                visitKey
            );

        if (
            existingDepth ===
            undefined ||
            depth < existingDepth
        ) {
            branchDepth.set(
                visitKey,
                depth
            );
        }

        branchMembership
            .get(branchId)!
            .add(
                colonistId
            );

        for (
            const childId of
            childrenMap.get(
                colonistId
            ) ?? []
        ) {
            if (
                !componentSet.has(
                    childId
                )
            ) {
                continue;
            }

            ancestryQueue.push({
                colonistId:
                    childId,

                branchId,

                depth:
                    depth + 1,
            });
        }
    }

    /*
     * ---------------------------------------------------------
     * 4. Handle unusual/disconnected structures
     * ---------------------------------------------------------
     */

    for (
        const colonistId of
        component
    ) {
        let belongsToBranch =
            false;

        for (
            const members of
            branchMembership.values()
        ) {
            if (
                members.has(
                    colonistId
                )
            ) {
                belongsToBranch =
                    true;

                break;
            }
        }

        if (
            belongsToBranch
        ) {
            continue;
        }

        const branchId =
            nextBranchId++;

        branchRoots.set(
            branchId,
            [colonistId]
        );

        branchMembership.set(
            branchId,
            new Set([
                colonistId,
            ])
        );

        branchDepth.set(
            `${colonistId}:${branchId}`,
            0
        );

        if (
            !rootOrder.has(
                colonistId
            )
        ) {
            rootOrder.set(
                colonistId,
                rootOrder.size
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * 5. Natural branch order
     * ---------------------------------------------------------
     */

    const naturalBranchOrder =
        Array.from(
            branchRoots.keys()
        ).sort(
            (a, b) => {
                const aRoot =
                    branchRoots
                        .get(a)?.[0];

                const bRoot =
                    branchRoots
                        .get(b)?.[0];

                return (
                    (
                        rootOrder.get(
                            aRoot!
                        ) ??
                        Number.MAX_SAFE_INTEGER
                    ) -
                    (
                        rootOrder.get(
                            bRoot!
                        ) ??
                        Number.MAX_SAFE_INTEGER
                    )
                );
            }
        );

    const naturalBranchIndex =
        new Map<number, number>();

    naturalBranchOrder.forEach(
        (
            branchId,
            index
        ) => {
            naturalBranchIndex.set(
                branchId,
                index
            );
        }
    );

    /*
     * ---------------------------------------------------------
     * 6. Find cross-branch partnerships
     * ---------------------------------------------------------
     */

    const branchPartners =
        new Map<
            number,
            Set<number>
        >();

    for (
        const branchId of
        branchRoots.keys()
    ) {
        branchPartners.set(
            branchId,
            new Set<number>()
        );
    }

    function getBranchDepth(
        colonistId: number,
        branchId: number
    ) {
        return (
            branchDepth.get(
                `${colonistId}:${branchId}`
            ) ??
            Number.MAX_SAFE_INTEGER
        );
    }

    /*
     * Earlier-generation partnerships are considered more
     * structurally important.
     */
    function getPartnershipBranchPair(
        branchA: number,
        branchB: number
    ) {
        let bestPair:
            | {
                a: number;
                b: number;
                totalDepth: number;
                depthDifference: number;
            }
            | undefined;

        const membersA =
            branchMembership.get(
                branchA
            ) ??
            new Set<number>();

        const membersB =
            branchMembership.get(
                branchB
            ) ??
            new Set<number>();

        for (
            const colonistA of
            membersA
        ) {
            for (
                const partnerId of
                partnershipMap.get(
                    colonistA
                ) ?? []
            ) {
                if (
                    !membersB.has(
                        partnerId
                    )
                ) {
                    continue;
                }

                const depthA =
                    getBranchDepth(
                        colonistA,
                        branchA
                    );

                const depthB =
                    getBranchDepth(
                        partnerId,
                        branchB
                    );

                const candidate = {
                    a: colonistA,

                    b: partnerId,

                    totalDepth:
                        depthA +
                        depthB,

                    depthDifference:
                        Math.abs(
                            depthA -
                            depthB
                        ),
                };

                if (
                    !bestPair ||
                    candidate.totalDepth <
                    bestPair.totalDepth ||
                    (
                        candidate.totalDepth ===
                        bestPair.totalDepth &&
                        candidate.depthDifference <
                        bestPair.depthDifference
                    )
                ) {
                    bestPair =
                        candidate;
                }
            }
        }

        return bestPair;
    }

    const branchIds =
        Array.from(
            branchRoots.keys()
        );

    for (
        let i = 0;
        i < branchIds.length;
        i++
    ) {
        for (
            let j = i + 1;
            j < branchIds.length;
            j++
        ) {
            const branchA =
                branchIds[i];

            const branchB =
                branchIds[j];

            const pair =
                getPartnershipBranchPair(
                    branchA,
                    branchB
                );

            if (!pair) {
                continue;
            }

            branchPartners
                .get(branchA)!
                .add(branchB);

            branchPartners
                .get(branchB)!
                .add(branchA);
        }
    }

    /*
     * ---------------------------------------------------------
     * 7. Relationship-aware ordering
     * ---------------------------------------------------------
     *
     * This is the current ordering logic that successfully keeps
     * strongly connected branches such as King -> Brainiac close.
     *
     * Natural order remains a secondary stabilizing force.
     * ---------------------------------------------------------
     */

    let orderedBranches =
        [
            ...naturalBranchOrder,
        ];

    const naturalPosition =
        new Map<
            number,
            number
        >();

    naturalBranchOrder.forEach(
        (
            branchId,
            index
        ) => {
            naturalPosition.set(
                branchId,
                index
            );
        }
    );

    function calculateOrderingCost(
        order: number[]
    ) {
        const position =
            new Map<
                number,
                number
            >();

        order.forEach(
            (
                branchId,
                index
            ) => {
                position.set(
                    branchId,
                    index
                );
            }
        );

        let relationshipCost =
            0;

        let naturalCost =
            0;

        /*
         * Partnership distance is the primary signal.
         *
         * Squared distance makes a very distant relationship
         * increasingly expensive.
         */
        for (
            const branchId of
            order
        ) {
            const partners =
                branchPartners.get(
                    branchId
                ) ??
                new Set<number>();

            for (
                const partnerId of
                partners
            ) {
                if (
                    branchId >=
                    partnerId
                ) {
                    continue;
                }

                const branchPosition =
                    position.get(
                        branchId
                    ) ?? 0;

                const partnerPosition =
                    position.get(
                        partnerId
                    ) ?? 0;

                const distance =
                    Math.abs(
                        branchPosition -
                        partnerPosition
                    );

                relationshipCost +=
                    distance *
                    distance;
            }
        }

        /*
         * Natural ordering is deliberately weak.
         *
         * This keeps the successful relationship ordering while
         * still giving the optimizer a preference for not moving
         * everything unnecessarily.
         */
        for (
            const branchId of
            order
        ) {
            const currentPosition =
                position.get(
                    branchId
                ) ?? 0;

            const originalPosition =
                naturalPosition.get(
                    branchId
                ) ??
                currentPosition;

            naturalCost +=
                Math.abs(
                    currentPosition -
                    originalPosition
                );
        }

        return (
            relationshipCost * 4 +
            naturalCost
        );
    }

    /*
     * ---------------------------------------------------------
     * 8. Optimize through insertion moves
     * ---------------------------------------------------------
     */

    let currentCost =
        calculateOrderingCost(
            orderedBranches
        );

    let improved =
        true;

    let pass =
        0;

    while (
        improved &&
        pass < 8
    ) {
        improved =
            false;

        pass++;

        for (
            let sourceIndex = 0;
            sourceIndex <
            orderedBranches.length;
            sourceIndex++
        ) {
            const branchId =
                orderedBranches[
                sourceIndex
                ];

            let bestOrder =
                orderedBranches;

            let bestCost =
                currentCost;

            for (
                let targetIndex = 0;
                targetIndex <
                orderedBranches.length;
                targetIndex++
            ) {
                if (
                    targetIndex ===
                    sourceIndex
                ) {
                    continue;
                }

                const candidate =
                    [
                        ...orderedBranches,
                    ];

                candidate.splice(
                    sourceIndex,
                    1
                );

                candidate.splice(
                    targetIndex,
                    0,
                    branchId
                );

                const candidateCost =
                    calculateOrderingCost(
                        candidate
                    );

                if (
                    candidateCost <
                    bestCost
                ) {
                    bestCost =
                        candidateCost;

                    bestOrder =
                        candidate;
                }
            }

            if (
                bestOrder !==
                orderedBranches
            ) {
                orderedBranches =
                    bestOrder;

                currentCost =
                    bestCost;

                improved =
                    true;
            }
        }
    }

    /*
     * ---------------------------------------------------------
     * 9. Assign final branch ranks
     * ---------------------------------------------------------
     */

    const branchRank =
        new Map<
            number,
            number
        >();

    orderedBranches.forEach(
        (
            branchId,
            index
        ) => {
            branchRank.set(
                branchId,
                index
            );
        }
    );

    /*
     * ---------------------------------------------------------
     * 10. Convert branch ranks to colonist ranks
     * ---------------------------------------------------------
     */

    const colonistBranchRank =
        new Map<
            number,
            number
        >();

    for (
        const [
            branchId,
            members,
        ] of branchMembership
    ) {
        const rank =
            branchRank.get(
                branchId
            ) ??
            naturalBranchIndex.get(
                branchId
            ) ??
            0;

        for (
            const colonistId of
            members
        ) {
            const existingRank =
                colonistBranchRank.get(
                    colonistId
                );

            if (
                existingRank ===
                undefined ||
                rank < existingRank
            ) {
                colonistBranchRank.set(
                    colonistId,
                    rank
                );
            }
        }
    }

    /*
     * ---------------------------------------------------------
     * DEBUG: original filtered branch ordering
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * The debug filter has NO effect on the actual layout.
     *
     * Standalone colonists/branches are hidden from the debug
     * output so the console focuses on actual family branches.
     * ---------------------------------------------------------
     */

    if (DEBUG_LAYOUT) {
        const relevantBranches =
            orderedBranches.filter(
                (branchId) => {
                    const members =
                        branchMembership.get(
                            branchId
                        ) ??
                        new Set<number>();

                    return Array.from(
                        members
                    ).some((id) =>
                        isDebugRelevantColonist(
                            id,
                            parentsMap,
                            childrenMap,
                            partnershipMap
                        )
                    );
                }
            );

        console.groupCollapsed(
            `[FamilyTree] Branch order`
        );

        console.table(
            relevantBranches.map(
                (branchId) => {
                    const members =
                        branchMembership.get(
                            branchId
                        ) ??
                        new Set<number>();

                    const rank =
                        branchRank.get(
                            branchId
                        ) ??
                        0;

                    const natural =
                        naturalBranchIndex.get(
                            branchId
                        );

                    const relevantMemberIds =
                        Array.from(
                            members
                        ).filter((id) =>
                            isDebugRelevantColonist(
                                id,
                                parentsMap,
                                childrenMap,
                                partnershipMap
                            )
                        );

                    const partnerBranches =
                        Array.from(
                            branchPartners.get(
                                branchId
                            ) ??
                            []
                        )
                            .filter(
                                (
                                    partnerBranch
                                ) => {
                                    const partnerMembers =
                                        branchMembership.get(
                                            partnerBranch
                                        ) ??
                                        new Set<number>();

                                    return Array.from(
                                        partnerMembers
                                    ).some(
                                        (
                                            id
                                        ) =>
                                            isDebugRelevantColonist(
                                                id,
                                                parentsMap,
                                                childrenMap,
                                                partnershipMap
                                            )
                                    );
                                }
                            )
                            .sort(
                                (a, b) =>
                                    (
                                        branchRank.get(
                                            a
                                        ) ??
                                        0
                                    ) -
                                    (
                                        branchRank.get(
                                            b
                                        ) ??
                                        0
                                    )
                            );

                    return {
                        rank,

                        branch:
                            branchId,

                        natural,

                        members:
                            getDebugNames(
                                relevantMemberIds,
                                colonistMap
                            ),

                        partners:
                            partnerBranches
                                .map(
                                    (
                                        partnerBranch
                                    ) => {
                                        const partnerMembers =
                                            branchMembership.get(
                                                partnerBranch
                                            ) ??
                                            new Set<number>();

                                        const relevantPartnerIds =
                                            Array.from(
                                                partnerMembers
                                            ).filter(
                                                (
                                                    id
                                                ) =>
                                                    isDebugRelevantColonist(
                                                        id,
                                                        parentsMap,
                                                        childrenMap,
                                                        partnershipMap
                                                    )
                                            );

                                        return `${partnerBranch}: ${getDebugNames(
                                            relevantPartnerIds,
                                            colonistMap
                                        )}`;
                                    }
                                )
                                .join(
                                    " | "
                                ),
                    };
                }
            )
        );

        console.log(
            "Branches are ordered LEFT → RIGHT by final rank."
        );

        console.log(
            "Standalone-only branches are hidden from this debug output."
        );

        console.log(
            "Natural rank is shown for comparison; partnership structure is the primary ordering signal."
        );

        console.groupEnd();
    }

    return {
        branchRank:
            colonistBranchRank,
    };
}

/*
 * ---------------------------------------------------------
 * Partnership groups
 * ---------------------------------------------------------
 */
function buildLayoutGroups(
    ids: number[],
    generationMap: Map<number, number>,
    partnershipMap: Map<number, Set<number>>
) {
    const groups: LayoutGroup[] = [];
    const visited = new Set<number>();
    const idSet = new Set(ids);
    let groupId = 0;

    /*
     * Partnership-connected groups are ordered based on their actual
     * relationship graph rather than simply putting the colonist with
     * the most partners in the middle.
     *
     * The goal is to keep partnership edges short and avoid putting an
     * unrelated colonist between two partners.
     */
    function orderPartnershipGroup(memberIds: number[]) {
        if (memberIds.length <= 2) {
            return memberIds;
        }

        const memberSet = new Set(memberIds);

        const getPartners = (id: number) =>
            Array.from(partnershipMap.get(id) ?? []).filter(
                (partnerId) => memberSet.has(partnerId)
            );

        /*
         * Start with the member having the most relationships.
         *
         * This gives us a useful center for star-shaped relationship
         * groups, while the ordering passes below handle more complex
         * chains.
         */
        const center = memberIds.reduce((bestId, currentId) => {
            const bestDegree = getPartners(bestId).length;
            const currentDegree = getPartners(currentId).length;

            if (currentDegree > bestDegree) {
                return currentId;
            }

            return bestId;
        }, memberIds[0]);

        /*
         * Build an initial path by repeatedly choosing the closest
         * unplaced partner.
         *
         * For the common case:
         *
         *     Lover ── Topaz ── Ellen ── Grindu
         *
         * this produces the desired contiguous relationship chain.
         */
        const ordered: number[] = [center];
        const placed = new Set<number>([center]);

        let currentId = center;

        while (placed.size < memberIds.length) {
            const candidates = getPartners(currentId).filter(
                (partnerId) => !placed.has(partnerId)
            );

            if (candidates.length > 0) {
                /*
                 * Prefer the candidate with the most unplaced
                 * relationships. This keeps longer chains intact.
                 */
                candidates.sort((a, b) => {
                    const aUnplaced = getPartners(a).filter(
                        (partnerId) => !placed.has(partnerId)
                    ).length;

                    const bUnplaced = getPartners(b).filter(
                        (partnerId) => !placed.has(partnerId)
                    ).length;

                    return bUnplaced - aUnplaced;
                });

                const nextId = candidates[0];

                ordered.push(nextId);
                placed.add(nextId);
                currentId = nextId;
                continue;
            }

            /*
             * We reached the end of one relationship chain.
             *
             * Start the next chain with the unplaced member having
             * the strongest connection to the existing ordering.
             */
            const remaining = memberIds.filter(
                (memberId) => !placed.has(memberId)
            );

            remaining.sort((a, b) => {
                const aConnections = getPartners(a).filter((partnerId) =>
                    placed.has(partnerId)
                ).length;

                const bConnections = getPartners(b).filter((partnerId) =>
                    placed.has(partnerId)
                ).length;

                return bConnections - aConnections;
            });

            const nextId = remaining[0];

            ordered.push(nextId);
            placed.add(nextId);
            currentId = nextId;
        }

        /*
         * The initial path is good for chains, but partnership graphs
         * can still contain branches. Improve the ordering by repeatedly
         * moving members closer to their partners.
         *
         * This is deliberately limited so the layout remains cheap even
         * when the colony becomes large.
         */
        for (let pass = 0; pass < 8; pass++) {
            let changed = false;

            for (let index = 0; index < ordered.length; index++) {
                const id = ordered[index];
                const partners = getPartners(id);

                if (partners.length === 0) continue;

                const partnerIndexes = partners
                    .map((partnerId) =>
                        ordered.indexOf(partnerId)
                    )
                    .filter((partnerIndex) => partnerIndex >= 0);

                if (partnerIndexes.length === 0) continue;

                const averagePartnerIndex =
                    partnerIndexes.reduce(
                        (sum, partnerIndex) =>
                            sum + partnerIndex,
                        0
                    ) / partnerIndexes.length;

                /*
                 * Don't move the node directly onto a partner.
                 * Instead move it one position toward the center of
                 * its partnership neighborhood.
                 */
                const targetIndex =
                    averagePartnerIndex > index
                        ? index + 1
                        : averagePartnerIndex < index
                            ? index - 1
                            : index;

                if (
                    targetIndex < 0 ||
                    targetIndex >= ordered.length ||
                    targetIndex === index
                ) {
                    continue;
                }

                /*
                 * Only swap when the swap improves the total partnership
                 * distance.
                 */
                const distanceBefore = partners.reduce(
                    (sum, partnerId) =>
                        sum +
                        Math.abs(
                            index -
                            ordered.indexOf(partnerId)
                        ),
                    0
                );

                const swappedId = ordered[targetIndex];

                const distanceAfter = partners.reduce(
                    (sum, partnerId) => {
                        const partnerIndex =
                            partnerId === swappedId
                                ? index
                                : ordered.indexOf(partnerId);

                        return (
                            sum +
                            Math.abs(
                                targetIndex -
                                partnerIndex
                            )
                        );
                    },
                    0
                );

                if (distanceAfter < distanceBefore) {
                    ordered[index] = swappedId;
                    ordered[targetIndex] = id;
                    changed = true;
                }
            }

            if (!changed) break;
        }

        return ordered;
    }

    for (const id of ids) {
        if (visited.has(id)) continue;

        const memberIds: number[] = [];
        const queue = [id];
        visited.add(id);

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            memberIds.push(currentId);

            const partners =
                partnershipMap.get(currentId) ??
                new Set<number>();

            for (const partnerId of partners) {
                if (
                    !idSet.has(partnerId) ||
                    visited.has(partnerId)
                ) {
                    continue;
                }

                /*
                 * Only members on the same generation belong in the
                 * same horizontal partnership group.
                 *
                 * Generation propagation has already handled the
                 * vertical relationship before we get here.
                 */
                if (
                    generationMap.get(partnerId) !==
                    generationMap.get(currentId)
                ) {
                    continue;
                }

                visited.add(partnerId);
                queue.push(partnerId);
            }
        }

        const orderedMembers =
            memberIds.length > 1
                ? orderPartnershipGroup(memberIds)
                : memberIds;

        groups.push({
            id: groupId++,
            memberIds: orderedMembers,
            generation: generationMap.get(id) ?? 0,
            isPartnershipGroup: orderedMembers.length > 1,
        });
    }

    return groups;
}


/*
 * ---------------------------------------------------------
 * Sibling clusters
 * ---------------------------------------------------------
 */

function buildSiblingClusters(
    ids: number[],
    generationMap: Map<number, number>,
    parentsMap: Map<number, number[]>
) {
    const idSet =
        new Set(ids);

    const clusters: SiblingCluster[] = [];

    const clusterByParentKey =
        new Map<string, SiblingCluster>();

    let clusterId = 0;

    for (const id of ids) {
        const generation =
            generationMap.get(id) ?? 0;

        const parentIds =
            (parentsMap.get(id) ?? [])
                .filter((parentId) =>
                    idSet.has(parentId)
                )
                .sort(
                    (a, b) =>
                        a - b
                );

        if (parentIds.length === 0) {
            continue;
        }

        const key =
            `${generation}:${parentIds.join(",")}`;

        let cluster =
            clusterByParentKey.get(key);

        if (!cluster) {
            cluster = {
                id: clusterId++,
                memberIds: [],
                generation,
                parentIds,
            };

            clusterByParentKey.set(
                key,
                cluster
            );

            clusters.push(cluster);
        }

        cluster.memberIds.push(id);
    }

    return clusters;
}

function getFamilyFocusIds(
    focusedColonistId: number,
    colonists: FamilyTreeColonist[],
    parentChildren: FamilyTreeParentChild[],
    partnerships: FamilyTreePartnership[]
) {
    const colonistIds =
        new Set(
            colonists.map(
                (colonist) =>
                    colonist.id
            )
        );

    const parentsMap =
        new Map<number, number[]>();

    const childrenMap =
        new Map<number, number[]>();

    for (const relationship of parentChildren) {
        if (
            !colonistIds.has(
                relationship.parentId
            ) ||
            !colonistIds.has(
                relationship.childId
            )
        ) {
            continue;
        }

        if (
            !parentsMap.has(
                relationship.childId
            )
        ) {
            parentsMap.set(
                relationship.childId,
                []
            );
        }

        parentsMap
            .get(
                relationship.childId
            )!
            .push(
                relationship.parentId
            );

        if (
            !childrenMap.has(
                relationship.parentId
            )
        ) {
            childrenMap.set(
                relationship.parentId,
                []
            );
        }

        childrenMap
            .get(
                relationship.parentId
            )!
            .push(
                relationship.childId
            );
    }

    const familyIds =
        new Set<number>([
            focusedColonistId,
        ]);

    const focusedParents =
        parentsMap.get(
            focusedColonistId
        ) ?? [];

    for (const parentId of focusedParents) {
        const siblings =
            childrenMap.get(
                parentId
            ) ?? [];

        for (const siblingId of siblings) {
            if (
                colonistIds.has(
                    siblingId
                )
            ) {
                familyIds.add(
                    siblingId
                );
            }
        }
    }

    let currentGeneration = [
        focusedColonistId,
    ];

    while (
        currentGeneration.length > 0
    ) {
        const nextGeneration: number[] = [];

        for (const colonistId of currentGeneration) {
            const parents =
                parentsMap.get(
                    colonistId
                ) ?? [];

            for (const parentId of parents) {
                if (
                    !colonistIds.has(
                        parentId
                    ) ||
                    familyIds.has(
                        parentId
                    )
                ) {
                    continue;
                }

                familyIds.add(
                    parentId
                );

                nextGeneration.push(
                    parentId
                );
            }
        }

        currentGeneration =
            nextGeneration;
    }

    currentGeneration = [
        focusedColonistId,
    ];

    while (
        currentGeneration.length > 0
    ) {
        const nextGeneration: number[] = [];

        for (const colonistId of currentGeneration) {
            const children =
                childrenMap.get(
                    colonistId
                ) ?? [];

            for (const childId of children) {
                if (
                    !colonistIds.has(
                        childId
                    ) ||
                    familyIds.has(
                        childId
                    )
                ) {
                    continue;
                }

                familyIds.add(
                    childId
                );

                nextGeneration.push(
                    childId
                );
            }
        }

        currentGeneration =
            nextGeneration;
    }

    for (const relationship of partnerships) {
        if (
            familyIds.has(
                relationship.partnerAId
            ) &&
            colonistIds.has(
                relationship.partnerBId
            )
        ) {
            familyIds.add(
                relationship.partnerBId
            );
        }

        if (
            familyIds.has(
                relationship.partnerBId
            ) &&
            colonistIds.has(
                relationship.partnerAId
            )
        ) {
            familyIds.add(
                relationship.partnerAId
            );
        }
    }

    return familyIds;
}
function getLegacyFocusIds(
    focusedColonistId: number,
    colonists: FamilyTreeColonist[],
    partnerships: FamilyTreePartnership[]
) {
    const focusedColonist =
        colonists.find(
            (colonist) =>
                colonist.id === focusedColonistId
        );

    if (
        !focusedColonist?.legacy
    ) {
        return new Set<number>([
            focusedColonistId,
        ]);
    }

    const legacyName =
        focusedColonist.legacy.name;

    const legacyIds =
        new Set<number>();

    for (const colonist of colonists) {
        if (
            colonist.legacy?.name ===
            legacyName
        ) {
            legacyIds.add(
                colonist.id
            );
        }
    }

    const result =
        new Set(legacyIds);

    for (const relationship of partnerships) {
        if (
            legacyIds.has(
                relationship.partnerAId
            )
        ) {
            result.add(
                relationship.partnerBId
            );
        }

        if (
            legacyIds.has(
                relationship.partnerBId
            )
        ) {
            result.add(
                relationship.partnerAId
            );
        }
    }

    return result;
}

/*
 * ---------------------------------------------------------
 * Layout a single connected component
 * ---------------------------------------------------------
 */
function layoutComponent(
    component: number[],
    parentsMap: Map<number, number[]>,
    childrenMap: Map<number, number[]>,
    partnershipMap: Map<number, Set<number>>,
    colonistMap: Map<number, FamilyTreeColonist>,
    componentOffsetX: number
): PositionedNode[] {
    const generationMap =
        calculateGenerations(
            component,
            parentsMap,
            childrenMap,
            partnershipMap
        );

    const branchOrder =
        buildBranchOrder(
            component,
            parentsMap,
            childrenMap,
            partnershipMap,
            colonistMap
        );

    const groups =
        buildLayoutGroups(
            component,
            generationMap,
            partnershipMap
        );

    const siblingClusters =
        buildSiblingClusters(
            component,
            generationMap,
            parentsMap
        );

    const groupsByGeneration =
        new Map<
            number,
            LayoutGroup[]
        >();

    for (const group of groups) {
        if (
            !groupsByGeneration.has(
                group.generation
            )
        ) {
            groupsByGeneration.set(
                group.generation,
                []
            );
        }

        groupsByGeneration
            .get(group.generation)!
            .push(group);
    }

    const siblingClusterByMember =
        new Map<
            number,
            SiblingCluster
        >();

    for (const cluster of siblingClusters) {
        for (const memberId of cluster.memberIds) {
            siblingClusterByMember.set(
                memberId,
                cluster
            );
        }
    }

    const generations =
        Array.from(
            groupsByGeneration.keys()
        ).sort(
            (a, b) =>
                a - b
        );

    const groupByColonist =
        new Map<
            number,
            LayoutGroup
        >();

    for (const group of groups) {
        for (const memberId of group.memberIds) {
            groupByColonist.set(
                memberId,
                group
            );
        }
    }

    const groupCenter =
        new Map<number, number>();

    const positions =
        new Map<number, number>();

    function getGroupWidth(
        group: LayoutGroup
    ) {
        return (
            group.memberIds.length *
            nodeWidth +
            Math.max(
                0,
                group.memberIds.length - 1
            ) *
            partnerSpacing
        );
    }

    function setGroupCenter(
        group: LayoutGroup,
        center: number
    ) {
        groupCenter.set(
            group.id,
            center
        );

        const width =
            getGroupWidth(group);

        let cursor =
            center -
            width / 2;

        for (const memberId of group.memberIds) {
            positions.set(
                memberId,
                cursor +
                nodeWidth / 2
            );

            cursor +=
                nodeWidth +
                partnerSpacing;
        }
    }

    function getGroupBranchRank(
        group: LayoutGroup
    ) {
        const ranks =
            group.memberIds
                .map(
                    (id) =>
                        branchOrder.branchRank.get(
                            id
                        )
                )
                .filter(
                    (
                        rank
                    ): rank is number =>
                        rank !==
                        undefined
                );

        if (
            ranks.length ===
            0
        ) {
            return Number.MAX_SAFE_INTEGER;
        }

        return Math.min(
            ...ranks
        );
    }

    /*
     * ---------------------------------------------------------
     * Parent anchor
     * ---------------------------------------------------------
     */

    function getParentAnchor(
        colonistId: number
    ): number | null {
        const parents =
            parentsMap.get(
                colonistId
            ) ?? [];

        const parentCenters: number[] =
            [];

        for (const parentId of parents) {
            const parentGroup =
                groupByColonist.get(
                    parentId
                );

            if (!parentGroup) {
                continue;
            }

            const center =
                groupCenter.get(
                    parentGroup.id
                );

            if (
                center !==
                undefined
            ) {
                parentCenters.push(
                    center
                );
            }
        }

        if (
            parentCenters.length ===
            0
        ) {
            return null;
        }

        return (
            parentCenters.reduce(
                (
                    sum,
                    value
                ) =>
                    sum + value,
                0
            ) /
            parentCenters.length
        );
    }

    /*
     * ---------------------------------------------------------
     * Sibling cluster anchor
     * ---------------------------------------------------------
     */

    function getSiblingClusterAnchor(
        cluster: SiblingCluster
    ): number | null {
        const parentCenters: number[] =
            [];

        for (const parentId of cluster.parentIds) {
            const parentGroup =
                groupByColonist.get(
                    parentId
                );

            if (!parentGroup) {
                continue;
            }

            const center =
                groupCenter.get(
                    parentGroup.id
                );

            if (
                center !==
                undefined
            ) {
                parentCenters.push(
                    center
                );
            }
        }

        if (
            parentCenters.length ===
            0
        ) {
            return null;
        }

        return (
            parentCenters.reduce(
                (
                    sum,
                    value
                ) =>
                    sum + value,
                0
            ) /
            parentCenters.length
        );
    }

    /*
     * ---------------------------------------------------------
     * Generation spacing
     * ---------------------------------------------------------
     *
     * More groups in a generation get a little more breathing
     * room. This is deliberately only used as collision spacing.
     * It is NOT used to force a global left-to-right order.
     * ---------------------------------------------------------
     */

    function getGenerationSpacing(
        groupCount: number
    ) {
        return Math.min(
            140,
            Math.max(
                xGap,
                xGap +
                Math.max(
                    0,
                    groupCount - 3
                ) *
                18
            )
        );
    }

    /*
     * ---------------------------------------------------------
     * First generation
     * ---------------------------------------------------------
     *
     * Use branch rank to establish the initial order only.
     * Once positioned, collision resolution uses actual X
     * positions rather than continually enforcing this order.
     * ---------------------------------------------------------
     */

    const firstGeneration =
        groupsByGeneration.get(
            generations[0]
        ) ?? [];

    firstGeneration.sort(
        (a, b) => {
            const rankDifference =
                getGroupBranchRank(a) -
                getGroupBranchRank(b);

            if (
                rankDifference !==
                0
            ) {
                return rankDifference;
            }

            return (
                a.id -
                b.id
            );
        }
    );

    let firstCursor = 0;

    for (
        const group of
        firstGeneration
    ) {
        const width =
            getGroupWidth(group);

        setGroupCenter(
            group,
            firstCursor +
            width / 2
        );

        firstCursor +=
            width +
            getGenerationSpacing(
                firstGeneration.length
            );
    }

    /*
     * ---------------------------------------------------------
     * Remaining generations
     * ---------------------------------------------------------
     */

    for (
        let generationIndex = 1;
        generationIndex <
        generations.length;
        generationIndex++
    ) {
        const generation =
            generations[
            generationIndex
            ];

        const generationGroups =
            groupsByGeneration.get(
                generation
            ) ?? [];

        if (
            generationGroups.length ===
            0
        ) {
            continue;
        }

        /*
         * Initial ordering only.
         *
         * We do NOT use this order as a hard spatial constraint.
         */
        generationGroups.sort(
            (a, b) => {
                const rankDifference =
                    getGroupBranchRank(a) -
                    getGroupBranchRank(b);

                if (
                    rankDifference !==
                    0
                ) {
                    return rankDifference;
                }

                return (
                    a.id -
                    b.id
                );
            }
        );

        const desiredCenters =
            new Map<
                number,
                number
            >();

        /*
         * -----------------------------------------------------
         * Determine relationship-based desired positions
         * -----------------------------------------------------
         */

        for (
            const group of
            generationGroups
        ) {
            const targets: number[] =
                [];

            /*
             * Partnership groups.
             *
             * Each member can have a different family anchor,
             * so calculate the group center required for each
             * member and average those targets.
             */
            if (
                group.isPartnershipGroup
            ) {
                for (
                    let index = 0;
                    index <
                    group.memberIds.length;
                    index++
                ) {
                    const memberId =
                        group.memberIds[
                        index
                        ];

                    const parentAnchor =
                        getParentAnchor(
                            memberId
                        );

                    if (
                        parentAnchor ===
                        null
                    ) {
                        continue;
                    }

                    const width =
                        getGroupWidth(
                            group
                        );

                    const memberOffset =
                        -width / 2 +
                        nodeWidth / 2 +
                        index *
                        (
                            nodeWidth +
                            partnerSpacing
                        );

                    targets.push(
                        parentAnchor -
                        memberOffset
                    );
                }
            }

            /*
             * Sibling cluster anchor.
             */
            if (
                targets.length ===
                0
            ) {
                const cluster =
                    group.memberIds
                        .map(
                            (id) =>
                                siblingClusterByMember.get(
                                    id
                                )
                        )
                        .find(
                            (
                                value
                            ): value is SiblingCluster =>
                                value !==
                                undefined
                        );

                if (cluster) {
                    const anchor =
                        getSiblingClusterAnchor(
                            cluster
                        );

                    if (
                        anchor !==
                        null
                    ) {
                        targets.push(
                            anchor
                        );
                    }
                }
            }

            /*
             * Direct parent anchor.
             */
            if (
                targets.length ===
                0
            ) {
                const anchor =
                    getParentAnchor(
                        group.memberIds[0]
                    );

                if (
                    anchor !==
                    null
                ) {
                    targets.push(
                        anchor
                    );
                }
            }

            /*
             * No visible family anchor.
             *
             * Use branch rank as a fallback position. This is
             * only the initial desired position; it is NOT later
             * enforced as a global ordering rule.
             */
            if (
                targets.length ===
                0
            ) {
                const rank =
                    getGroupBranchRank(
                        group
                    );

                if (
                    rank !==
                    Number.MAX_SAFE_INTEGER
                ) {
                    targets.push(
                        rank *
                        minimumNodeSpacing
                    );
                } else {
                    targets.push(
                        0
                    );
                }
            }

            const desired =
                targets.reduce(
                    (
                        sum,
                        value
                    ) =>
                        sum + value,
                    0
                ) /
                targets.length;

            desiredCenters.set(
                group.id,
                desired
            );
        }

        /*
         * -----------------------------------------------------
         * Sibling cluster distribution
         * -----------------------------------------------------
         */

        const processedClusters =
            new Set<number>();

        const generationSpacing =
            getGenerationSpacing(
                generationGroups.length
            );

        for (
            const cluster of
            siblingClusters
        ) {
            if (
                cluster.generation !==
                generation
            ) {
                continue;
            }

            if (
                processedClusters.has(
                    cluster.id
                )
            ) {
                continue;
            }

            processedClusters.add(
                cluster.id
            );

            const clusterGroups =
                cluster.memberIds
                    .map(
                        (memberId) =>
                            groupByColonist.get(
                                memberId
                            )
                    )
                    .filter(
                        (
                            group
                        ): group is LayoutGroup =>
                            !!group &&
                            !group.isPartnershipGroup
                    );

            if (
                clusterGroups.length <=
                1
            ) {
                continue;
            }

            const anchor =
                getSiblingClusterAnchor(
                    cluster
                );

            if (
                anchor ===
                null
            ) {
                continue;
            }

            clusterGroups.sort(
                (a, b) => {
                    const rankDifference =
                        getGroupBranchRank(a) -
                        getGroupBranchRank(b);

                    if (
                        rankDifference !==
                        0
                    ) {
                        return rankDifference;
                    }

                    return (
                        a.id -
                        b.id
                    );
                }
            );

            const totalWidth =
                clusterGroups.reduce(
                    (
                        total,
                        group
                    ) =>
                        total +
                        getGroupWidth(
                            group
                        ),
                    0
                ) +
                (
                    clusterGroups.length -
                    1
                ) *
                generationSpacing;

            let cursor =
                anchor -
                totalWidth / 2;

            for (
                const group of
                clusterGroups
            ) {
                const width =
                    getGroupWidth(
                        group
                    );

                desiredCenters.set(
                    group.id,
                    cursor +
                    width / 2
                );

                cursor +=
                    width +
                    generationSpacing;
            }
        }

        /*
         * -----------------------------------------------------
         * Initial placement
         * -----------------------------------------------------
         */

        for (
            const group of
            generationGroups
        ) {
            setGroupCenter(
                group,
                desiredCenters.get(
                    group.id
                ) ?? 0
            );
        }

        /*
         * -----------------------------------------------------
         * Collision solver
         * -----------------------------------------------------
         */

        function resolveCollisions(
            passes: number
        ) {
            for (
                let pass = 0;
                pass < passes;
                pass++
            ) {
                const ordered =
                    [
                        ...generationGroups,
                    ].sort(
                        (a, b) => {
                            const aCenter =
                                groupCenter.get(
                                    a.id
                                ) ?? 0;

                            const bCenter =
                                groupCenter.get(
                                    b.id
                                ) ?? 0;

                            if (
                                aCenter !==
                                bCenter
                            ) {
                                return (
                                    aCenter -
                                    bCenter
                                );
                            }

                            const aRank =
                                getGroupBranchRank(
                                    a
                                );

                            const bRank =
                                getGroupBranchRank(
                                    b
                                );

                            if (
                                aRank !==
                                bRank
                            ) {
                                return (
                                    aRank -
                                    bRank
                                );
                            }

                            return (
                                a.id -
                                b.id
                            );
                        }
                    );

                let changed =
                    false;

                for (
                    let index = 0;
                    index <
                    ordered.length - 1;
                    index++
                ) {
                    const leftGroup =
                        ordered[index];

                    const rightGroup =
                        ordered[
                        index + 1
                        ];

                    const leftCenter =
                        groupCenter.get(
                            leftGroup.id
                        ) ?? 0;

                    const rightCenter =
                        groupCenter.get(
                            rightGroup.id
                        ) ?? 0;

                    const leftWidth =
                        getGroupWidth(
                            leftGroup
                        );

                    const rightWidth =
                        getGroupWidth(
                            rightGroup
                        );

                    const requiredDistance =
                        (
                            leftWidth +
                            rightWidth
                        ) /
                        2 +
                        generationSpacing;

                    const actualDistance =
                        rightCenter -
                        leftCenter;

                    const overlap =
                        requiredDistance -
                        actualDistance;

                    if (
                        overlap <=
                        0
                    ) {
                        continue;
                    }

                    changed =
                        true;

                    let leftMovement =
                        overlap / 2;

                    let rightMovement =
                        overlap / 2;

                    if (
                        leftGroup.isPartnershipGroup &&
                        !rightGroup.isPartnershipGroup
                    ) {
                        leftMovement =
                            overlap *
                            0.35;

                        rightMovement =
                            overlap *
                            0.65;
                    } else if (
                        !leftGroup.isPartnershipGroup &&
                        rightGroup.isPartnershipGroup
                    ) {
                        leftMovement =
                            overlap *
                            0.65;

                        rightMovement =
                            overlap *
                            0.35;
                    }

                    setGroupCenter(
                        leftGroup,
                        leftCenter -
                        leftMovement
                    );

                    setGroupCenter(
                        rightGroup,
                        rightCenter +
                        rightMovement
                    );
                }

                if (!changed) {
                    break;
                }
            }
        }

        /*
         * First broad collision pass.
         */
        resolveCollisions(30);

        /*
         * -----------------------------------------------------
         * Gentle anchor correction
         * -----------------------------------------------------
         */

        const anchorCorrection =
            0.15;

        for (
            const group of
            generationGroups
        ) {
            const currentCenter =
                groupCenter.get(
                    group.id
                );

            const desiredCenter =
                desiredCenters.get(
                    group.id
                );

            if (
                currentCenter ===
                undefined ||
                desiredCenter ===
                undefined
            ) {
                continue;
            }

            const correctedCenter =
                currentCenter +
                (
                    desiredCenter -
                    currentCenter
                ) *
                anchorCorrection;

            setGroupCenter(
                group,
                correctedCenter
            );
        }

        /*
         * Final collision pass.
         */
        resolveCollisions(50);
    }

    /*
     * ---------------------------------------------------------
     * Convert groups to positioned nodes
     * ---------------------------------------------------------
     *
     * Everything above is calculated in local component space.
     *
     * componentOffsetX then moves the COMPLETE component into
     * its position in the overall family tree.
     *
     * This is especially important for disconnected singles,
     * childless couples, and small independent families.
     * ---------------------------------------------------------
     */

    const result: PositionedNode[] =
        [];

    for (const id of component) {
        const colonist =
            colonistMap.get(id);

        if (!colonist) {
            continue;
        }

        const generation =
            generationMap.get(id) ??
            0;

        result.push({
            colonist,

            x:
                (
                    positions.get(id) ??
                    0
                ) +
                componentOffsetX,

            y:
                generation *
                yGap,

            generation,
        });
    }

    return result;
}

/*
 * ---------------------------------------------------------
 * Complete tree layout
 * ---------------------------------------------------------
 */

function layoutTree(
    colonists: FamilyTreeColonist[],
    parentChildren: FamilyTreeParentChild[],
    partnerships: FamilyTreePartnership[]
): PositionedNode[] {
    if (
        colonists.length ===
        0
    ) {
        return [];
    }

    const {
        colonistMap,
        parentsMap,
        childrenMap,
        partnershipMap,
    } =
        buildRelationshipMaps(
            colonists,
            parentChildren,
            partnerships
        );

    const components =
        buildConnectedComponents(
            colonists,
            parentsMap,
            childrenMap,
            partnershipMap
        );

    /*
     * ---------------------------------------------------------
     * DEBUG: connected components
     *
     * Standalone-only components are excluded.
     *
     * The actual components array is NOT modified.
     * ---------------------------------------------------------
     */

    if (DEBUG_LAYOUT) {
        const relevantComponents =
            components.filter((component) =>
                component.some((id) =>
                    isDebugRelevantColonist(
                        id,
                        parentsMap,
                        childrenMap,
                        partnershipMap
                    )
                )
            );

        console.groupCollapsed(
            `[FamilyTree] Connected components — ${components.length} total, ${relevantComponents.length} relevant`
        );

        console.table(
            relevantComponents.map(
                (
                    component
                ) => {
                    const originalIndex =
                        components.indexOf(
                            component
                        );

                    const relevantIds =
                        component.filter(
                            (id) =>
                                isDebugRelevantColonist(
                                    id,
                                    parentsMap,
                                    childrenMap,
                                    partnershipMap
                                )
                        );

                    return {
                        component:
                            originalIndex,

                        totalSize:
                            component.length,

                        relevantSize:
                            relevantIds.length,

                        members:
                            getDebugNames(
                                relevantIds,
                                colonistMap
                            ),
                    };
                }
            )
        );

        console.log(
            `Standalone-only components hidden from debug output: ${components.length - relevantComponents.length}.`
        );

        console.log(
            "Only colonists with parents, children, or a partner connected to a family branch are shown."
        );

        console.groupEnd();
    }

    /*
     * ---------------------------------------------------------
     * Component order
     * ---------------------------------------------------------
     */

    components.sort(
        (a, b) =>
            b.length -
            a.length
    );

    if (DEBUG_LAYOUT) {
        const relevantComponents =
            components.filter((component) =>
                component.some((id) =>
                    isDebugRelevantColonist(
                        id,
                        parentsMap,
                        childrenMap,
                        partnershipMap
                    )
                )
            );

        console.groupCollapsed(
            "[FamilyTree] Final component order"
        );

        console.table(
            relevantComponents.map(
                (
                    component
                ) => {
                    const layoutOrder =
                        components.indexOf(
                            component
                        );

                    const relevantIds =
                        component.filter(
                            (id) =>
                                isDebugRelevantColonist(
                                    id,
                                    parentsMap,
                                    childrenMap,
                                    partnershipMap
                                )
                        );

                    return {
                        layoutOrder,

                        totalSize:
                            component.length,

                        relevantSize:
                            relevantIds.length,

                        firstRelevant:
                            relevantIds.length > 0
                                ? getDebugName(
                                    relevantIds[0],
                                    colonistMap
                                )
                                : "None",

                        members:
                            getDebugNames(
                                relevantIds,
                                colonistMap
                            ),
                    };
                }
            )
        );

        console.groupEnd();
    }

    const result: PositionedNode[] = [];

    let componentOffsetX = 0;

    for (
        let componentIndex = 0;
        componentIndex <
        components.length;
        componentIndex++
    ) {
        const component =
            components[
            componentIndex
            ];

        if (DEBUG_LAYOUT) {
            const relevantIds =
                component.filter(
                    (id) =>
                        isDebugRelevantColonist(
                            id,
                            parentsMap,
                            childrenMap,
                            partnershipMap
                        )
                );

            /*
             * Only log meaningful components.
             *
             * IMPORTANT:
             * The component itself is still always passed to
             * layoutComponent below.
             */
            if (relevantIds.length > 0) {
                console.groupCollapsed(
                    `[FamilyTree] Laying out component ${componentIndex}`
                );

                console.log(
                    "Offset X:",
                    componentOffsetX
                );

                console.log(
                    "Relevant members:",
                    getDebugNames(
                        relevantIds,
                        colonistMap
                    )
                );

                console.groupEnd();
            }
        }

        const nodes =
            layoutComponent(
                component,
                parentsMap,
                childrenMap,
                partnershipMap,
                colonistMap,
                componentOffsetX
            );

        result.push(
            ...nodes
        );

        if (
            nodes.length > 0
        ) {
            const minX =
                Math.min(
                    ...nodes.map(
                        (node) =>
                            node.x
                    )
                );

            const maxX =
                Math.max(
                    ...nodes.map(
                        (node) =>
                            node.x
                    )
                );

            if (DEBUG_LAYOUT) {
                const hasRelevantNodes =
                    component.some((id) =>
                        isDebugRelevantColonist(
                            id,
                            parentsMap,
                            childrenMap,
                            partnershipMap
                        )
                    );

                if (hasRelevantNodes) {
                    console.log(
                        `[FamilyTree] Component ${componentIndex} bounds:`,
                        {
                            minX:
                                Math.round(
                                    minX
                                ),
                            maxX:
                                Math.round(
                                    maxX
                                ),
                            nextOffsetX:
                                Math.round(
                                    maxX +
                                    nodeWidth +
                                    componentGap
                                ),
                        }
                    );
                }
            }

            componentOffsetX =
                maxX +
                nodeWidth +
                componentGap;

            if (
                componentOffsetX <
                minX +
                nodeWidth
            ) {
                componentOffsetX =
                    minX +
                    nodeWidth +
                    componentGap;
            }
        }
    }

    return result;
}

/*
 * ---------------------------------------------------------
 * Bounds
 * ---------------------------------------------------------
 */

function getBounds(
    nodes: PositionedNode[]
) {
    if (
        nodes.length ===
        0
    ) {
        return {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0,
        };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
        minX = Math.min(
            minX,
            node.x
        );

        maxX = Math.max(
            maxX,
            node.x
        );

        minY = Math.min(
            minY,
            node.y
        );

        maxY = Math.max(
            maxY,
            node.y
        );
    }

    return {
        minX,
        maxX,
        minY,
        maxY,
    };
}

/*
 * ---------------------------------------------------------
 * Component
 * ---------------------------------------------------------
 */

export default function FamilyTree({
    colonists,
    parentChildren,
    partnerships,
}: Props) {
    const mode =
        useRef<
            "idle" |
            "drag" |
            "focus"
        >("idle");

    const [pos, setPos] =
        useState({
            x: 0,
            y: 0,
        });

    const [zoom, setZoom] =
        useState(1);

    const [highlightedNodeId, setHighlightedNodeId] =
        useState<number | null>(null);
    const [focusedColonistId, setFocusedColonistId] =
        useState<number | null>(null);


    const [familyFocus, setFamilyFocus] =
        useState(false);

    const [legacyFocus, setLegacyFocus] =
        useState(false);
    const targetPos =
        useRef({
            x: 0,
            y: 0,
        });



    const targetZoom =
        useRef(1);

    const dragging =
        useRef(false);

    const hasDragged =
        useRef(false);

    const last =
        useRef({
            x: 0,
            y: 0,
        });
    const activeFocusId =
        familyFocus || legacyFocus
            ? focusedColonistId
            : null;

    const visibleTreeData =
        useMemo(() => {
            if (
                activeFocusId === null
            ) {
                return {
                    colonists,
                    parentChildren,
                    partnerships,
                };
            }

            const focusIds =
                familyFocus
                    ? getFamilyFocusIds(
                        activeFocusId,
                        colonists,
                        parentChildren,
                        partnerships
                    )
                    : getLegacyFocusIds(
                        activeFocusId,
                        colonists,
                        partnerships
                    );

            const visibleColonists =
                colonists.filter(
                    (colonist) =>
                        focusIds.has(
                            colonist.id
                        )
                );

            const visibleParentChildren =
                parentChildren.filter(
                    (relationship) =>
                        focusIds.has(
                            relationship.parentId
                        ) &&
                        focusIds.has(
                            relationship.childId
                        )
                );

            const visiblePartnerships =
                partnerships.filter(
                    (relationship) =>
                        focusIds.has(
                            relationship.partnerAId
                        ) &&
                        focusIds.has(
                            relationship.partnerBId
                        )
                );

            return {
                colonists:
                    visibleColonists,
                parentChildren:
                    visibleParentChildren,
                partnerships:
                    visiblePartnerships,
            };
        }, [
            familyFocus,
            legacyFocus,
            activeFocusId,
            colonists,
            parentChildren,
            partnerships,
        ]);

    const layoutNodes =
        useMemo(
            () =>
                layoutTree(
                    visibleTreeData.colonists,
                    visibleTreeData.parentChildren,
                    visibleTreeData.partnerships
                ),
            [
                visibleTreeData,
            ]
        );

    const nodeMap =
        useMemo(
            () =>
                new Map(
                    layoutNodes.map(
                        (node) => [
                            node.colonist.id,
                            node,
                        ]

                    )
                ),
            [layoutNodes]
        );

    /*
     * ---------------------------------------------------------
     * Camera animation
     * ---------------------------------------------------------
     */

    useEffect(() => {
        let frame: number;

        const animate = () => {
            setPos(
                (current) => ({
                    x:
                        current.x +
                        (
                            targetPos
                                .current
                                .x -
                            current.x
                        ) *
                        0.14,

                    y:
                        current.y +
                        (
                            targetPos
                                .current
                                .y -
                            current.y
                        ) *
                        0.14,
                })
            );

            setZoom(
                (current) =>
                    current +
                    (
                        targetZoom
                            .current -
                        current
                    ) *
                    0.14
            );

            frame =
                requestAnimationFrame(
                    animate
                );
        };

        frame =
            requestAnimationFrame(
                animate
            );

        return () =>
            cancelAnimationFrame(
                frame
            );
    }, []);

    /*
     * ---------------------------------------------------------
     * Initial camera position
     * ---------------------------------------------------------
     */

    const initialCameraPositioned = useRef(false);

    useEffect(() => {
        if (
            initialCameraPositioned.current ||
            layoutNodes.length === 0
        ) {
            return;
        }

        const firstNode = layoutNodes[0];

        targetPos.current = {
            x: window.innerWidth / 2 - firstNode.x,
            y: window.innerHeight / 2 - firstNode.y,
        };

        targetZoom.current = 1;

        initialCameraPositioned.current = true;
    }, [layoutNodes]);

    useEffect(() => {
        if (
            (!familyFocus &&
                !legacyFocus) ||
            focusedColonistId === null
        ) {
            return;
        }

        const node =
            layoutNodes.find(
                (node) =>
                    node.colonist.id ===
                    focusedColonistId
            );

        if (!node) {
            return;
        }

        window.requestAnimationFrame(() => {
            focusNode(node);
        });
    }, [
        familyFocus,
        legacyFocus,
        focusedColonistId,
        layoutNodes,
    ]);

    /*
     * ---------------------------------------------------------
     * Mouse controls
     * ---------------------------------------------------------
     */

    function onMouseDown(
        e: React.MouseEvent
    ) {
        if (
            (
                e.target as HTMLElement
            ).closest(
                "input, button"
            )
        ) {
            return;
        }

        e.preventDefault();

        dragging.current =
            true;

        hasDragged.current =
            false;

        mode.current =
            "drag";

        last.current = {
            x: e.clientX,
            y: e.clientY,
        };
    }

    function onMouseMove(
        e: React.MouseEvent
    ) {
        if (
            mode.current !==
            "drag" ||
            !dragging.current
        ) {
            return;
        }

        const dx =
            e.clientX -
            last.current.x;

        const dy =
            e.clientY -
            last.current.y;

        if (
            Math.abs(dx) > 2 ||
            Math.abs(dy) > 2
        ) {
            hasDragged.current =
                true;
        }

        targetPos.current = {
            x:
                targetPos.current.x +
                dx,

            y:
                targetPos.current.y +
                dy,
        };

        last.current = {
            x: e.clientX,
            y: e.clientY,
        };
    }

    function onMouseUp() {
        dragging.current =
            false;

        mode.current =
            "idle";
    }

    /*
     * ---------------------------------------------------------
     * Mouse-relative zoom
     * ---------------------------------------------------------
     */

    function onWheel(
        e: React.WheelEvent
    ) {
        e.preventDefault();

        const oldZoom =
            targetZoom.current;

        const zoomFactor =
            e.deltaY < 0
                ? 1.1
                : 0.9;

        const newZoom =
            Math.min(
                maxZoom,
                Math.max(
                    minZoom,
                    oldZoom *
                    zoomFactor
                )
            );

        if (
            newZoom ===
            oldZoom
        ) {
            return;
        }

        const mouseX =
            e.clientX;

        const mouseY =
            e.clientY;

        const worldX =
            (
                mouseX -
                targetPos.current.x
            ) /
            oldZoom;

        const worldY =
            (
                mouseY -
                targetPos.current.y
            ) /
            oldZoom;

        targetPos.current = {
            x:
                mouseX -
                worldX *
                newZoom,

            y:
                mouseY -
                worldY *
                newZoom,
        };

        targetZoom.current =
            newZoom;
    }

    /*
     * ---------------------------------------------------------
     * Focus camera
     * ---------------------------------------------------------
     */

    function focusNode(
        node: PositionedNode
    ) {
        mode.current =
            "focus";

        const newZoom =
            1.5;

        targetZoom.current =
            newZoom;

        targetPos.current = {
            x:
                window.innerWidth /
                2 -
                node.x *
                newZoom,

            y:
                window.innerHeight /
                2 -
                node.y *
                newZoom,
        };

        window.setTimeout(
            () => {
                mode.current =
                    "idle";
            },
            500
        );
    }

    /*
     * ---------------------------------------------------------
     * Node controls
     * ---------------------------------------------------------
     */

    function onNodeClick(
        e: React.MouseEvent,
        node: PositionedNode
    ) {
        if (
            hasDragged.current
        ) {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        focusNode(node);
    }

    function onNodeDoubleClick(
        e: React.MouseEvent,
        colonistId: number
    ) {
        e.preventDefault();

        window.location.href =
            `/colonists/${colonistId}`;
    }
    function focusFamily() {
        if (focusedColonistId === null) {
            return;
        }

        setLegacyFocus(false);
        setFamilyFocus(true);
    }

    function focusLegacy() {
        if (focusedColonistId === null) {
            return;
        }

        setFamilyFocus(false);
        setLegacyFocus(true);
    }

    function showFullTree() {
        setFamilyFocus(false);
        setLegacyFocus(false);

        if (
            focusedColonistId === null
        ) {
            return;
        }

        const node =
            nodeMap.get(
                focusedColonistId
            );

        if (node) {
            window.requestAnimationFrame(
                () => {
                    focusNode(node);
                }
            );
        }
    }

    function refocusColonist() {
        if (focusedColonistId === null) {
            return;
        }

        const node =
            nodeMap.get(
                focusedColonistId
            );

        if (node) {
            setHighlightedNodeId(
                focusedColonistId
            );

            focusNode(node);
        }
    }
    function unfocusColonist() {
        setFocusedColonistId(null);
        setHighlightedNodeId(null);
        setFamilyFocus(false);
        setLegacyFocus(false);
    }

    return (
        <div
            className="relative h-screen overflow-hidden bg-zinc-900"
            style={{
                cursor:
                    dragging.current
                        ? "grabbing"
                        : "grab",

                userSelect:
                    "none",

                WebkitUserSelect:
                    "none",

                overscrollBehavior:
                    "none",

                touchAction:
                    "none",
            }}
            onMouseDown={
                onMouseDown
            }
            onMouseMove={
                onMouseMove
            }
            onMouseUp={
                onMouseUp
            }
            onMouseLeave={
                onMouseUp
            }
            onWheel={onWheel}
        >
            {/* Search */}
            <FamilyTreeSearch
                colonists={colonists}
                onSelect={(colonistId) => {
                    const node =
                        nodeMap.get(
                            colonistId
                        );

                    if (node) {
                        setHighlightedNodeId(
                            colonistId
                        );

                        setFocusedColonistId(
                            colonistId
                        );

                        focusNode(node);
                    }
                }}
            />
            <FamilyTreeNavigation
                focusedColonist={
                    focusedColonistId !== null
                        ? colonists.find(
                            (colonist) =>
                                colonist.id ===
                                focusedColonistId
                        ) ?? null
                        : null
                }
                familyFocus={
                    familyFocus
                }
                legacyFocus={
                    legacyFocus
                }
                onFocusFamily={
                    focusFamily
                }
                onFocusLegacy={
                    focusLegacy
                }
                onShowFullTree={
                    showFullTree
                }
                onRefocus={
                    refocusColonist
                }
                onUnfocus={
                    unfocusColonist
                }
            />

            {/* Camera */}
            <div
                className="absolute left-0 top-0"
                style={{
                    transform:
                        `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,

                    transformOrigin:
                        "0 0",
                }}
            >
                {/* Relationship lines */}
                <FamilyTreeConnections
                    parentChildren={parentChildren}
                    partnerships={partnerships}
                    nodeMap={nodeMap}
                    nodeHeight={nodeHeight}
                />

                {/* Nodes */}
                {layoutNodes.map(
                    (node) => {
                        const colonist =
                            node.colonist;

                        const name =
                            getColonistName(
                                colonist
                            );
                        const legacyColor = colonist.legacy?.color ?? "#3f3f46";
                        const isHighlighted =
                            highlightedNodeId === colonist.id;

                        return (
                            <FamilyTreeNode
                                key={colonist.id}
                                colonist={colonist}
                                node={node}
                                legacyColor={legacyColor}
                                name={name}
                                isHighlighted={isHighlighted}
                                hasDragged={hasDragged}
                                onFocus={() => focusNode(node)}
                                onHighlight={() => {
                                    setHighlightedNodeId(
                                        colonist.id
                                    );

                                    setFocusedColonistId(
                                        colonist.id
                                    );
                                }}
                            />
                        );
                    }
                )}
            </div>
        </div>
    );
}