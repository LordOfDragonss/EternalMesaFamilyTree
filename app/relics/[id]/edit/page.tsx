import { notFound } from "next/navigation";
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

import RelicPrimaryImageUpload from "../../create/RelicPrimaryImageUpload";

const relicCategories = [
    { value: "IDEOLOGY", label: "Ideology" },
    { value: "WEAPON", label: "Weapon" },
    { value: "PERSONAL", label: "Personal" },
    { value: "LEGACY", label: "Legacy" },
    { value: "STORY", label: "Story" },
    { value: "SYMBOLIC", label: "Symbolic" },
    { value: "OTHER", label: "Other" },
];

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditRelicPage({
    params,
}: Props) {
    const { id } = await params;

    const relicId = Number(id);

    if (!Number.isInteger(relicId)) {
        notFound();
    }

    const [relic, colonists, locations] =
        await Promise.all([
            prisma.relic.findUnique({
                where: {
                    id: relicId,
                },
            }),

            prisma.colonist.findMany({
                orderBy: [
                    { firstName: "asc" },
                    { lastName: "asc" },
                ],
            }),

            prisma.location.findMany({
                orderBy: {
                    name: "asc",
                },
            }),
        ]);

    if (!relic) {
        notFound();
    }

    const colonistOptions =
        colonists.map((colonist) => ({
            value: colonist.id.toString(),
            label: `${colonist.firstName}${colonist.nickname
                    ? ` "${colonist.nickname}"`
                    : ""
                } ${colonist.lastName}`,
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
                        href={`/relics/${relic.id}`}
                        variant="subtle"
                        color="gray"
                        mb="md"
                    >
                        ← Back to Relic
                    </Button>

                    <Title order={1}>
                        Edit Relic
                    </Title>

                    <Text c="dimmed" mt={4}>
                        Update the relic's information and metadata.
                    </Text>
                </div>

                <form
                    action={`/api/relics/${relic.id}/edit`}
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
                                        Replace the main image for this relic.
                                    </Text>
                                </div>

                                <RelicPrimaryImageUpload
                                    existingImage={
                                        relic.primaryImageURL
                                    }
                                />
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
                                        Basic information about this relic and why it is significant.
                                    </Text>
                                </div>

                                <TextInput
                                    name="name"
                                    label="Name"
                                    placeholder="Relic name"
                                    defaultValue={
                                        relic.name
                                    }
                                    required
                                />

                                <MultiSelect
                                    name="categories"
                                    label="Categories"
                                    description="Select all categories that apply."
                                    placeholder="Select categories"
                                    data={relicCategories}
                                    defaultValue={
                                        relic.categories
                                    }
                                    searchable
                                    clearable
                                    required
                                />

                                <Textarea
                                    name="description"
                                    label="Description"
                                    placeholder="Describe this relic..."
                                    defaultValue={
                                        relic.description ??
                                        ""
                                    }
                                    minRows={5}
                                />

                                <TextInput
                                    name="origin"
                                    label="Origin"
                                    description="Where it came from, how it was obtained, or other relevant origin information."
                                    placeholder="Optional origin"
                                    defaultValue={
                                        relic.origin ??
                                        ""
                                    }
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
                                        Set the colonist who currently owns this relic.
                                    </Text>
                                </div>

                                <Select
                                    name="ownerId"
                                    label="Current Owner"
                                    placeholder="No current owner"
                                    data={colonistOptions}
                                    defaultValue={
                                        relic.ownerId?.toString() ??
                                        null
                                    }
                                    searchable
                                    clearable
                                />
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
                                        Where the relic is currently located.
                                    </Text>
                                </div>

                                <Select
                                    name="locationId"
                                    label="Current Location"
                                    placeholder="No current location"
                                    data={locationOptions}
                                    defaultValue={
                                        relic.locationId?.toString() ??
                                        null
                                    }
                                    searchable
                                    clearable
                                />
                            </Stack>
                        </Card>

                        {/* Actions */}
                        <Group justify="flex-end">
                            <Button
                                component="a"
                                href={`/relics/${relic.id}`}
                                variant="subtle"
                                color="gray"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                color="mesa"
                            >
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </main>
    );
}