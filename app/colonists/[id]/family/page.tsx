import { prisma } from "@/lib/prisma";
import {
    Card,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import ColonistHeader from "@/app/components/ColonistHeader";
import ColonistNavigation from "../ColonistNavigation";
import FamilyMember from "@/app/components/FamilyMember";

import {
    getAuntUncleLabel,
    getChildLabel,
    getGrandparentLabel,
    getParentLabel,
    getPartnerLabel,
    getSiblingLabel,
    getCousinLabel,
} from "@/app/lib/relationshipHelpers";

export default async function ColonistFamilyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const colonistId = Number(id);

    const colonist = await prisma.colonist.findUnique({
        where: {
            id: colonistId,
        },
        include: {
            legacy: true,

            // Parents
            parents: {
                include: {
                    parent: {
                        include: {
                            legacy: true,

                            // Children of the parent
                            // Used for siblings
                            children: {
                                include: {
                                    child: {
                                        include: {
                                            legacy: true,

                                            // Children of siblings
                                            // Used for first cousins once removed
                                            children: {
                                                include: {
                                                    child: {
                                                        include: {
                                                            legacy: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },

                            // Parents of the parent
                            // Used for grandparents and aunts/uncles
                            parents: {
                                include: {
                                    parent: {
                                        include: {
                                            legacy: true,

                                            // Children of the grandparent
                                            // Used for aunts/uncles and cousins
                                            children: {
                                                include: {
                                                    child: {
                                                        include: {
                                                            legacy: true,

                                                            // Children of aunts/uncles
                                                            // Used for cousins
                                                            children: {
                                                                include: {
                                                                    child: {
                                                                        include: {
                                                                            legacy: true,

                                                                            // Children of first cousins
                                                                            // Used for first cousin once removed
                                                                            children: {
                                                                                include: {
                                                                                    child: {
                                                                                        include: {
                                                                                            legacy: true,
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },

                                            // Parents of the grandparent
                                            // Used for great-grandparents and second cousins
                                            parents: {
                                                include: {
                                                    parent: {
                                                        include: {
                                                            legacy: true,

                                                            // Children of the great-grandparent
                                                            // Used to find grandparent siblings
                                                            children: {
                                                                include: {
                                                                    child: {
                                                                        include: {
                                                                            legacy: true,

                                                                            // Children of grandparent siblings
                                                                            // Used for second cousins
                                                                            children: {
                                                                                include: {
                                                                                    child: {
                                                                                        include: {
                                                                                            legacy: true,

                                                                                            // Children of second cousins
                                                                                            // Future-proofing for descendants
                                                                                            children: {
                                                                                                include: {
                                                                                                    child: {
                                                                                                        include: {
                                                                                                            legacy: true,
                                                                                                        },
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // Children
            children: {
                include: {
                    child: {
                        include: {
                            legacy: true,
                        },
                    },
                },
            },

            // Partners
            partnerARelationships: {
                include: {
                    partnerB: {
                        include: {
                            legacy: true,
                        },
                    },
                },
            },

            partnerBRelationships: {
                include: {
                    partnerA: {
                        include: {
                            legacy: true,
                        },
                    },
                },
            },
        },
    });

    if (!colonist) {
        return <h1>Colonist not found</h1>;
    }

    /*
     * Partners
     */
    const partners = [
        ...colonist.partnerARelationships.map((relationship) => ({
            colonist: relationship.partnerB,
            type: relationship.type,
        })),

        ...colonist.partnerBRelationships.map((relationship) => ({
            colonist: relationship.partnerA,
            type: relationship.type,
        })),
    ];

    /*
     * Parents
     */
    const parents = colonist.parents.map((relationship) => ({
        colonist: relationship.parent,
        type: relationship.type,
    }));

    const biologicalMother = parents.find(
        (parent) =>
            parent.type === "Biological" &&
            parent.colonist.gender === "Female"
    );

    const biologicalFather = parents.find(
        (parent) =>
            parent.type === "Biological" &&
            parent.colonist.gender === "Male"
    );

    const otherParents = parents.filter(
        (parent) => parent.type !== "Biological"
    );

    /*
     * Siblings
     *
     * Any other child of one of this colonist's parents.
     */
    const siblings = Array.from(
        new Map(
            colonist.parents
                .flatMap((relationship) =>
                    relationship.parent.children.map(
                        (childRelationship) =>
                            childRelationship.child
                    )
                )
                .filter(
                    (sibling) =>
                        sibling.id !== colonist.id
                )
                .map((sibling) => [
                    sibling.id,
                    sibling,
                ])
        ).values()
    );

    /*
     * Grandparents
     */
    const maternalGrandparents = Array.from(
        new Map(
            colonist.parents
                .filter(
                    (relationship) =>
                        relationship.parent.gender === "Female"
                )
                .flatMap((relationship) =>
                    relationship.parent.parents.map(
                        (grandparentRelationship) =>
                            grandparentRelationship.parent
                    )
                )
                .map((grandparent) => [
                    grandparent.id,
                    grandparent,
                ])
        ).values()
    );

    const paternalGrandparents = Array.from(
        new Map(
            colonist.parents
                .filter(
                    (relationship) =>
                        relationship.parent.gender === "Male"
                )
                .flatMap((relationship) =>
                    relationship.parent.parents.map(
                        (grandparentRelationship) =>
                            grandparentRelationship.parent
                    )
                )
                .map((grandparent) => [
                    grandparent.id,
                    grandparent,
                ])
        ).values()
    );

    /*
     * Aunts & Uncles
     *
     * Find the siblings of each parent by looking at
     * the children of that parent's parents.
     */
    const parentIds = new Set(
        colonist.parents.map(
            (relationship) =>
                relationship.parent.id
        )
    );

    const maternalAuntsAndUncles = new Map<
        number,
        (typeof colonist.parents[number]["parent"]["parents"][number]["parent"]["children"][number]["child"])
    >();

    const paternalAuntsAndUncles = new Map<
        number,
        (typeof colonist.parents[number]["parent"]["parents"][number]["parent"]["children"][number]["child"])
    >();

    for (const relationship of colonist.parents) {
        const parent = relationship.parent;

        for (const grandparentRelationship of parent.parents) {
            const grandparent =
                grandparentRelationship.parent;

            for (const childRelationship of grandparent.children) {
                const relative =
                    childRelationship.child;

                if (relative.id === colonist.id) {
                    continue;
                }

                if (parentIds.has(relative.id)) {
                    continue;
                }

                if (parent.gender === "Female") {
                    maternalAuntsAndUncles.set(
                        relative.id,
                        relative
                    );
                } else if (parent.gender === "Male") {
                    paternalAuntsAndUncles.set(
                        relative.id,
                        relative
                    );
                }
            }
        }
    }

    const maternalAuntsAndUnclesList =
        Array.from(
            maternalAuntsAndUncles.values()
        );

    const paternalAuntsAndUnclesList =
        Array.from(
            paternalAuntsAndUncles.values()
        );

    /*
     * Cousins
     */
    const maternalCousins = new Map();
    const paternalCousins = new Map();

    const maternalCousinsOnceRemoved = new Map();
    const paternalCousinsOnceRemoved = new Map();

    const maternalSecondCousins = new Map();
    const paternalSecondCousins = new Map();

    for (const relationship of colonist.parents) {
        const parent = relationship.parent;

        for (const grandparentRelationship of parent.parents) {
            const grandparent =
                grandparentRelationship.parent;

            /*
             * Children of the grandparent are the
             * parent's siblings.
             */
            for (const childRelationship of grandparent.children) {
                const auntOrUncle =
                    childRelationship.child;

                if (auntOrUncle.id === parent.id) {
                    continue;
                }

                /*
                 * Children of the aunt/uncle
                 * = First cousins
                 */
                for (const cousinRelationship of auntOrUncle.children) {
                    const cousin =
                        cousinRelationship.child;

                    if (cousin.id === colonist.id) {
                        continue;
                    }

                    if (parent.gender === "Female") {
                        maternalCousins.set(
                            cousin.id,
                            cousin
                        );
                    } else if (parent.gender === "Male") {
                        paternalCousins.set(
                            cousin.id,
                            cousin
                        );
                    }

                    /*
                     * Children of the first cousin
                     * = First cousin once removed
                     */
                    for (const removedRelationship of cousin.children) {
                        const removed =
                            removedRelationship.child;

                        if (removed.id === colonist.id) {
                            continue;
                        }

                        if (parent.gender === "Female") {
                            maternalCousinsOnceRemoved.set(
                                removed.id,
                                removed
                            );
                        } else if (parent.gender === "Male") {
                            paternalCousinsOnceRemoved.set(
                                removed.id,
                                removed
                            );
                        }
                    }
                }
            }

            /*
             * Children of the great-grandparent's
             * children are used to find second cousins.
             */
            for (const greatGrandparentRelationship of grandparent.parents) {
                const greatGrandparent =
                    greatGrandparentRelationship.parent;

                for (const siblingRelationship of greatGrandparent.children) {
                    const grandparentSibling =
                        siblingRelationship.child;

                    if (
                        grandparentSibling.id ===
                        grandparent.id
                    ) {
                        continue;
                    }

                    for (const secondCousinParentRelationship of grandparentSibling.children) {
                        const secondCousinParent =
                            secondCousinParentRelationship.child;

                        for (const secondCousinRelationship of secondCousinParent.children) {
                            const secondCousin =
                                secondCousinRelationship.child;

                            if (
                                secondCousin.id ===
                                colonist.id
                            ) {
                                continue;
                            }

                            if (parent.gender === "Female") {
                                maternalSecondCousins.set(
                                    secondCousin.id,
                                    secondCousin
                                );
                            } else if (parent.gender === "Male") {
                                paternalSecondCousins.set(
                                    secondCousin.id,
                                    secondCousin
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    const maternalCousinsList =
        Array.from(
            maternalCousins.values()
        );

    const paternalCousinsList =
        Array.from(
            paternalCousins.values()
        );

    const maternalCousinsOnceRemovedList =
        Array.from(
            maternalCousinsOnceRemoved.values()
        );

    const paternalCousinsOnceRemovedList =
        Array.from(
            paternalCousinsOnceRemoved.values()
        );

    const maternalSecondCousinsList =
        Array.from(
            maternalSecondCousins.values()
        );

    const paternalSecondCousinsList =
        Array.from(
            paternalSecondCousins.values()
        );

    /*
     * Children
     */
    const children = colonist.children.map(
        (relationship) => ({
            colonist: relationship.child,
        })
    );

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
            <Stack gap="xl">

                <ColonistHeader colonist={colonist} />

                <ColonistNavigation
                    colonistId={colonist.id}
                />

                {/* Parents */}
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
                            <Title order={3}>
                                Parents
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                The parents recorded for this colonist.
                            </Text>
                        </div>

                        {parents.length === 0 ? (
                            <Text c="dimmed">
                                No parents recorded.
                            </Text>
                        ) : (
                            <Stack gap="lg">

                                {/* Biological parents */}
                                {(biologicalMother ||
                                    biologicalFather) && (
                                        <div>
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                mb="xs"
                                            >
                                                Biological parents
                                            </Text>

                                            <Group
                                                grow
                                                align="flex-start"
                                            >
                                                {biologicalMother && (
                                                    <FamilyMember
                                                        colonist={
                                                            biologicalMother.colonist
                                                        }
                                                        label="Mother"
                                                    />
                                                )}

                                                {biologicalFather && (
                                                    <FamilyMember
                                                        colonist={
                                                            biologicalFather.colonist
                                                        }
                                                        label="Father"
                                                    />
                                                )}
                                            </Group>
                                        </div>
                                    )}

                                {/* Other parents */}
                                {otherParents.length > 0 && (
                                    <div>
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            mb="xs"
                                        >
                                            Other parents
                                        </Text>

                                        <Stack gap="xs">
                                            {otherParents.map(
                                                (relationship) => (
                                                    <FamilyMember
                                                        key={
                                                            relationship
                                                                .colonist
                                                                .id
                                                        }
                                                        colonist={
                                                            relationship.colonist
                                                        }
                                                        label={getParentLabel(
                                                            relationship.type,
                                                            relationship
                                                                .colonist
                                                                .gender
                                                        )}
                                                    />
                                                )
                                            )}
                                        </Stack>
                                    </div>
                                )}

                            </Stack>
                        )}
                    </Stack>
                </Card>

                {/* Siblings */}
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
                            <Title order={3}>
                                Siblings
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Other children of this colonist's parents.
                            </Text>
                        </div>

                        {siblings.length === 0 ? (
                            <Text c="dimmed">
                                No siblings recorded.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {siblings.map((sibling) => (
                                    <FamilyMember
                                        key={sibling.id}
                                        colonist={sibling}
                                        label={getSiblingLabel(
                                            sibling.gender
                                        )}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Card>

                {/* Grandparents */}
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
                            <Title order={3}>
                                Grandparents
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Parents of this colonist's parents.
                            </Text>
                        </div>

                        <Group
                            grow
                            align="flex-start"
                        >
                            {/* Maternal */}
                            <div>
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    mb="xs"
                                >
                                    Maternal
                                </Text>

                                {maternalGrandparents.length === 0 ? (
                                    <Text
                                        c="dimmed"
                                        size="sm"
                                    >
                                        No maternal grandparents recorded.
                                    </Text>
                                ) : (
                                    <Stack gap="xs">
                                        {maternalGrandparents.map(
                                            (grandparent) => (
                                                <FamilyMember
                                                    key={grandparent.id}
                                                    colonist={grandparent}
                                                    label={getGrandparentLabel(
                                                        grandparent.gender
                                                    )}
                                                />
                                            )
                                        )}
                                    </Stack>
                                )}
                            </div>

                            {/* Paternal */}
                            <div>
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    mb="xs"
                                >
                                    Paternal
                                </Text>

                                {paternalGrandparents.length === 0 ? (
                                    <Text
                                        c="dimmed"
                                        size="sm"
                                    >
                                        No paternal grandparents recorded.
                                    </Text>
                                ) : (
                                    <Stack gap="xs">
                                        {paternalGrandparents.map(
                                            (grandparent) => (
                                                <FamilyMember
                                                    key={grandparent.id}
                                                    colonist={grandparent}
                                                    label={getGrandparentLabel(
                                                        grandparent.gender
                                                    )}
                                                />
                                            )
                                        )}
                                    </Stack>
                                )}
                            </div>
                        </Group>
                    </Stack>
                </Card>

                {/* Aunts & Uncles */}
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
                            <Title order={3}>
                                Aunts & Uncles
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Siblings of this colonist's parents.
                            </Text>
                        </div>

                        <Group
                            grow
                            align="flex-start"
                        >
                            {/* Maternal */}
                            <div>
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    mb="xs"
                                >
                                    Maternal
                                </Text>

                                {maternalAuntsAndUnclesList.length === 0 ? (
                                    <Text
                                        c="dimmed"
                                        size="sm"
                                    >
                                        No maternal aunts or uncles recorded.
                                    </Text>
                                ) : (
                                    <Stack gap="xs">
                                        {maternalAuntsAndUnclesList.map(
                                            (relative) => (
                                                <FamilyMember
                                                    key={relative.id}
                                                    colonist={relative}
                                                    label={getAuntUncleLabel(
                                                        relative.gender
                                                    )}
                                                />
                                            )
                                        )}
                                    </Stack>
                                )}
                            </div>

                            {/* Paternal */}
                            <div>
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    mb="xs"
                                >
                                    Paternal
                                </Text>

                                {paternalAuntsAndUnclesList.length === 0 ? (
                                    <Text
                                        c="dimmed"
                                        size="sm"
                                    >
                                        No paternal aunts or uncles recorded.
                                    </Text>
                                ) : (
                                    <Stack gap="xs">
                                        {paternalAuntsAndUnclesList.map(
                                            (relative) => (
                                                <FamilyMember
                                                    key={relative.id}
                                                    colonist={relative}
                                                    label={getAuntUncleLabel(
                                                        relative.gender
                                                    )}
                                                />
                                            )
                                        )}
                                    </Stack>
                                )}
                            </div>
                        </Group>
                    </Stack>
                </Card>

                {/* Cousins */}
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
                            <Title order={3}>
                                Cousins
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Extended cousins recorded for this colonist.
                            </Text>
                        </div>

                        {/* First cousins */}
                        <div>
                            <Text
                                fw={500}
                                mb="xs"
                            >
                                First cousins
                            </Text>

                            <Group
                                grow
                                align="flex-start"
                            >
                                {/* Maternal */}
                                <div>
                                    <Text
                                        size="sm"
                                        c="dimmed"
                                        mb="xs"
                                    >
                                        Maternal
                                    </Text>

                                    {maternalCousinsList.length === 0 ? (
                                        <Text
                                            c="dimmed"
                                            size="sm"
                                        >
                                            No maternal cousins recorded.
                                        </Text>
                                    ) : (
                                        <Stack gap="xs">
                                            {maternalCousinsList.map(
                                                (cousin) => (
                                                    <FamilyMember
                                                        key={cousin.id}
                                                        colonist={cousin}
                                                        label={getCousinLabel()}
                                                    />
                                                )
                                            )}
                                        </Stack>
                                    )}
                                </div>

                                {/* Paternal */}
                                <div>
                                    <Text
                                        size="sm"
                                        c="dimmed"
                                        mb="xs"
                                    >
                                        Paternal
                                    </Text>

                                    {paternalCousinsList.length === 0 ? (
                                        <Text
                                            c="dimmed"
                                            size="sm"
                                        >
                                            No paternal cousins recorded.
                                        </Text>
                                    ) : (
                                        <Stack gap="xs">
                                            {paternalCousinsList.map(
                                                (cousin) => (
                                                    <FamilyMember
                                                        key={cousin.id}
                                                        colonist={cousin}
                                                        label={getCousinLabel()}
                                                    />
                                                )
                                            )}
                                        </Stack>
                                    )}
                                </div>
                            </Group>
                        </div>

                        {/* First cousins once removed */}
                        {(maternalCousinsOnceRemovedList.length > 0 ||
                            paternalCousinsOnceRemovedList.length > 0) && (
                                <div>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                    >
                                        First cousins once removed
                                    </Text>

                                    <Group
                                        grow
                                        align="flex-start"
                                    >
                                        {/* Maternal */}
                                        <div>
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                mb="xs"
                                            >
                                                Maternal
                                            </Text>

                                            {maternalCousinsOnceRemovedList.length === 0 ? (
                                                <Text
                                                    c="dimmed"
                                                    size="sm"
                                                >
                                                    No maternal first cousins once removed recorded.
                                                </Text>
                                            ) : (
                                                <Stack gap="xs">
                                                    {maternalCousinsOnceRemovedList.map(
                                                        (relative) => (
                                                            <FamilyMember
                                                                key={relative.id}
                                                                colonist={relative}
                                                                label="First cousin once removed"
                                                            />
                                                        )
                                                    )}
                                                </Stack>
                                            )}
                                        </div>

                                        {/* Paternal */}
                                        <div>
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                mb="xs"
                                            >
                                                Paternal
                                            </Text>

                                            {paternalCousinsOnceRemovedList.length === 0 ? (
                                                <Text
                                                    c="dimmed"
                                                    size="sm"
                                                >
                                                    No paternal first cousins once removed recorded.
                                                </Text>
                                            ) : (
                                                <Stack gap="xs">
                                                    {paternalCousinsOnceRemovedList.map(
                                                        (relative) => (
                                                            <FamilyMember
                                                                key={relative.id}
                                                                colonist={relative}
                                                                label="First cousin once removed"
                                                            />
                                                        )
                                                    )}
                                                </Stack>
                                            )}
                                        </div>
                                    </Group>
                                </div>
                            )}

                        {/* Second cousins */}
                        {(maternalSecondCousinsList.length > 0 ||
                            paternalSecondCousinsList.length > 0) && (
                                <div>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                    >
                                        Second cousins
                                    </Text>

                                    <Group
                                        grow
                                        align="flex-start"
                                    >
                                        {/* Maternal */}
                                        <div>
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                mb="xs"
                                            >
                                                Maternal
                                            </Text>

                                            {maternalSecondCousinsList.length === 0 ? (
                                                <Text
                                                    c="dimmed"
                                                    size="sm"
                                                >
                                                    No maternal second cousins recorded.
                                                </Text>
                                            ) : (
                                                <Stack gap="xs">
                                                    {maternalSecondCousinsList.map(
                                                        (relative) => (
                                                            <FamilyMember
                                                                key={relative.id}
                                                                colonist={relative}
                                                                label="Second cousin"
                                                            />
                                                        )
                                                    )}
                                                </Stack>
                                            )}
                                        </div>

                                        {/* Paternal */}
                                        <div>
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                mb="xs"
                                            >
                                                Paternal
                                            </Text>

                                            {paternalSecondCousinsList.length === 0 ? (
                                                <Text
                                                    c="dimmed"
                                                    size="sm"
                                                >
                                                    No paternal second cousins recorded.
                                                </Text>
                                            ) : (
                                                <Stack gap="xs">
                                                    {paternalSecondCousinsList.map(
                                                        (relative) => (
                                                            <FamilyMember
                                                                key={relative.id}
                                                                colonist={relative}
                                                                label="Second cousin"
                                                            />
                                                        )
                                                    )}
                                                </Stack>
                                            )}
                                        </div>
                                    </Group>
                                </div>
                            )}
                    </Stack>
                </Card>

                {/* Partners */}
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
                            <Title order={3}>
                                Partners
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Romantic relationships recorded for this colonist.
                            </Text>
                        </div>

                        {partners.length === 0 ? (
                            <Text c="dimmed">
                                No partners recorded.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {partners.map((relationship) => (
                                    <FamilyMember
                                        key={
                                            relationship
                                                .colonist
                                                .id
                                        }
                                        colonist={
                                            relationship.colonist
                                        }
                                        label={getPartnerLabel(
                                            relationship.type,
                                            relationship
                                                .colonist
                                                .gender
                                        )}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Card>

                {/* Children */}
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
                            <Title order={3}>
                                Children
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Children recorded for this colonist.
                            </Text>
                        </div>

                        {children.length === 0 ? (
                            <Text c="dimmed">
                                No children recorded.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {children.map((relationship) => (
                                    <FamilyMember
                                        key={
                                            relationship
                                                .colonist
                                                .id
                                        }
                                        colonist={
                                            relationship.colonist
                                        }
                                        label={getChildLabel(
                                            relationship
                                                .colonist
                                                .gender
                                        )}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Card>

            </Stack>
        </main>
    );
}