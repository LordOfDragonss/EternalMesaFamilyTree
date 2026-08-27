import { prisma } from "@/lib/prisma";
import {
    ActionIcon,
    Card,
    Group,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import GroupForm from "../../GroupForm";

export default async function EditGroupPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const groupId = Number(id);

    const group = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
    });

    if (!group) {
        return <h1>Group not found</h1>;
    }

    return (
        <main
            style={{
                width: "100%",
                maxWidth: 500,
                margin: "0 auto",
                padding: "2.5rem 1.5rem",
            }}
        >
            <Stack gap="xl">
                <Group
                    justify="space-between"
                    align="flex-start"
                >
                    <div>
                        <Title order={1}>
                            Edit Group
                        </Title>

                        <Text c="dimmed" mt={4}>
                            Update {group.name}'s information.
                        </Text>
                    </div>

                    <Tooltip label="Back to group">
                        <ActionIcon
                            component="a"
                            href={`/groups/${group.id}`}
                            size="lg"
                            variant="subtle"
                            color="mesa"
                            aria-label="Back to group"
                        >
                            <ArrowLeft size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

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
                    <GroupForm group={group} />
                </Card>
            </Stack>
        </main>
    );
}