import { Card, Stack, Text, Title } from "@mantine/core";

import ColonistNavigation from "./ColonistNavigation";
import ColonistHeader from "@/app/components/ColonistHeader";

type Props = {
    colonist: {
        id: number;
        firstName: string;
        nickname: string | null;
        lastName: string;
        title: string | null;
        gender: string;
        imageURL: string | null;
        legacy: {
            color: string | null;
        } | null;
    };
    section: string;
};

export default function ColonistTabUnderConstruction({
    colonist,
    section,
}: Props) {
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
                <ColonistHeader colonist={colonist} />

                <ColonistNavigation
                    colonistId={colonist.id}
                />

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
                            {section}
                        </Title>

                        <Text c="dimmed">
                            This section is currently under construction.
                        </Text>
                    </Stack>
                </Card>
            </Stack>
        </main>
    );
}