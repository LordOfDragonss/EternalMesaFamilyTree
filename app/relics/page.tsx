import {
    ActionIcon,
    Badge,
    Card,
    Group,
    SimpleGrid,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Pencil, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import DeleteButton from "@/app/components/DeleteButton";

export default async function RelicsPage() {
    const relics = await prisma.relic.findMany({
        include: {
            owner: {
                include: {
                    legacy: {
                        select: {
                            color: true,
                        },
                    },
                },
            },
            location: true,
            images: {
                orderBy: {
                    order: "asc",
                },
                take: 1,
            },
        },
        orderBy: {
            id: "asc",
        },
    });

    return (
        <main style={{ padding: "2rem" }}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1}>Relics</Title>
                    <Text c="dimmed">
                        Browse the significant relics of the colony.
                    </Text>
                </div>

                <Tooltip label="Add relic">
                    <ActionIcon
                        component="a"
                        href="/relics/create"
                        size="lg"
                        variant="filled"
                        color="mesa"
                        aria-label="Add relic"
                    >
                        <Plus size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <Text c="dimmed" size="sm" mb="md">
                {relics.length}{" "}
                {relics.length === 1 ? "relic" : "relics"}
            </Text>

            {relics.length > 0 ? (
                <SimpleGrid
                    cols={{
                        base: 1,
                        sm: 2,
                        md: 3,
                        lg: 4,
                    }}
                    spacing="lg"
                >
                    {relics.map((relic) => {
                        const galleryImage =
                            relic.images[0]?.imageURL;

                        const imageURL =
                            relic.primaryImageURL ??
                            galleryImage;

                        return (
                            <Card
                                key={relic.id}
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                bg="#161616"
                                style={{
                                    position: "relative",
                                    borderColor: "#292929",
                                    transition:
                                        "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                                }}
                                className="relic-card"
                            >
                                <a
                                    href={`/relics/${relic.id}`}
                                    className="relic-card-link"
                                    aria-label={`View ${relic.name}`}
                                />

                                {/* Relic image */}
                                {imageURL ? (
                                    <img
                                        src={`/api/images/${imageURL}`}
                                        alt={`${relic.name} image`}
                                        style={{
                                            width: "100%",
                                            height: 220,
                                            objectFit: "cover",
                                            borderRadius:
                                                "var(--mantine-radius-md)",
                                            border: "1px solid #292929",
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 220,
                                            borderRadius:
                                                "var(--mantine-radius-md)",
                                            border: "1px dashed #444",
                                            backgroundColor: "#111",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#666",
                                            fontSize: "2rem",
                                        }}
                                    >
                                        ?
                                    </div>
                                )}

                                {/* Information */}
                                <div
                                    style={{
                                        marginTop: "1rem",
                                        minWidth: 0,
                                    }}
                                >
                                    <Text
                                        fw={600}
                                        size="lg"
                                        lineClamp={2}
                                    >
                                        {relic.name}
                                    </Text>

                                    {relic.categories.length > 0 && (
                                        <Group
                                            gap={6}
                                            mt="xs"
                                            wrap="wrap"
                                        >
                                            {relic.categories.map(
                                                (category) => (
                                                    <Badge
                                                        key={category}
                                                        size="sm"
                                                        variant="light"
                                                        color="mesa"
                                                    >
                                                        {formatCategory(
                                                            category
                                                        )}
                                                    </Badge>
                                                )
                                            )}
                                        </Group>
                                    )}

                                    {relic.owner && (
                                        <Text
                                            size="sm"
                                            mt="sm"
                                        >
                                            <Text
                                                component="span"
                                                c="dimmed"
                                            >
                                                Owner:{" "}
                                            </Text>

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
                                                style={{
                                                    position:
                                                        "relative",
                                                    zIndex: 1,
                                                }}
                                            >
                                                {
                                                    relic.owner
                                                        .firstName
                                                }{" "}
                                                {relic.owner
                                                    .nickname &&
                                                    `"${relic.owner.nickname}"`}{" "}
                                                {
                                                    relic.owner
                                                        .lastName
                                                }
                                            </Text>
                                        </Text>
                                    )}

                                    {relic.location && (
                                        <Text
                                            size="sm"
                                            mt={2}
                                            c="dimmed"
                                        >
                                            {relic.location.name}
                                        </Text>
                                    )}

                                    {relic.description && (
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            mt="sm"
                                            lineClamp={3}
                                        >
                                            {relic.description}
                                        </Text>
                                    )}
                                </div>

                                {/* Actions */}
                                <Group
                                    mt="lg"
                                    justify="flex-end"
                                    gap="xs"
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                    }}
                                >
                                    <Tooltip label="Edit relic">
                                        <ActionIcon
                                            component="a"
                                            href={`/relics/${relic.id}/edit`}
                                            variant="subtle"
                                            aria-label="Edit relic"
                                        >
                                            <Pencil
                                                size={18}
                                            />
                                        </ActionIcon>
                                    </Tooltip>

                                    <DeleteButton
                                        action={`/api/relics/${relic.id}/delete`}
                                        name={relic.name}
                                        type="Relic"
                                    />
                                </Group>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="#161616"
                    style={{
                        borderColor: "#292929",
                        textAlign: "center",
                    }}
                >
                    <Text fw={600}>
                        No relics found
                    </Text>

                    <Text
                        size="sm"
                        c="dimmed"
                        mt="xs"
                    >
                        Add a relic to begin building the relic
                        archive.
                    </Text>
                </Card>
            )}
        </main>
    );
}

function formatCategory(
    category: string
) {
    return category
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}