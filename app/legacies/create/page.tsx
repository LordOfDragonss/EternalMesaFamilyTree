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
import { ArrowLeft, Plus } from "lucide-react";

export default async function NewLegacyPage() {
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
        label: `${colonist.firstName}${colonist.nickname
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
                        <Title order={1}>Create Legacy</Title>

                        <Text c="dimmed" mt={4}>
                            Create a new family line.
                        </Text>
                    </div>

                    <Tooltip label="Back to legacies">
                        <ActionIcon
                            component="a"
                            href="/legacies"
                            size="lg"
                            variant="subtle"
                            color="mesa"
                            aria-label="Back to legacies"
                        >
                            <ArrowLeft size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                <form
                    action="/api/legacies/create"
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
                                width: "100%",
                            }}
                        >
                            <Stack gap="md" style={{ width: "100%" }}>
                                <div>
                                    <Title order={3}>
                                        Legacy Information
                                    </Title>

                                    <Text c="dimmed" size="sm" mt={2}>
                                        Basic information about this legacy.
                                    </Text>
                                </div>

                                <TextInput
                                    name="name"
                                    label="Name"
                                    placeholder="Legacy name"
                                    required
                                />

                                <Textarea
                                    name="description"
                                    label="Description"
                                    placeholder="Describe this legacy..."
                                    minRows={4}
                                />

                                <ColorInput
                                    name="color"
                                    label="Color"
                                    placeholder="Choose a color"
                                />

                                <Select
                                    name="foundingColonistId"
                                    label="Founding colonist"
                                    placeholder="Select a colonist"
                                    data={colonistOptions}
                                    searchable
                                    clearable
                                />
                            </Stack>
                        </Card>

                        <Group justify="flex-end">
                            <Tooltip label="Create legacy">
                                <ActionIcon
                                    type="submit"
                                    size="xl"
                                    variant="filled"
                                    color="mesa"
                                    aria-label="Create legacy"
                                >
                                    <Plus size={24} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </main>
    );
}