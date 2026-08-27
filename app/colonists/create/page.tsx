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
import Relationships from "./Relationships";
import LegacySelector from "./LegacySelector";
import PortraitUpload from "./PortraitUpload";
import TraitsEditor from "../[id]/traits/TraitsEditor";
import SkillsEditor, {
    CreateSkill,
} from "../[id]/skills/SkillsEditor";
import ExpertiseEditor, {
    CreateExpertise,
} from "../[id]/skills/ExpertiseEditor";

export default async function NewColonist() {
    const [
        legacies,
        colonists,
        skills,
        availableExpertises,
        traits,
    ] = await Promise.all([
        prisma.legacy.findMany({
            orderBy: {
                name: "asc",
            },
        }),

        prisma.colonist.findMany({
            orderBy: [
                {
                    lastName: "asc",
                },
                {
                    firstName: "asc",
                },
            ],
        }),

        prisma.skill.findMany({
            orderBy: {
                id: "asc",
            },
        }),

        prisma.expertise.findMany({
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
        }),

        prisma.trait.findMany({
            orderBy: {
                name: "asc",
            },
        }),
    ]);

    const legacyOptions = legacies.map((legacy) => ({
        value: legacy.id.toString(),
        label: legacy.name,
        color: legacy.color,
    }));

    const colonistOptions = colonists.map((colonist) => ({
        value: colonist.id.toString(),
        label: `${colonist.firstName}${colonist.nickname
            ? ` "${colonist.nickname}"`
            : ""
            } ${colonist.lastName}`,
    }));

    const initialSkills: CreateSkill[] =
        skills.map((skill) => ({
            skillId: skill.id,
            level: 0,
            passion: "None",
            isKnown: true,
            skill: {
                id: skill.id,
                name: skill.name,
            },
        }));

    const initialExpertises: CreateExpertise[] = [];

    const relationshipTypes = [
        {
            value: "Biological",
            label: "Biological",
        },
        {
            value: "OvumDonor",
            label: "Ovum donor",
        },
        {
            value: "Other",
            label: "Other",
        },
    ];

    const days = Array.from({ length: 15 }, (_, i) => ({
        value: (i + 1).toString(),
        label: (i + 1).toString(),
    }));

    const months = [
        { value: "1", label: "Aprimay" },
        { value: "2", label: "Jugust" },
        { value: "3", label: "Septober" },
        { value: "4", label: "Decembary" },
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
                <div>
                    <Title order={1}>
                        Create Colonist
                    </Title>

                    <Text c="dimmed" mt={4}>
                        Add a new colonist to the database.
                    </Text>
                </div>

                <form
                    action="/api/colonists"
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
                                        The colonist's name and basic information.
                                    </Text>
                                </div>

                                <Group
                                    align="flex-start"
                                    wrap="nowrap"
                                >
                                    <PortraitUpload />

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
                                                required
                                            />

                                            <TextInput
                                                name="nickname"
                                                label="Nickname"
                                                placeholder="Nickname"
                                            />

                                            <TextInput
                                                name="lastName"
                                                label="Last name"
                                                placeholder="Last name"
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
                                        clearable
                                    />

                                    <Select
                                        name="birthMonth"
                                        label="Month"
                                        placeholder="Month"
                                        data={months}
                                        clearable
                                    />

                                    <TextInput
                                        name="birthYear"
                                        label="Year"
                                        placeholder="Year"
                                        type="number"
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
                                />

                                <Group grow>
                                    <Select
                                        name="deathDay"
                                        label="Day"
                                        placeholder="Day"
                                        data={days}
                                        clearable
                                    />

                                    <Select
                                        name="deathMonth"
                                        label="Month"
                                        placeholder="Month"
                                        data={months}
                                        clearable
                                    />

                                    <TextInput
                                        name="deathYear"
                                        label="Year"
                                        placeholder="Year"
                                        type="number"
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
                                        Associate this colonist with an existing
                                        family line.
                                    </Text>
                                </div>

                                <LegacySelector
                                    legacyOptions={legacyOptions}
                                />
                            </Stack>
                        </Card>

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
                                        Connect this colonist to existing family members.
                                    </Text>
                                </div>

                                <Relationships
                                    colonistOptions={colonistOptions}
                                />
                            </Stack>
                        </Card>


                        {/* Traits */}
                        <TraitsEditor
                            mode="create"
                            traits={traits}
                        />

                        {/* Skills */}
                        <SkillsEditor
                            mode="create"
                            skills={initialSkills}
                        />

                        {/* Expertises */}
                        <ExpertiseEditor
                            mode="create"
                            expertises={initialExpertises}
                            availableExpertises={
                                availableExpertises
                            }
                        />

                        {/* Actions */}
                        <Group justify="flex-end">
                            <Button
                                type="submit"
                                color="mesa"
                                size="md"
                            >
                                Create Colonist
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </main>
    );
}