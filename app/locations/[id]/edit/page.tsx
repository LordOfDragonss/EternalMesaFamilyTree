import { prisma } from "@/lib/prisma";
import {
    ActionIcon,
    Card,
    Group,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import LocationForm from "../../LocationForm";

export default async function EditLocationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const locationId = Number(id);

    const [location, colonists] =
        await Promise.all([
            prisma.location.findUnique({
                where: {
                    id: locationId,
                },
                include: {
                    previousNames: {
                        orderBy: { order: "asc" },
                    },
                    colonists: {
                        select: {
                            id: true,
                        },
                    },
                    legacies: {
                        select: {
                            id: true,
                        },
                    },
                    images: {
                        orderBy: {
                            order: "asc",
                        },
                    },
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
                        firstName: "asc",
                    },
                    {
                        lastName: "asc",
                    },
                ],
            }),
        ]);

    if (!location) {
        return <h1>Location not found</h1>;
    }

    const colonistOptions = colonists.map((colonist) => ({
        value: colonist.id.toString(),
        label: `${colonist.firstName}${colonist.nickname
            ? ` "${colonist.nickname}"`
            : ""
            } ${colonist.lastName}`,
        color: colonist.legacy?.color ?? null,
    }));
    const legacies = await prisma.legacy.findMany({
        select: {
            id: true,
            name: true,
            color: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    const legacyOptions = legacies.map((legacy) => ({
        value: legacy.id.toString(),
        label: legacy.name,
        color: legacy.color,
    }));

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 700,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
            }}
        >
            <Stack gap="xl">
                <Group
                    justify="space-between"
                    align="flex-start"
                >
                    <div>
                        <Title order={1}>
                            Edit Location
                        </Title>

                        <Text c="dimmed" mt={4}>
                            Update {location.name}'s information.
                        </Text>
                    </div>

                    <Tooltip label="Back to location">
                        <ActionIcon
                            component="a"
                            href={`/locations/${location.id}`}
                            size="lg"
                            variant="subtle"
                            color="mesa"
                            aria-label="Back to location"
                        >
                            <ArrowLeft size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

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
                    <LocationForm
                        location={location}
                        colonistOptions={colonistOptions}
                        legacyOptions={legacyOptions}
                    />
                </Card>
            </Stack>
        </main>
    );
}