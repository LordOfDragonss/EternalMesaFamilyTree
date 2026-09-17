import { Stack, Text } from "@mantine/core";

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

                <Stack gap="xs">
                    {location.colonists.length === 0 ? (
                        <Text c="dimmed">
                            No colonists are associated with this location.
                        </Text>
                    ) : (
                        location.colonists.map((colonist) => (
                            <Text
                                key={colonist.id}
                                component="a"
                                href={`/colonists/${colonist.id}`}
                                fw={500}
                                style={{
                                    color:
                                        colonist.legacy?.color ??
                                        "var(--mantine-color-text)",
                                    textDecoration: "none",
                                }}
                            >
                                {colonist.firstName}
                                {colonist.nickname &&
                                    ` "${colonist.nickname}"`}
                                {" "}
                                {colonist.lastName}
                            </Text>
                        ))
                    )}
                </Stack>
            </Stack>
        </main>
    );
}