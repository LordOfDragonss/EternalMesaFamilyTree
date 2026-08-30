"use client";

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Image from "next/image";

type FamilyTreeColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    isDead: boolean;
    imageURL: string | null;
    legacy: {
        color: string | null;
    } | null;
};

type FamilyTreeParentChild = {
    parentId: number;
    childId: number;
};

type FamilyTreePartnership = {
    partnerAId: number;
    partnerBId: number;
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

function getColonistName(
    colonist: FamilyTreeColonist
) {
    return `${colonist.firstName}${colonist.nickname
            ? ` "${colonist.nickname}"`
            : ""
        } ${colonist.lastName}`;
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
    }

    const partnershipMap =
        new Map<number, Set<number>>();

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
    }

    return {
        colonistMap,
        parentsMap,
        childrenMap,
        partnershipMap,
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
 *
 * Generations are first calculated exclusively from ancestry.
 *
 * Partnerships are then aligned to the deepest generation
 * occupied by any member of the partnership group.
 *
 * This means:
 *
 *     Petra = generation 1
 *     Rom   = generation 3
 *
 * becomes:
 *
 *     Petra = generation 3
 *     Rom   = generation 3
 *
 * The important part is that this does NOT recursively move
 * the children of Petra. Petra simply occupies the same visual
 * generation as Rom.
 * ---------------------------------------------------------
 */

function calculateGenerations(
    component: number[],
    parentsMap: Map<number, number[]>,
    childrenMap: Map<number, number[]>,
    partnershipMap: Map<number, Set<number>>
) {
    const generation =
        new Map<number, number>();

    const componentSet =
        new Set(component);

    /*
     * Find ancestry roots.
     */
    const roots =
        component.filter((id) => {
            const parents =
                parentsMap.get(id) ?? [];

            return !parents.some((parentId) =>
                componentSet.has(parentId)
            );
        });

    const queue: number[] = [];

    for (const root of roots) {
        generation.set(root, 0);
        queue.push(root);
    }

    /*
     * Calculate ancestry generations.
     *
     * We use the deepest parent path so that a person with
     * multiple parents is placed below the deepest relevant
     * ancestry branch.
     */
    while (queue.length > 0) {
        const currentId =
            queue.shift()!;

        const currentGeneration =
            generation.get(currentId);

        if (
            currentGeneration ===
            undefined
        ) {
            continue;
        }

        const children =
            childrenMap.get(currentId) ?? [];

        for (const childId of children) {
            if (!componentSet.has(childId)) {
                continue;
            }

            const proposedGeneration =
                currentGeneration + 1;

            const existingGeneration =
                generation.get(childId);

            if (
                existingGeneration ===
                undefined ||
                proposedGeneration >
                existingGeneration
            ) {
                generation.set(
                    childId,
                    proposedGeneration
                );

                queue.push(childId);
            }
        }
    }

    /*
     * Anything not reached by ancestry is a root.
     */
    for (const id of component) {
        if (!generation.has(id)) {
            generation.set(id, 0);
        }
    }

    /*
     * Align partnership groups.
     *
     * Partnership relationships are treated as connected
     * groups so that A-B-C partnerships are kept together.
     */
    const visited =
        new Set<number>();

    for (const id of component) {
        if (visited.has(id)) {
            continue;
        }

        const partnershipGroup: number[] = [];

        const queue = [id];

        visited.add(id);

        while (queue.length > 0) {
            const currentId =
                queue.shift()!;

            partnershipGroup.push(
                currentId
            );

            const partners =
                partnershipMap.get(
                    currentId
                ) ??
                new Set<number>();

            for (const partnerId of partners) {
                if (
                    !componentSet.has(
                        partnerId
                    ) ||
                    visited.has(
                        partnerId
                    )
                ) {
                    continue;
                }

                visited.add(partnerId);
                queue.push(partnerId);
            }
        }

        if (
            partnershipGroup.length <=
            1
        ) {
            continue;
        }

        const targetGeneration =
            Math.max(
                ...partnershipGroup.map(
                    (memberId) =>
                        generation.get(
                            memberId
                        ) ?? 0
                )
            );

        for (
            const memberId of
            partnershipGroup
        ) {
            generation.set(
                memberId,
                targetGeneration
            );
        }
    }

    return generation;
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

    const visited =
        new Set<number>();

    const idSet =
        new Set(ids);

    let groupId = 0;

    for (const id of ids) {
        if (visited.has(id)) {
            continue;
        }

        const memberIds: number[] = [];

        const queue = [id];

        visited.add(id);

        while (queue.length > 0) {
            const currentId =
                queue.shift()!;

            memberIds.push(
                currentId
            );

            const partners =
                partnershipMap.get(
                    currentId
                ) ??
                new Set<number>();

            for (const partnerId of partners) {
                if (
                    !idSet.has(partnerId) ||
                    visited.has(partnerId)
                ) {
                    continue;
                }

                if (
                    generationMap.get(
                        partnerId
                    ) !==
                    generationMap.get(
                        currentId
                    )
                ) {
                    continue;
                }

                visited.add(partnerId);
                queue.push(partnerId);
            }
        }

        groups.push({
            id: groupId++,
            memberIds,
            generation:
                generationMap.get(id) ?? 0,
            isPartnershipGroup:
                memberIds.length > 1,
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

    /*
     * groupCenter is the actual center of the group.
     *
     * This is deliberately separate from the desired center.
     * Desired positions represent where relationships want the
     * group to be. Actual positions are then collision-resolved
     * around those desired positions.
     */
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
                group.memberIds.length - 1,
                0
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

        const parentCenters: number[] = [];

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
                (sum, value) =>
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
        const parentCenters: number[] = [];

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
                (sum, value) =>
                    sum + value,
                0
            ) /
            parentCenters.length
        );
    }

    /*
     * ---------------------------------------------------------
     * First generation
     * ---------------------------------------------------------
     *
     * Roots have no parent anchors, so they are simply placed
     * next to each other.
     */
    const firstGeneration =
        groupsByGeneration.get(
            generations[0]
        ) ?? [];

    let initialCursor =
        componentOffsetX;

    for (const group of firstGeneration) {
        const width =
            getGroupWidth(group);

        const center =
            initialCursor +
            width / 2;

        setGroupCenter(
            group,
            center
        );

        initialCursor +=
            width +
            minimumNodeSpacing;
    }

    /*
     * ---------------------------------------------------------
     * Subsequent generations
     * ---------------------------------------------------------
     *
     * Every group gets a desired CENTER.
     *
     * This is important: the collision system below works with
     * centers instead of left edges. That makes it possible to
     * move groups in either direction symmetrically.
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

        const desiredCenters =
            new Map<number, number>();

        /*
         * Calculate relationship-based desired positions.
         */
        for (const group of generationGroups) {
            const targets: number[] = [];

            /*
             * Partnership groups have potentially different
             * parent anchors for every member.
             *
             * We find the center that best satisfies all of them.
             */
            if (group.isPartnershipGroup) {
                for (
                    let index = 0;
                    index <
                    group.memberIds.length;
                    index++
                ) {
                    const memberId =
                        group.memberIds[index];

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
                        getGroupWidth(group);

                    const memberOffset =
                        index *
                        (
                            nodeWidth +
                            partnerSpacing
                        ) +
                        nodeWidth / 2 -
                        width / 2;

                    /*
                     * If this member should sit on the parent
                     * anchor, this is where the entire group's
                     * center needs to be.
                     */
                    targets.push(
                        parentAnchor -
                        memberOffset
                    );
                }
            }

            /*
             * Normal group / sibling group.
             */
            if (
                targets.length ===
                0
            ) {
                const cluster =
                    siblingClusterByMember.get(
                        group.memberIds[0]
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
             * Normal child with parents.
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
             * No relationship anchor.
             *
             * Use the component center as a fallback.
             */
            if (
                targets.length ===
                0
            ) {
                targets.push(
                    componentOffsetX
                );
            }

            const desired =
                targets.reduce(
                    (sum, value) =>
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
         *
         * If several siblings share exactly the same parent
         * anchor, spread them around that anchor before collision
         * resolution.
         *
         * Partnership groups are NOT included here.
         */
        const processedClusters =
            new Set<number>();

        for (const cluster of siblingClusters) {
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
                    .map((memberId) =>
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
                (a, b) =>
                    a.id -
                    b.id
            );

            /*
             * Calculate the total width of the sibling row.
             */
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
                xGap;

            let cursor =
                anchor -
                totalWidth / 2;

            for (const group of clusterGroups) {
                const width =
                    getGroupWidth(group);

                desiredCenters.set(
                    group.id,
                    cursor +
                    width / 2
                );

                cursor +=
                    width +
                    xGap;
            }
        }

        /*
         * -----------------------------------------------------
         * Initial placement
         * -----------------------------------------------------
         */

        for (const group of generationGroups) {
            setGroupCenter(
                group,
                desiredCenters.get(
                    group.id
                ) ??
                componentOffsetX
            );
        }

        /*
         * -----------------------------------------------------
         * Symmetric collision solver
         * -----------------------------------------------------
         *
         * This is the major change.
         *
         * The old layout effectively did:
         *
         *     A -> A
         *     B -> B + overlap
         *
         * which creates the large one-sided pushes.
         *
         * We instead do:
         *
         *     A -> A - overlap / 2
         *     B -> B + overlap / 2
         *
         * and repeat this a few times.
         *
         * This allows the whole generation to expand around its
         * relationship anchors instead of drifting endlessly in
         * one direction.
         * -----------------------------------------------------
         */

        const collisionPasses = 12;

        for (
            let pass = 0;
            pass <
            collisionPasses;
            pass++
        ) {
            const ordered =
                [...generationGroups].sort(
                    (a, b) => {
                        const aCenter =
                            groupCenter.get(
                                a.id
                            ) ??
                            componentOffsetX;

                        const bCenter =
                            groupCenter.get(
                                b.id
                            ) ??
                            componentOffsetX;

                        return (
                            aCenter -
                            bCenter
                        );
                    }
                );

            let hadCollision =
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

                const leftWidth =
                    getGroupWidth(
                        leftGroup
                    );

                const rightWidth =
                    getGroupWidth(
                        rightGroup
                    );

                const leftCenter =
                    groupCenter.get(
                        leftGroup.id
                    ) ??
                    componentOffsetX;

                const rightCenter =
                    groupCenter.get(
                        rightGroup.id
                    ) ??
                    componentOffsetX;

                const requiredDistance =
                    (
                        leftWidth +
                        rightWidth
                    ) /
                    2 +
                    xGap;

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

                hadCollision =
                    true;

                /*
                 * Move both groups away from each other.
                 *
                 * Partnership groups get slightly more protection
                 * from movement because they have multiple
                 * relationship anchors.
                 */
                let leftMovement =
                    overlap / 2;

                let rightMovement =
                    overlap / 2;

                if (
                    leftGroup.isPartnershipGroup &&
                    !rightGroup.isPartnershipGroup
                ) {
                    leftMovement =
                        overlap * 0.2;

                    rightMovement =
                        overlap * 0.8;
                } else if (
                    !leftGroup.isPartnershipGroup &&
                    rightGroup.isPartnershipGroup
                ) {
                    leftMovement =
                        overlap * 0.8;

                    rightMovement =
                        overlap * 0.2;
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

            if (!hadCollision) {
                break;
            }
        }

        /*
         * -----------------------------------------------------
         * Pull groups back toward relationship anchors
         * -----------------------------------------------------
         *
         * Collision resolution necessarily moves some groups away
         * from where their relationships want them.
         *
         * Instead of snapping them back, apply a gentle correction.
         *
         * This keeps the tree compact without reintroducing
         * one-sided pushing.
         * -----------------------------------------------------
         */

        const anchorCorrection =
            0.25;

        for (const group of generationGroups) {
            const currentCenter =
                groupCenter.get(
                    group.id
                );

            if (
                currentCenter ===
                undefined
            ) {
                continue;
            }

            const desiredCenter =
                desiredCenters.get(
                    group.id
                );

            if (
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
         * -----------------------------------------------------
         * One final symmetric collision pass
         * -----------------------------------------------------
         *
         * The anchor correction above may have brought groups
         * together again, so resolve those collisions one more
         * time.
         * -----------------------------------------------------
         */

        for (
            let pass = 0;
            pass < 6;
            pass++
        ) {
            const ordered =
                [...generationGroups].sort(
                    (a, b) => {
                        const aCenter =
                            groupCenter.get(
                                a.id
                            ) ??
                            componentOffsetX;

                        const bCenter =
                            groupCenter.get(
                                b.id
                            ) ??
                            componentOffsetX;

                        return (
                            aCenter -
                            bCenter
                        );
                    }
                );

            let hadCollision =
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

                const leftWidth =
                    getGroupWidth(
                        leftGroup
                    );

                const rightWidth =
                    getGroupWidth(
                        rightGroup
                    );

                const leftCenter =
                    groupCenter.get(
                        leftGroup.id
                    ) ??
                    componentOffsetX;

                const rightCenter =
                    groupCenter.get(
                        rightGroup.id
                    ) ??
                    componentOffsetX;

                const requiredDistance =
                    (
                        leftWidth +
                        rightWidth
                    ) /
                    2 +
                    xGap;

                const overlap =
                    requiredDistance -
                    (
                        rightCenter -
                        leftCenter
                    );

                if (
                    overlap <=
                    0
                ) {
                    continue;
                }

                hadCollision =
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
                        overlap * 0.2;

                    rightMovement =
                        overlap * 0.8;
                } else if (
                    !leftGroup.isPartnershipGroup &&
                    rightGroup.isPartnershipGroup
                ) {
                    leftMovement =
                        overlap * 0.8;

                    rightMovement =
                        overlap * 0.2;
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

            if (!hadCollision) {
                break;
            }
        }
    }

    /*
     * ---------------------------------------------------------
     * Convert groups to positioned nodes
     * ---------------------------------------------------------
     */

    const result: PositionedNode[] = [];

    for (const id of component) {
        const colonist =
            colonistMap.get(id);

        if (!colonist) {
            continue;
        }

        const generation =
            generationMap.get(id) ?? 0;

        result.push({
            colonist,

            x:
                positions.get(id) ??
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
     * Put the largest family first.
     */
    components.sort(
        (a, b) =>
            b.length -
            a.length
    );

    const result: PositionedNode[] = [];

    let componentOffsetX = 0;

    for (
        const component of
        components
    ) {
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

            componentOffsetX =
                maxX +
                nodeWidth +
                componentGap;

            /*
             * Keep the next component from accidentally
             * overlapping the current one.
             */
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

    const layoutNodes =
        useMemo(
            () =>
                layoutTree(
                    colonists,
                    parentChildren,
                    partnerships
                ),
            [
                colonists,
                parentChildren,
                partnerships,
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

    useEffect(() => {
        if (layoutNodes.length === 0) {
            return;
        }

        const firstNode = layoutNodes[0];

        targetPos.current = {
            x:
                window.innerWidth / 2 -
                firstNode.x,

            y:
                window.innerHeight / 2 -
                firstNode.y,
        };

        targetZoom.current = 1;
    }, [layoutNodes]);

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

    /*
     * ---------------------------------------------------------
     * Relationship lines
     * ---------------------------------------------------------
     */

    const parentLines =
        parentChildren.flatMap(
            (relationship) => {
                const parent =
                    nodeMap.get(
                        relationship.parentId
                    );

                const child =
                    nodeMap.get(
                        relationship.childId
                    );

                if (
                    !parent ||
                    !child
                ) {
                    return [];
                }

                return [
                    {
                        id:
                            `${relationship.parentId}-${relationship.childId}`,

                        x1:
                            parent.x,

                        y1:
                            parent.y +
                            nodeHeight /
                            2,

                        x2:
                            child.x,

                        y2:
                            child.y -
                            nodeHeight /
                            2,
                    },
                ];
            }
        );

    const partnershipLines =
        partnerships.flatMap(
            (relationship) => {
                const a =
                    nodeMap.get(
                        relationship.partnerAId
                    );

                const b =
                    nodeMap.get(
                        relationship.partnerBId
                    );

                if (
                    !a ||
                    !b ||
                    a.generation !==
                    b.generation
                ) {
                    return [];
                }

                return [
                    {
                        id:
                            `${relationship.partnerAId}-${relationship.partnerBId}`,

                        x1:
                            a.x,

                        y1:
                            a.y,

                        x2:
                            b.x,

                        y2:
                            b.y,
                    },
                ];
            }
        );

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
            {/* <div
                className="absolute left-1/2 top-4 z-20 -translate-x-1/2"
                onMouseDown={(e) =>
                    e.stopPropagation()
                }
            >
                <input
                    type="text"
                    placeholder="Search Family Member"
                    className="w-96 rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-500"
                    style={{
                        userSelect:
                            "text",

                        WebkitUserSelect:
                            "text",
                    }}
                />
            </div> */}

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
                <svg
                    className="pointer-events-none absolute left-0 top-0 overflow-visible"
                    style={{
                        width: 1,
                        height: 1,
                    }}
                >
                    {parentLines.map(
                        (line) => (
                            <line
                                key={
                                    line.id
                                }
                                x1={
                                    line.x1
                                }
                                y1={
                                    line.y1
                                }
                                x2={
                                    line.x2
                                }
                                y2={
                                    line.y2
                                }
                                stroke="currentColor"
                                className="text-zinc-600"
                                strokeWidth={
                                    3
                                }
                            />
                        )
                    )}

                    {partnershipLines.map(
                        (line) => (
                            <line
                                key={
                                    line.id
                                }
                                x1={
                                    line.x1
                                }
                                y1={
                                    line.y1
                                }
                                x2={
                                    line.x2
                                }
                                y2={
                                    line.y2
                                }
                                stroke="currentColor"
                                className="text-orange-500"
                                strokeWidth={
                                    3
                                }
                            />
                        )
                    )}
                </svg>

                {/* Nodes */}
                {layoutNodes.map(
                    (node) => {
                        const colonist =
                            node.colonist;

                        const name =
                            getColonistName(
                                colonist
                            );

                        return (
                            <div
                                key={
                                    colonist.id
                                }
                                className="absolute"
                                style={{
                                    left:
                                        node.x -
                                        nodeWidth /
                                        2,

                                    top:
                                        node.y -
                                        nodeHeight /
                                        2,

                                    width:
                                        nodeWidth,

                                    height:
                                        nodeHeight,
                                }}
                            >
                                <a
                                    href={`/colonists/${colonist.id}`}
                                    onClick={(
                                        e
                                    ) =>
                                        onNodeClick(
                                            e,
                                            node
                                        )
                                    }
                                    onDoubleClick={(
                                        e
                                    ) =>
                                        onNodeDoubleClick(
                                            e,
                                            colonist.id
                                        )}
                                    className="block h-full w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 shadow-xl transition-all hover:scale-105 hover:border-orange-500 hover:shadow-orange-500/20"
                                    style={
                                        colonist
                                            .legacy
                                            ?.color
                                            ? {
                                                borderColor:
                                                    colonist
                                                        .legacy
                                                        .color,
                                            }
                                            : undefined
                                    }
                                >
                                    <div className="flex h-full items-center gap-3">
                                        {colonist.imageURL ? (
                                            <Image
                                                src={`/api/images/${colonist.imageURL}`}
                                                alt={
                                                    name
                                                }
                                                width={
                                                    56
                                                }
                                                height={
                                                    72
                                                }
                                                draggable={
                                                    false
                                                }
                                                className="h-[72px] w-14 flex-shrink-0 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-[72px] w-14 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-600 text-xl text-zinc-400">
                                                ?
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <div
                                                className={`truncate font-medium ${colonist.isDead
                                                        ? "text-zinc-500"
                                                        : "text-white"
                                                    }`}
                                            >
                                                {
                                                    colonist.firstName
                                                }{" "}
                                                {colonist.nickname &&
                                                    `"${colonist.nickname}"`}
                                            </div>

                                            <div
                                                className={`truncate text-sm ${colonist.isDead
                                                        ? "text-zinc-600"
                                                        : "text-zinc-400"
                                                    }`}
                                            >
                                                {
                                                    colonist.lastName
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        );
                    }
                )}
            </div>
        </div>
    );
}