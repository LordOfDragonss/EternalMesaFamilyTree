import { Button, Card, Stack, Text, Title } from "@mantine/core";
import GroupForm from "../GroupForm";

export default function CreateGroupPage() {
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
                        href="/groups"
                        variant="subtle"
                        color="gray"
                        mb="md"
                    >
                        ← Back to Groups
                    </Button>

                    <Title order={1}>
                        Create Group
                    </Title>

                    <Text c="dimmed" mt={4}>
                        Create a group to associate colonists outside of
                        their family lineage.
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
                    <GroupForm />
                </Card>
            </Stack>
        </main>
    );
}