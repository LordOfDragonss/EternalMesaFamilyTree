import { prisma } from "@/lib/prisma";
import {
    Card,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import ColonistNavigation from "./ColonistNavigation";
import ColonistHeader from "@/app/components/ColonistHeader";
import PassionIndicator from "./skills/PassionIndicator";
import TraitsCard from "./traits/TraitsCard";
import FamilyMember from "@/app/components/FamilyMember";
import {
    getPartnerLabel,
} from "@/app/lib/relationshipHelpers";

export default async function ColonistPage({
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

            foundedLegacy: true,

            notableInLegacies: {
                include: {
                    legacy: true,
                },
            },

            groups: {
                include: {
                    group: true,
                },
                orderBy: {
                    group: {
                        name: "asc",
                    },
                },
            },

            parents: {
                include: {
                    parent: true,
                },
            },

            colonistSkills: {
                where: {
                    isKnown: true,
                },
                include: {
                    skill: true,
                },
            },

            colonistTraits: {
                include: {
                    trait: true,
                },
                orderBy: {
                    trait: {
                        name: "asc",
                    },
                },
            },

            children: {
                select: {
                    id: true,
                    childId: true,
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

    const months = [
        "Aprimay",
        "Jugust",
        "Septober",
        "Decembary",
    ];

    const formatDate = (
        year: number | null,
        month: number | null,
        day: number | null
    ) => {
        if (!year && !month && !day) {
            return "Unknown";
        }

        const parts: string[] = [];

        if (day) {
            parts.push(day.toString());
        }

        if (month) {
            parts.push(months[month - 1] ?? "Unknown month");
        }

        if (year) {
            parts.push(year.toString());
        }

        return parts.join(" ");
    };
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

    const partnerCount =
        colonist.partnerARelationships.length +
        colonist.partnerBRelationships.length;

    const passionBonus: Record<string, number> = {
        Apathy: -2,
        None: 0,
        Interested: 1,
        Burning: 3,
        Natural: 2,
        Critical: 4,
    };

    const notableSkills = [...colonist.colonistSkills]
        .sort((a, b) => {
            const aScore =
                a.level +
                (passionBonus[a.passion] ?? 0);

            const bScore =
                b.level +
                (passionBonus[b.passion] ?? 0);

            return bScore - aScore;
        })
        .slice(0, 3);
    const traits = await prisma.trait.findMany({
        orderBy: {
            name: "asc",
        },
    });

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
                {/* Header */}
                <ColonistHeader colonist={colonist} />

                {/* Navigation */}
                <ColonistNavigation colonistId={colonist.id} />

                {/* Information */}
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
                                Information
                            </Title>

                            <Text c="dimmed" size="sm" mt={2}>
                                Basic information about this colonist.
                            </Text>
                        </div>

                        <Group grow align="flex-start">
                            <div>
                                <Text size="sm" c="dimmed">
                                    Gender
                                </Text>

                                <Text>
                                    {colonist.gender}
                                </Text>
                            </div>

                            <div>
                                <Text size="sm" c="dimmed">
                                    Born
                                </Text>

                                <Text>
                                    {formatDate(
                                        colonist.birthYear,
                                        colonist.birthMonth,
                                        colonist.birthDay
                                    )}
                                </Text>
                            </div>

                            <div>
                                <Text size="sm" c="dimmed">
                                    Died
                                </Text>

                                <Text>
                                    {colonist.isDead
                                        ? formatDate(
                                            colonist.deathYear,
                                            colonist.deathMonth,
                                            colonist.deathDay
                                        )
                                        : "Still alive"}
                                </Text>
                            </div>
                        </Group>
                    </Stack>
                </Card>

                {/* Legacy */}
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
                                Legacy
                            </Title>

                            <Text c="dimmed" size="sm" mt={2}>
                                This colonist's family legacy.
                            </Text>
                        </div>

                        {colonist.legacy ? (
                            <Text
                                component="a"
                                href={`/legacies/${colonist.legacy.id}`}
                                fw={500}
                                style={{
                                    color:
                                        colonist.legacy.color ??
                                        undefined,
                                }}
                            >
                                {colonist.legacy.name}
                            </Text>
                        ) : (
                            <Text c="dimmed">
                                This colonist does not belong to a legacy.
                            </Text>
                        )}

                        {colonist.foundedLegacy && (
                            <div>
                                <Text size="sm" c="dimmed">
                                    Founded legacy
                                </Text>

                                <Text
                                    component="a"
                                    href={`/legacies/${colonist.foundedLegacy.id}`}
                                    fw={500}
                                    style={{
                                        color:
                                            colonist.foundedLegacy
                                                .color ??
                                            undefined,
                                    }}
                                >
                                    {colonist.foundedLegacy.name}
                                </Text>
                            </div>
                        )}

                        {colonist.notableInLegacies.length > 0 && (
                            <div>
                                <Text size="sm" c="dimmed">
                                    Notable in
                                </Text>

                                <Stack gap={2} mt={2}>
                                    {colonist.notableInLegacies.map(
                                        (relationship) => (
                                            <Text
                                                key={relationship.legacyId}
                                                component="a"
                                                href={`/legacies/${relationship.legacy.id}`}
                                                style={{
                                                    color:
                                                        relationship
                                                            .legacy
                                                            .color ??
                                                        undefined,
                                                }}
                                            >
                                                {
                                                    relationship
                                                        .legacy
                                                        .name
                                                }
                                            </Text>
                                        )
                                    )}
                                </Stack>
                            </div>
                        )}
                    </Stack>
                </Card>

                {/* Groups */}
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
                                Groups
                            </Title>

                            <Text c="dimmed" size="sm" mt={2}>
                                Groups this colonist belongs to.
                            </Text>
                        </div>

                        {colonist.groups.length === 0 ? (
                            <Text c="dimmed">
                                This colonist does not belong to any groups.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {colonist.groups.map(
                                    (membership) => (
                                        <Text
                                            key={membership.groupId}
                                            component="a"
                                            href={`/groups/${membership.group.id}`}
                                            c="mesa"
                                            fw={500}
                                            style={{
                                                textDecoration: "none",
                                            }}
                                        >
                                            {membership.group.name}
                                        </Text>
                                    )
                                )}
                            </Stack>
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

                            <Text c="dimmed" size="sm" mt={2}>
                                Parents recorded for this colonist.
                            </Text>
                        </div>

                        {colonist.parents.length === 0 ? (
                            <Text c="dimmed">
                                No parents recorded.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {colonist.parents.map(
                                    (relationship) => (
                                        <Group
                                            key={relationship.id}
                                            justify="space-between"
                                        >
                                            <Text
                                                component="a"
                                                href={`/colonists/${relationship.parent.id}`}
                                                c="mesa"
                                                fw={500}
                                            >
                                                {
                                                    relationship
                                                        .parent
                                                        .firstName
                                                }{" "}
                                                {relationship.parent.nickname &&
                                                    `"${relationship.parent.nickname}"`}{" "}
                                                {
                                                    relationship
                                                        .parent
                                                        .lastName
                                                }
                                            </Text>

                                            <Text
                                                size="sm"
                                                c="dimmed"
                                            >
                                                {relationship.type}
                                            </Text>
                                        </Group>
                                    )
                                )}
                            </Stack>
                        )}
                    </Stack>
                </Card>

                {/* Family Summary */}
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
                                Family
                            </Title>

                            <Text c="dimmed" size="sm" mt={2}>
                                A summary of this colonist's family.
                            </Text>
                        </div>

                        <Group grow>
                            <div>
                                <Text size="sm" c="dimmed">
                                    Children
                                </Text>

                                <Text>
                                    {colonist.children.length}
                                </Text>
                            </div>

                            <div>
                                <Text size="sm" c="dimmed">
                                    Partners
                                </Text>

                                <Text>
                                    {partnerCount}
                                </Text>
                            </div>
                        </Group>

                        <Text
                            component="a"
                            href={`/colonists/${colonist.id}/family`}
                            c="mesa"
                            fw={500}
                        >
                            View family
                        </Text>
                    </Stack>
                </Card>

                {/* Traits */}
                <TraitsCard
                    colonistId={colonist.id}
                    initialTraits={colonist.colonistTraits}
                    traits={traits}
                />

                {/* Skills */}
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
                                Skills
                            </Title>

                            <Text c="dimmed" size="sm" mt={2}>
                                This colonist's strongest known skills.
                            </Text>
                        </div>

                        {notableSkills.length === 0 ? (
                            <Text c="dimmed">
                                No known skills recorded.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {notableSkills.map(
                                    (colonistSkill) => (
                                        <Group
                                            key={colonistSkill.skillId}
                                            justify="space-between"
                                        >
                                            <Text fw={500}>
                                                {
                                                    colonistSkill
                                                        .skill
                                                        .name
                                                }
                                            </Text>

                                            <Group gap="sm">
                                                <Text fw={500}>
                                                    {
                                                        colonistSkill.level
                                                    }
                                                </Text>

                                                <PassionIndicator
                                                    passion={
                                                        colonistSkill.passion
                                                    }
                                                />
                                            </Group>
                                        </Group>
                                    )
                                )}
                            </Stack>
                        )}

                        <Text
                            component="a"
                            href={`/colonists/${colonist.id}/skills`}
                            c="mesa"
                            fw={500}
                        >
                            View all skills
                        </Text>
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}