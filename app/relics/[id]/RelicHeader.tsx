"use client";

import {
    ActionIcon,
    Badge,
    Group,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    ArrowLeft,
    Pencil,
} from "lucide-react";

type RelicHeaderProps = {
    relic: {
        id: number;
        name: string;
        categories: string[];
    };
};

function formatCategory(category: string) {
    return category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}

export default function RelicHeader({
    relic,
}: RelicHeaderProps) {
    return (
        <Group
            justify="space-between"
            align="flex-start"
        >
            <div>
                <Title order={1}>
                    {relic.name}
                </Title>

                {relic.categories.length > 0 && (
                    <Group gap="xs" mt="sm">
                        {relic.categories.map(
                            (category) => (
                                <Badge
                                    key={category}
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
            </div>

            <Group gap="xs">
                <Tooltip label="Back to relics">
                    <ActionIcon
                        component="a"
                        href="/relics"
                        variant="subtle"
                        color="mesa"
                        size="lg"
                        aria-label="Back to relics"
                    >
                        <ArrowLeft size={20} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Edit relic">
                    <ActionIcon
                        component="a"
                        href={`/relics/${relic.id}/edit`}
                        variant="subtle"
                        color="mesa"
                        size="lg"
                        aria-label="Edit relic"
                    >
                        <Pencil size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Group>
    );
}