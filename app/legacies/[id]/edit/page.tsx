import { prisma } from "@/lib/prisma";
import {
    ActionIcon,
    Card,
    ColorInput,
    Group,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
    Tooltip,
} from "@mantine/core";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditLegacyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const legacyId = Number(id);

    const legacy = await prisma.legacy.findUnique({
        where: {
            id: legacyId,
        },
    });

    if (!legacy) {
        return <h1>Legacy not found</h1>;
    }

    const colonists = await prisma.colonist.findMany({
        orderBy: [
            {
                firstName: "asc",
            },
            {
                lastName: "asc",
            },
        ],
    });

    const colonistOptions = colonists.map((colonist) => ({
        value: colonist.id.toString(),
        label: `${colonist.firstName}${
            colonist.nickname
                ? ` "${colonist.nickname}"`
                : ""
        } ${colonist.lastName}`,
    }));

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 500,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
            }}
        >
            <Stack gap="xl">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={1}>Edit Legacy</Title>

                        <Text c="dimmed" mt={4}>
                            Update {legacy.name}'s information.
                        </Text>
                    </div>

                    <Tooltip label="Back to legacy">
                        <ActionIcon
                            component="a"
                            href={`/legacies/${legacy.id}`}
                            size="lg"
                            variant="subtle"
                            color="mesa"
                            aria-label="Back to legacy"
                        >
                            <ArrowLeft size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                <form
                    action={`/api/legacies/${legacy.id}/edit`}
                    method="POST"
                >
                    <Stack gap="lg">
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
                                        Legacy Information
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        Basic information about this legacy.
                                    </Text>
                                </div>

                                <TextInput
                                    name="name"
                                    label="Name"
                                    placeholder="Legacy name"
                                    defaultValue={legacy.name}
                                    required
                                />

                                <Textarea
                                    name="description"
                                    label="Description"
                                    placeholder="Describe this legacy..."
                                    minRows={4}
                                    defaultValue={
                                        legacy.description ?? ""
                                    }
                                />

                                <ColorInput
                                    name="color"
                                    label="Color"
                                    placeholder="Choose a color"
                                    defaultValue={
                                        legacy.color ?? ""
                                    }
                                />

                                <Select
                                    name="foundingColonistId"
                                    label="Founding colonist"
                                    placeholder="Select a colonist"
                                    data={colonistOptions}
                                    defaultValue={
                                        legacy.foundingColonistId?.toString() ??
                                        null
                                    }
                                    searchable
                                    clearable
                                />
                            </Stack>
                        </Card>

                        <Group justify="flex-end">
                            <Tooltip label="Save changes">
                                <ActionIcon
                                    type="submit"
                                    size="lg"
                                    variant="filled"
                                    color="mesa"
                                    aria-label="Save changes"
                                >
                                    <Save size={20} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </main>
    );
}