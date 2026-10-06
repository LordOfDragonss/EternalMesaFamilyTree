import {
    Card,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import { prisma } from "@/lib/prisma";
import RelicHeader from "../RelicHeader";
import RelicNavigation from "../RelicNavigation";
import RelicGalleryAdd from "./RelicGalleryAdd";
import RelicGalleryGrid from "./RelicGalleryGrid";

export default async function RelicGalleryPage({
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
                <RelicHeader relic={relic} />

                <RelicNavigation relicId={relic.id} />

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
                        <Group
                            justify="space-between"
                            align="flex-start"
                        >
                            <div>
                                <Title order={3}>
                                    Gallery
                                </Title>

                                <Text
                                    c="dimmed"
                                    size="sm"
                                    mt={2}
                                >
                                    Images of this relic.
                                </Text>
                            </div>

                            <RelicGalleryAdd
                                relicId={relic.id}
                            />
                        </Group>

                        {relic.images.length === 0 ? (
                            <Text c="dimmed">
                                No images have been added yet.
                            </Text>
                        ) : (
                            <RelicGalleryGrid
                                relicId={relic.id}
                                primaryImageURL={
                                    relic.primaryImageURL
                                }
                                images={relic.images}
                            />
                        )}
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}