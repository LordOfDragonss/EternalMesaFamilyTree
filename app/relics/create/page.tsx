import { prisma } from "@/lib/prisma";
import {
    Button,
    Card,
    Group,
    MultiSelect,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from "@mantine/core";

import RelicPrimaryImageUpload from "./RelicPrimaryImageUpload";
import LegacyColorColonistSelect from "@/app/components/LegacyColorColonistSelect";

const relicCategories = [
    {
        value: "IDEOLOGY",
        label: "Ideology",
    },
    {
        value: "WEAPON",
        label: "Weapon",
    },
    {
        value: "PERSONAL",
        label: "Personal",
    },
    {
        value: "LEGACY",
        label: "Legacy",
    },
    {
        value: "STORY",
        label: "Story",
    },
    {
        value: "SYMBOLIC",
        label: "Symbolic",
    },
    {
        value: "OTHER",
        label: "Other",
    },
];

export default async function CreateRelicPage() {
    const [colonists, locations] =
        await Promise.all([
            prisma.colonist.findMany({
                orderBy: [
                    { firstName: "asc" },
                    { lastName: "asc" },
                ],
                include: {
                    legacy: {
                        select: {
                            color: true,
                        },
                    },
                },
            }),

            prisma.location.findMany({
                orderBy: {
                    name: "asc",
                },
            }),
        ]);

    const colonistOptions = colonists.map((colonist) => ({
        value: colonist.id.toString(),
        label: `${colonist.firstName}${colonist.nickname
                ? ` "${colonist.nickname}"`
                : ""
            } ${colonist.lastName}`,
        color: colonist.legacy?.color ?? null,
    }));

    const locationOptions =
        locations.map((location) => ({
            value: location.id.toString(),
            label: location.name,
        }));

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 700,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <Stack gap="xl">
                <div>
                    <Button
                        component="a"
                        href="/relics"
                        variant="subtle"
                        color="gray"
                        mb="md"
                    >
                        ← Back to Relics
                    </Button>

                    <Title order={1}>
                        Create Relic
                    </Title>

                    <Text
                        c="dimmed"
                        mt={4}
                    >
                        Add a significant object to the
                        colony's historical archive.
                    </Text>
                </div>

                <form
                    action="/api/relics/create"
                    method="POST"
                    encType="multipart/form-data"
                >
                    <Stack gap="lg">
                        {/* Primary Image */}
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
                                        Primary Image
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        The main image displayed for
                                        this relic.
                                    </Text>
                                </div>

                                <RelicPrimaryImageUpload />
                            </Stack>
                        </Card>

                        {/* Relic Information */}
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
                                        Relic Information
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        Basic information about this
                                        relic and why it is significant.
                                    </Text>
                                </div>

                                <TextInput
                                    name="name"
                                    label="Name"
                                    placeholder="Relic name"
                                    required
                                />

                                <MultiSelect
                                    name="categories"
                                    label="Categories"
                                    description="Select all categories that apply."
                                    placeholder="Select categories"
                                    data={relicCategories}
                                    searchable
                                    clearable
                                />

                                <Textarea
                                    name="description"
                                    label="Description"
                                    placeholder="Describe this relic..."
                                    minRows={5}
                                />

                                <TextInput
                                    name="origin"
                                    label="Origin"
                                    description="Where it came from, how it was obtained, or other relevant origin information."
                                    placeholder="Optional origin"
                                />
                            </Stack>
                        </Card>

                        {/* Ownership */}
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
                                        Ownership
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        Record who currently owns the
                                        relic. Ownership is optional
                                        for colony-wide or otherwise
                                        unowned relics.
                                    </Text>
                                </div>

                                <LegacyColorColonistSelect
                                    name="ownerId"
                                    label="Current owner"
                                    data={colonistOptions}
                                    searchable
                                    clearable
                                />

                                <Text
                                    size="sm"
                                    c="dimmed"
                                    mt="xs"
                                >
                                    Previous ownership can be added
                                    after the relic has been created.
                                </Text>
                            </Stack>
                        </Card>

                        {/* Location */}
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
                                        Location
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        Where the relic is currently
                                        kept.
                                    </Text>
                                </div>

                                <Select
                                    name="locationId"
                                    label="Current location"
                                    placeholder="Select a location"
                                    data={locationOptions}
                                    searchable
                                    clearable
                                />
                            </Stack>
                        </Card>

                        {/* Additional Images */}
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
                                        Additional Images
                                    </Title>

                                    <Text
                                        c="dimmed"
                                        size="sm"
                                        mt={2}
                                    >
                                        Optional additional images for
                                        the relic's gallery.
                                    </Text>
                                </div>

                                <input
                                    type="file"
                                    name="images"
                                    accept="image/*"
                                    multiple
                                />
                            </Stack>
                        </Card>

                        {/* Actions */}
                        <Group justify="flex-end">
                            <Button
                                component="a"
                                href="/relics"
                                variant="subtle"
                                color="gray"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                color="mesa"
                                size="md"
                            >
                                Create Relic
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </main>
    );
}