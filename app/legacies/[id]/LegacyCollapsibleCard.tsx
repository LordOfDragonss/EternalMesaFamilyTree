
"use client";

import {
    Accordion,
    Badge,
    Card,
    Group,
    Text,
} from "@mantine/core";
import type { ReactNode } from "react";

type LegacyCollapsibleCardProps = {
    title: string;
    count: number;
    value: string;
    legacyColor: string;
    children: ReactNode;
};

export default function LegacyCollapsibleCard({
    title,
    count,
    value,
    legacyColor,
    children,
}: LegacyCollapsibleCardProps) {
    return (
        <Card
            shadow="sm"
            padding={0}
            radius="md"
            withBorder
            bg="#161616"
            style={{
                borderColor: `${legacyColor}55`,
                overflow: "hidden",
            }}
        >
            <Accordion
                variant="default"
                multiple
                styles={{
                    item: {
                        borderBottom: 0,
                    },
                    control: {
                        padding: "1.25rem",
                    },
                    label: {
                        color: legacyColor,
                        fontWeight: 600,
                    },
                    content: {
                        padding: "0 1.25rem 1.25rem",
                    },
                }}
            >
                <Accordion.Item value={value}>
                    <Accordion.Control>
                        <Group gap="sm">
                            <Text
                                fw={600}
                                style={{ color: legacyColor }}
                            >
                                {title}
                            </Text>

                            <Badge variant="light" color="gray">
                                {count}
                            </Badge>
                        </Group>
                    </Accordion.Control>

                    <Accordion.Panel>
                        {children}
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Card>
    );
}
