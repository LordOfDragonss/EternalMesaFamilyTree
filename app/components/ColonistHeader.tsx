import { ActionIcon, Group, Text, Title, Tooltip } from "@mantine/core";
import { ArrowLeft, Pencil } from "lucide-react";

type ColonistHeaderProps = {
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
};

export default function ColonistHeader({
    colonist,
}: ColonistHeaderProps) {
    const fullName = `${colonist.firstName}${colonist.nickname
            ? ` "${colonist.nickname}"`
            : ""
        } ${colonist.lastName}`;

    return (
        <Group justify="space-between" align="flex-start">
            <Group align="flex-start" gap="md">
                {colonist.imageURL ? (
                    <img
                        src={`/api/images/${colonist.imageURL}`}
                        alt={`${fullName} portrait`}
                        style={{
                            width: 100,
                            height: 125,
                            objectFit: "cover",
                            borderRadius:
                                "var(--mantine-radius-md)",
                            border: "1px solid #292929",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 100,
                            height: 125,
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

                <div>
                    <Title order={1}>
                        {fullName}
                    </Title>

                    {colonist.title && (
                        <Text
                            mt={4}
                            fw={500}
                            style={
                                colonist.legacy?.color
                                    ? {
                                        color:
                                            colonist.legacy.color,
                                    }
                                    : undefined
                            }
                        >
                            {colonist.title}
                        </Text>
                    )}

                    <Text c="dimmed" mt={4}>
                        {colonist.gender}
                    </Text>
                </div>
            </Group>

            <Group gap="xs">
                <Tooltip label="Back to colonists">
                    <ActionIcon
                        component="a"
                        href="/colonists"
                        variant="subtle"
                        color="mesa"
                        size="lg"
                        aria-label="Back to colonists"
                    >
                        <ArrowLeft size={20} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Edit colonist">
                    <ActionIcon
                        component="a"
                        href={`/colonists/${colonist.id}/edit`}
                        variant="subtle"
                        size="lg"
                        aria-label="Edit colonist"
                    >
                        <Pencil size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Group>
    );
}