import { prisma } from "@/lib/prisma";
import {
    Button,
    Card,
    Checkbox,
    Group,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import EditRelationships from "./EditRelationships";
import LegacySelector from "@/app/colonists/create/LegacySelector";
import PortraitUpload from "@/app/colonists/create/PortraitUpload";
import SkillsEditor from "../skills/SkillsEditor";
import ExpertiseEditor from "../skills/ExpertiseEditor";

export default async function EditColonist({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const colonistId = Number(id);

    const colonist =
        await prisma.colonist.findUnique({
            where: {
                id: colonistId,
            },
            include: {
                legacy: true,

                parents: {
                    include: {
                        parent: true,
                    },
                },

                children: {
                    include: {
                        child: true,
                    },
                },

                partnerARelationships: {
                    include: {
                        partnerB: true,
                    },
                },

                partnerBRelationships: {
                    include: {
                        partnerA: true,
                    },
                },

                colonistSkills: {
                    include: {
                        skill: true,

                        expertises: {
                            include: {
                                expertise: {
                                    include: {
                                        skill: true,
                                        effects: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        skillId: "asc",
                    },
                },
            },
        });

    if (!colonist) {
        return <h1>Colonist not found</h1>;
    }

    /*
     * Existing relationship IDs
     */
    const existingParentIds =
        colonist.parents.map(
            (relationship) =>
                relationship.parentId
        );

    const existingChildIds =
        colonist.children.map(
            (relationship) =>
                relationship.childId
        );

    const existingPartnerIds = [
        ...colonist.partnerARelationships.map(
            (relationship) =>
                relationship.partnerBId
        ),

        ...colonist.partnerBRelationships.map(
            (relationship) =>
                relationship.partnerAId
        ),
    ];

    /*
     * Find siblings so they cannot be selected as partners.
     */
    const siblingRelationships =
        await prisma.parentChild.findMany({
            where: {
                parentId: {
                    in: existingParentIds,
                },

                childId: {
                    not: colonistId,
                },
            },

            select: {
                childId: true,
            },
        });

    const siblingIds =
        siblingRelationships.map(
            (relationship) =>
                relationship.childId
        );

    /*
     * Get available colonists for new relationships.
     */
    const potentialParents =
        await prisma.colonist.findMany({
            where: {
                id: {
                    notIn: [
                        colonistId,
                        ...existingParentIds,
                        ...existingChildIds,
                    ],
                },
            },

            orderBy: [
                {
                    firstName: "asc",
                },
                {
                    lastName: "asc",
                },
            ],
        });

    const potentialChildren =
        await prisma.colonist.findMany({
            where: {
                id: {
                    notIn: [
                        colonistId,
                        ...existingParentIds,
                        ...existingChildIds,
                    ],
                },
            },

            orderBy: [
                {
                    firstName: "asc",
                },
                {
                    lastName: "asc",
                },
            ],
        });

    const potentialPartners =
        await prisma.colonist.findMany({
            where: {
                id: {
                    notIn: [
                        colonistId,
                        ...existingPartnerIds,
                        ...existingParentIds,
                        ...existingChildIds,
                        ...siblingIds,
                    ],
                },
            },

            orderBy: [
                {
                    firstName: "asc",
                },
                {
                    lastName: "asc",
                },
            ],
        });

    /*
     * Legacy options
     */
    const legacies =
        await prisma.legacy.findMany({
            orderBy: {
                name: "asc",
            },
        });

    const legacyOptions =
        legacies.map((legacy) => ({
            value: legacy.id.toString(),
            label: legacy.name,
            color: legacy.color,
        }));

    /*
     * Available expertises.
     */
    const availableExpertises =
        await prisma.expertise.findMany({
            include: {
                skill: true,
                effects: true,
            },

            orderBy: [
                {
                    skillId: "asc",
                },
                {
                    id: "asc",
                },
            ],
        });

    /*
     * Existing expertises.
     *
     * Flatten them because expertises belong to
     * ColonistSkill rather than directly to Colonist.
     */
    const existingExpertises =
        colonist.colonistSkills.flatMap(
            (colonistSkill) =>
                colonistSkill.expertises
        );

    /*
     * Existing relationship data for EditRelationships.
     */
    const existingParents =
        colonist.parents.map(
            (relationship) => ({
                id:
                    relationship.id.toString(),

                colonistId:
                    relationship.parentId.toString(),

                name:
                    `${relationship.parent.firstName}${relationship.parent.nickname
                        ? ` "${relationship.parent.nickname}"`
                        : ""
                    } ${relationship.parent.lastName}`,

                type:
                    relationship.type,

                relationshipId:
                    relationship.id,
            })
        );

    const existingChildren =
        colonist.children.map(
            (relationship) => ({
                id:
                    relationship.id.toString(),

                colonistId:
                    relationship.childId.toString(),

                name:
                    `${relationship.child.firstName}${relationship.child.nickname
                        ? ` "${relationship.child.nickname}"`
                        : ""
                    } ${relationship.child.lastName}`,

                type:
                    relationship.type,

                relationshipId:
                    relationship.id,
            })
        );

    const existingPartners = [
        ...colonist.partnerARelationships.map(
            (relationship) => ({
                id:
                    relationship.id.toString(),

                colonistId:
                    relationship.partnerBId.toString(),

                name:
                    `${relationship.partnerB.firstName}${relationship.partnerB.nickname
                        ? ` "${relationship.partnerB.nickname}"`
                        : ""
                    } ${relationship.partnerB.lastName}`,

                type:
                    relationship.type,

                relationshipId:
                    relationship.id,
            })
        ),

        ...colonist.partnerBRelationships.map(
            (relationship) => ({
                id:
                    relationship.id.toString(),

                colonistId:
                    relationship.partnerAId.toString(),

                name:
                    `${relationship.partnerA.firstName}${relationship.partnerA.nickname
                        ? ` "${relationship.partnerA.nickname}"`
                        : ""
                    } ${relationship.partnerA.lastName}`,

                type:
                    relationship.type,

                relationshipId:
                    relationship.id,
            })
        ),
    ];

    /*
     * Options for each relationship type.
     */
    const parentOptions =
        potentialParents.map(
            (colonist) => ({
                value:
                    colonist.id.toString(),

                label:
                    `${colonist.firstName}${colonist.nickname
                        ? ` "${colonist.nickname}"`
                        : ""
                    } ${colonist.lastName}`,
            })
        );

    const childOptions =
        potentialChildren.map(
            (colonist) => ({
                value:
                    colonist.id.toString(),

                label:
                    `${colonist.firstName}${colonist.nickname
                        ? ` "${colonist.nickname}"`
                        : ""
                    } ${colonist.lastName}`,
            })
        );

    const partnerOptions =
        potentialPartners.map(
            (colonist) => ({
                value:
                    colonist.id.toString(),

                label:
                    `${colonist.firstName}${colonist.nickname
                        ? ` "${colonist.nickname}"`
                        : ""
                    } ${colonist.lastName}`,
            })
        );

    const days = Array.from(
        { length: 15 },
        (_, i) => ({
            value: (i + 1).toString(),
            label: (i + 1).toString(),
        })
    );

    const months = [
        {
            value: "1",
            label: "Aprimay",
        },
        {
            value: "2",
            label: "Jugust",
        },
        {
            value: "3",
            label: "Septober",
        },
        {
            value: "4",
            label: "Decembary",
        },
    ];

    return (
        <main
            style={{
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
            }}
        >
            <Stack gap="xl">

                {/* Header */}
                <div>
                    <Group
                        justify="space-between"
                        align="flex-start"
                    >
                        <div>
                            <Title order={1}>
                                Edit Colonist
                            </Title>

                            <Text
                                c="dimmed"
                                mt={4}
                            >
                                Update{" "}
                                {colonist.firstName}
                                's information.
                            </Text>
                        </div>

                        <Button
                            component="a"
                            href={`/colonists/${colonist.id}`}
                            variant="subtle"
                            color="mesa"
                        >
                            Back to Colonist
                        </Button>
                    </Group>
                </div>

                {/* Colonist information form */}
                <form
                    action={`/api/colonists/${colonist.id}/edit`}
                    method="POST"
                    encType="multipart/form-data"
                >
                    <Stack gap="lg">

                        {/* Identity */}
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
                                        Identity
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        The colonist's name and basic
                                        information.
                                    </Text>
                                </div>

                                <Group
                                    align="flex-start"
                                    wrap="nowrap"
                                >
                                    <PortraitUpload
                                        existingImage={
                                            colonist.imageURL
                                        }
                                    />

                                    <Stack
                                        style={{
                                            flex: 1,
                                        }}
                                        gap="md"
                                    >
                                        <Group grow>
                                            <TextInput
                                                name="firstName"
                                                label="First name"
                                                placeholder="First name"
                                                defaultValue={
                                                    colonist.firstName
                                                }
                                                required
                                            />

                                            <TextInput
                                                name="nickname"
                                                label="Nickname"
                                                placeholder="Nickname"
                                                defaultValue={
                                                    colonist.nickname ??
                                                    ""
                                                }
                                            />

                                            <TextInput
                                                name="lastName"
                                                label="Last name"
                                                placeholder="Last name"
                                                defaultValue={
                                                    colonist.lastName
                                                }
                                                required
                                            />
                                        </Group>

                                        <Group
                                            align="flex-end"
                                            wrap="nowrap"
                                        >
                                            <TextInput
                                                name="title"
                                                label="Title"
                                                placeholder="Optional title"
                                                defaultValue={
                                                    colonist.title ??
                                                    ""
                                                }
                                                style={{
                                                    flex: 1,
                                                }}
                                            />

                                            <Select
                                                name="gender"
                                                label="Gender"
                                                placeholder="Gender"
                                                data={[
                                                    {
                                                        value: "Male",
                                                        label: "Male",
                                                    },
                                                    {
                                                        value: "Female",
                                                        label: "Female",
                                                    },
                                                ]}
                                                defaultValue={
                                                    colonist.gender
                                                }
                                                required
                                                style={{
                                                    width: 140,
                                                }}
                                            />
                                        </Group>
                                    </Stack>
                                </Group>
                            </Stack>
                        </Card>

                        {/* Birth */}
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
                                        Birth
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        When the colonist was born.
                                    </Text>
                                </div>

                                <Group grow>
                                    <Select
                                        name="birthDay"
                                        label="Day"
                                        placeholder="Day"
                                        data={days}
                                        defaultValue={
                                            colonist.birthDay?.toString() ??
                                            null
                                        }
                                        clearable
                                    />

                                    <Select
                                        name="birthMonth"
                                        label="Month"
                                        placeholder="Month"
                                        data={months}
                                        defaultValue={
                                            colonist.birthMonth?.toString() ??
                                            null
                                        }
                                        clearable
                                    />

                                    <TextInput
                                        name="birthYear"
                                        label="Year"
                                        placeholder="Year"
                                        type="number"
                                        defaultValue={
                                            colonist.birthYear?.toString() ??
                                            ""
                                        }
                                    />
                                </Group>
                            </Stack>
                        </Card>

                        {/* Death */}
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
                                        Death
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        Enter a death date if known, or mark the colonist as dead if
                                        their date of death is unknown.
                                    </Text>
                                </div>

                                <Checkbox
                                    name="deathDateUnknown"
                                    label="Death date unknown"
                                    description="The colonist is deceased, but their date of death is not recorded."
                                    defaultChecked={
                                        colonist.isDead &&
                                        colonist.deathYear === null &&
                                        colonist.deathMonth === null &&
                                        colonist.deathDay === null
                                    }
                                />

                                <Group grow>
                                    <Select
                                        name="deathDay"
                                        label="Day"
                                        placeholder="Day"
                                        data={days}
                                        defaultValue={
                                            colonist.deathDay?.toString() ?? null
                                        }
                                        clearable
                                    />

                                    <Select
                                        name="deathMonth"
                                        label="Month"
                                        placeholder="Month"
                                        data={months}
                                        defaultValue={
                                            colonist.deathMonth?.toString() ?? null
                                        }
                                        clearable
                                    />

                                    <TextInput
                                        name="deathYear"
                                        label="Year"
                                        placeholder="Year"
                                        type="number"
                                        defaultValue={
                                            colonist.deathYear?.toString() ?? ""
                                        }
                                    />
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

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        Associate this colonist with a family
                                        line.
                                    </Text>
                                </div>

                                <LegacySelector
                                    legacyOptions={
                                        legacyOptions
                                    }
                                    defaultValue={
                                        colonist.legacyId?.toString() ??
                                        null
                                    }
                                />
                            </Stack>
                        </Card>

                        {/* Save */}
                        <Group justify="flex-end">
                            <Button
                                type="submit"
                                color="mesa"
                                size="md"
                            >
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                </form>

                {/* Relationships */}
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
                    <Stack gap="xl">
                        <div>
                            <Title order={3}>
                                Relationships
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Manage this colonist's family and
                                partnership relationships.
                            </Text>
                        </div>

                        <EditRelationships
                            colonistId={
                                colonistId
                            }
                            parentOptions={
                                parentOptions
                            }
                            childOptions={
                                childOptions
                            }
                            partnerOptions={
                                partnerOptions
                            }
                            existingParents={
                                existingParents
                            }
                            existingChildren={
                                existingChildren
                            }
                            existingPartners={
                                existingPartners
                            }
                        />
                    </Stack>
                </Card>

                {/* Skills */}
                <SkillsEditor
                    mode="edit"
                    colonistId={
                        colonistId
                    }
                    skills={
                        colonist.colonistSkills
                    }
                />

                {/* Expertises */}
                <ExpertiseEditor
                    mode="edit"
                    colonistId={
                        colonistId
                    }
                    expertises={
                        existingExpertises
                    }
                    availableExpertises={
                        availableExpertises
                    }
                />
            </Stack>
        </main>
    );
}