import {
    Card,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import { prisma } from "@/lib/prisma";
import RelicHeader from "./RelicHeader";
import RelicNavigation from "./RelicNavigation";
import RelicOwnershipHistory from "./RelicOwnershipHistory";

function formatCategory(category: string) {
    return category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}

export default async function RelicPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const relic = await prisma.relic.findUnique({
        where: {
            id: Number(id),
        },
        include: {
            owner: {
                include: {
                    legacy: true,
                },
            },

            location: true,

            ownershipHistory: {
                include: {
                    colonist: {
                        include: {
                            legacy: true,
                        },
                    },
                },
                orderBy: {
                    order: "asc",
                },
            },

            images: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });

    if (!relic) {
        return <h1>Relic not found</h1>;
    }

    const colonists =
        await prisma.colonist.findMany({
            orderBy: [
                {
                    firstName: "asc",
                },
                {
                    lastName: "asc",
                },
            ],
            select: {
                id: true,
                firstName: true,
                nickname: true,
                lastName: true,
                legacy: {
                    select: {
                        color: true,
                    },
                },
            },
        });

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
                {/* Header */}
                <RelicHeader relic={relic} />

                {/* Navigation */}
                <RelicNavigation
                    relicId={relic.id}
                />

                {/* Primary Image */}
                <Card
                    shadow="sm"
                    padding="md"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: "#292929",
                    }}
                >
                    {relic.primaryImageURL ? (
                        <img
                            src={`/api/images/${relic.primaryImageURL}`}
                            alt={relic.name}
                            style={{
                                display: "block",
                                width: "100%",
                                maxHeight: 320,
                                objectFit: "contain",
                                borderRadius:
                                    "var(--mantine-radius-md)",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                minHeight: 280,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#111",
                                borderRadius:
                                    "var(--mantine-radius-md)",
                            }}
                        >
                            <Text c="dimmed">
                                No primary image.
                            </Text>
                        </div>
                    )}
                </Card>

                {/* Information */}
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
                                Information
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Information about this relic.
                            </Text>
                        </div>

                        {relic.description ? (
                            <Text>
                                {relic.description}
                            </Text>
                        ) : (
                            <Text c="dimmed">
                                No description has been
                                added yet.
                            </Text>
                        )}

                        <div>
                            <Text
                                size="sm"
                                c="dimmed"
                            >
                                Categories
                            </Text>

                            {relic.categories.length >
                                0 ? (
                                <Text>
                                    {relic.categories
                                        .map(
                                            formatCategory
                                        )
                                        .join(", ")}
                                </Text>
                            ) : (
                                <Text c="dimmed">
                                    No categories assigned.
                                </Text>
                            )}
                        </div>

                        <div>
                            <Text
                                size="sm"
                                c="dimmed"
                            >
                                Origin
                            </Text>

                            {relic.origin ? (
                                <Text>
                                    {relic.origin}
                                </Text>
                            ) : (
                                <Text c="dimmed">
                                    No origin recorded.
                                </Text>
                            )}
                        </div>
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
                                The recorded ownership of
                                this relic.
                            </Text>
                        </div>

                        <div>
                            <Text
                                size="sm"
                                c="dimmed"
                            >
                                Current owner
                            </Text>

                            {relic.owner ? (
                                <Text
                                    component="a"
                                    href={`/colonists/${relic.owner.id}`}
                                    c={
                                        relic.owner
                                            .legacy
                                            ?.color ??
                                        "var(--mantine-color-text)"
                                    }
                                    fw={500}
                                >
                                    {relic.owner.firstName}{" "}
                                    {relic.owner.nickname &&
                                        `"${relic.owner.nickname}"`}{" "}
                                    {relic.owner.lastName}
                                </Text>
                            ) : (
                                <Text c="dimmed">
                                    No individual owner.
                                </Text>
                            )}
                        </div>

                        <RelicOwnershipHistory
                            relicId={relic.id}
                            ownershipHistory={
                                relic.ownershipHistory
                            }
                            colonists={colonists}
                            currentOwner={
                                relic.owner
                            }
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
                                Where this relic is
                                currently kept.
                            </Text>
                        </div>

                        {relic.location ? (
                            <Text
                                component="a"
                                href={`/locations/${relic.location.id}`}
                                c="mesa"
                                fw={500}
                            >
                                {relic.location.name}
                            </Text>
                        ) : (
                            <Text c="dimmed">
                                No current location recorded.
                            </Text>
                        )}
                    </Stack>
                </Card>

                {/* Gallery */}
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
                                Gallery
                            </Title>

                            <Text
                                c="dimmed"
                                size="sm"
                                mt={2}
                            >
                                Images associated with
                                this relic.
                            </Text>
                        </div>

                        <Text>
                            {relic.images.length}{" "}
                            {relic.images.length === 1
                                ? "image"
                                : "images"}{" "}
                            in the gallery.
                        </Text>

                        <Text
                            component="a"
                            href={`/relics/${relic.id}/gallery`}
                            c="mesa"
                            fw={500}
                        >
                            View gallery
                        </Text>
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}