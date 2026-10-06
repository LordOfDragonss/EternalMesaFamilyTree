import {
    Card,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import { prisma } from "@/lib/prisma";
import ColonistHeader from "@/app/components/ColonistHeader";
import ColonistNavigation from "../ColonistNavigation";
import ColonistGalleryAdd from "./ColonistGalleryAdd";
import ColonistGalleryGrid from "./ColonistGalleryGrid";

export default async function ColonistGalleryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const colonist = await prisma.colonist.findUnique({
        where: {
            id: Number(id),
        },
        include: {
            legacy: true,

            images: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });

    if (!colonist) {
        return <h1>Colonist not found</h1>;
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
                {/* Header */}
                <ColonistHeader colonist={colonist} />

                {/* Navigation */}
                <ColonistNavigation
                    colonistId={colonist.id}
                />

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
                                    Images of this colonist.
                                </Text>
                            </div>

                            <ColonistGalleryAdd
                                colonistId={colonist.id}
                            />
                        </Group>

                        {colonist.images.length === 0 ? (
                            <Text c="dimmed">
                                No images have been added yet.
                            </Text>
                        ) : (
                            <ColonistGalleryGrid
                                colonistId={colonist.id}
                                imageURL={
                                    colonist.imageURL
                                }
                                images={colonist.images}
                            />
                        )}
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}