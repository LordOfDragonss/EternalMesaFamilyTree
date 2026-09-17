import { Button, Card, Stack, Text, Title } from "@mantine/core";
import { prisma } from "@/lib/prisma";
import LocationForm from "../LocationForm";

export default async function CreateLocationPage() {
    const colonists = await prisma.colonist.findMany({
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
    });

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
                boxSizing: "border-box",
            }}
        >
            <Stack gap="xl">
                <div>
                    <Button
                        component="a"
                        href="/locations"
                        variant="subtle"
                        color="gray"
                        mb="md"
                    >
                        ← Back to Locations
                    </Button>

                    <Title order={1}>
                        Create Location
                    </Title>

                    <Text c="dimmed" mt={4}>
                        Add a place that has played a role in the
                        colony's history.
                    </Text>
                </div>

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
                        colonistOptions={colonistOptions}
                        legacyOptions={legacyOptions}
                    />
                </Card>
            </Stack>
        </main>
    );
}