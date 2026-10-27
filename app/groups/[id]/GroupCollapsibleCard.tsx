
"use client";

import {
    Accordion,
    Badge,
    Card,
    Group,
    Text,
} from "@mantine/core";
import type { ReactNode } from "react";

type GroupCollapsibleCardProps = {
    title: string;
    count: number;
    value: string;
    children: ReactNode;
    defaultOpen?: boolean;
};

export default function GroupCollapsibleCard({
    title,
    count,
    value,
    children,
    defaultOpen = false,
}: GroupCollapsibleCardProps) {
    return (
        <Card
            shadow="sm"
            padding={0}
            radius="md"
            withBorder
            bg="#161616"
            style={{
                borderColor: "#292929",
                overflow: "hidden",
            }}
        >
            <Accordion
                variant="default"
                multiple
                defaultValue={defaultOpen ? [value] : []}
                styles={{
                    item: {
                        borderBottom: 0,
                    },
                    control: {
                        padding: "1.25rem",
                    },
                    label: {
                        color: "var(--mantine-color-text)",
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
                            <Text fw={600}>
                                {title}
                            </Text>

                            <Badge
                                variant="light"
                                color="gray"
                            >
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
