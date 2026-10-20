
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
import ColonistIdentityFields from "./ColonistIdentityFields";
import { ColonistIdentityProvider } from "@/app/lib/ColonistIdentityContext";
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
            include: {
                legacy: {
                    select: {
                        color: true,
                    },
                },
            },
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
        color: colonist.legacy?.color ?? null,
    }));

    const initialSkills: CreateSkill[] = skills.map((skill) => ({
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
                    <ColonistIdentityProvider>
                        <Stack gap="lg">
                            {/* Identity */}
                            <ColonistIdentityFields />

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
                                availableExpertises={availableExpertises}
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
                    </ColonistIdentityProvider>
                </form>
            </Stack>
        </main>
    );
}
