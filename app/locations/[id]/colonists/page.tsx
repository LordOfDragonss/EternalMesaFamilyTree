import {
    ActionIcon,
    Card,
    Group,
    Select,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Plus, X } from "lucide-react";

import { prisma } from "@/lib/prisma";
import LocationHeader from "../LocationHeader";
import LocationNavigation from "../LocationNavigation";

export default async function LocationColonistsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const locationId = Number(id);

    const location = await prisma.location.findUnique({
        where: {
            id: locationId,
        },
        include: {
            previousNames: {
                orderBy: {
                    order: "asc",
                },
            },
            colonists: {
                include: {
                    legacy: {
                        select: {
                            name: true,
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
            },
        },
    });

    if (!location) {
        return <h1>Location not found</h1>;
    }

    const memberIds = location.colonists.map(
        (colonist) => colonist.id
    );

    const availableColonists = await prisma.colonist.findMany({
        where: {
            id: {
                notIn: memberIds,
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

    const colonistOptions = availableColonists.map((colonist) => ({
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
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
                boxSizing: "border-box",
            }}
        >
            <Stack gap="xl">
                <LocationHeader location={location} />

                <LocationNavigation locationId={location.id} />

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
                                Colonists
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Colonists associated with this location.
                            </Text>
                        </div>

                        <Stack gap="xs">
                            {location.colonists.map((colonist) => {
                                const legacyColor =
                                    colonist.legacy?.color ??
                                    "var(--mantine-color-text)";

                                return (
                                    <Group
                                        key={colonist.id}
                                        justify="space-between"
                                        gap="xs"
                                    >
                                        <Text
                                            component="a"
                                            href={`/colonists/${colonist.id}`}
                                            fw={500}
                                            style={{
                                                color: legacyColor,
                                                textDecoration: "none",
                                            }}
                                        >
                                            {colonist.firstName}
                                            {colonist.nickname &&
                                                ` "${colonist.nickname}"`}
                                            {" "}
                                            {colonist.lastName}
                                        </Text>

                                        <form
                                            action={`/api/locations/${location.id}/colonists/${colonist.id}/delete`}
                                            method="POST"
                                        >
                                            <Tooltip label="Remove colonist">
                                                <ActionIcon
                                                    type="submit"
                                                    variant="subtle"
                                                    color="red"
                                                    size="sm"
                                                    aria-label={`Remove ${colonist.firstName} ${colonist.lastName}`}
                                                >
                                                    <X size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </form>
                                    </Group>
                                );
                            })}

                            {location.colonists.length === 0 && (
                                <Text c="dimmed">
                                    No colonists are associated with this
                                    location yet.
                                </Text>
                            )}
                        </Stack>

                        {availableColonists.length > 0 && (
                            <form
                                action={`/api/locations/${location.id}/colonists`}
                                method="POST"
                            >
                                <Group
                                    align="flex-end"
                                    gap="xs"
                                >
                                    <Select
                                        name="colonistId"
                                        label="Add colonist"
                                        placeholder="Select a colonist"
                                        data={colonistOptions}
                                        searchable
                                        style={{
                                            flex: 1,
                                        }}
                                    />

                                    <Tooltip label="Add colonist">
                                        <ActionIcon
                                            type="submit"
                                            size="lg"
                                            variant="filled"
                                            color="mesa"
                                            aria-label="Add colonist"
                                        >
                                            <Plus size={20} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </form>
                        )}

                        {availableColonists.length === 0 &&
                            location.colonists.length > 0 && (
                                <Text
                                    size="sm"
                                    c="dimmed"
                                >
                                    All colonists are already associated
                                    with this location.
                                </Text>
                            )}
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}