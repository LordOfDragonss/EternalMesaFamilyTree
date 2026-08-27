import { Card, Stack, Text, Title } from "@mantine/core";

export default function UnderConstruction({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
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
            <Stack gap="sm">
                <Title order={2}>
                    {title}
                </Title>

                <Text c="dimmed">
                    {description ??
                        "This section is currently under construction."}
                </Text>
            </Stack>
        </Card>
    );
}