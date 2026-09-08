"use client";

import {
    Accordion,
    ActionIcon,
    Card,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import {
    ArrowLeft,
    Pencil,
} from "lucide-react";
import { useState } from "react";

type LegacyColorPreviewProps = {
    color: string;
    legacyName?: string;
};

export default function LegacyColorPreview({
    color,
    legacyName = "Example Legacy",
}: LegacyColorPreviewProps) {
    const [colonistHovered, setColonistHovered] = useState(false);
    const [legacyHovered, setLegacyHovered] = useState(false);

    return (
        <Accordion
            variant="contained"
            chevronPosition="left"
            styles={{
                item: {
                    backgroundColor: "transparent",
                },
            }}
        >
            <Accordion.Item value="preview">
                <Accordion.Control>
                    <div>
                        <Text fw={600}>
                            Preview
                        </Text>

                        <Text size="sm" c="dimmed">
                            See how this color looks in the app.
                        </Text>
                    </div>
                </Accordion.Control>

                <Accordion.Panel>
                    <SimpleGrid
                        cols={{
                            base: 1,
                            md: 2,
                        }}
                        spacing="md"
                        style={{
                            alignItems: "start",
                        }}
                    >
                        {/* Legacy page */}
                        <Card
                            padding="lg"
                            radius="md"
                            withBorder
                            bg="#161616"
                            style={{
                                borderColor: `${color}55`,
                                transition:
                                    "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                                transform: legacyHovered
                                    ? "translateY(-2px)"
                                    : undefined,
                                boxShadow: legacyHovered
                                    ? "0 8px 20px rgba(0, 0, 0, 0.35)"
                                    : undefined,
                            }}
                            onMouseEnter={() =>
                                setLegacyHovered(true)
                            }
                            onMouseLeave={() =>
                                setLegacyHovered(false)
                            }
                        >
                            <Stack gap="lg">
                                <Text
                                    size="sm"
                                    fw={600}
                                    c="dimmed"
                                >
                                    Legacy page
                                </Text>

                                {/* Legacy header */}
                                <Group
                                    justify="space-between"
                                    align="flex-start"
                                >
                                    <Group
                                        align="stretch"
                                        gap="md"
                                    >
                                        <div
                                            style={{
                                                width: 5,
                                                borderRadius: 999,
                                                backgroundColor: color,
                                                boxShadow: `0 0 12px ${color}55`,
                                            }}
                                        />

                                        <div>
                                            <Title
                                                order={2}
                                                style={{
                                                    color,
                                                }}
                                            >
                                                {legacyName}
                                            </Title>

                                            <Text
                                                c="dimmed"
                                                size="sm"
                                                mt={4}
                                            >
                                                A legacy of the Eternal Mesa
                                            </Text>
                                        </div>
                                    </Group>

                                    <Group gap="xs">
                                        <ActionIcon
                                            variant="subtle"
                                            style={{
                                                color,
                                            }}
                                            size="sm"
                                        >
                                            <ArrowLeft size={16} />
                                        </ActionIcon>

                                        <ActionIcon
                                            variant="subtle"
                                            style={{
                                                color,
                                            }}
                                            size="sm"
                                        >
                                            <Pencil size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Group>

                                {/* Legacy information card */}
                                <Card
                                    shadow="sm"
                                    padding="md"
                                    radius="md"
                                    withBorder
                                    bg="#161616"
                                    style={{
                                        borderColor: `${color}55`,
                                    }}
                                >
                                    <Stack gap="sm">
                                        <Title
                                            order={4}
                                            style={{
                                                color,
                                            }}
                                        >
                                            Legacy Information
                                        </Title>

                                        <div>
                                            <Text
                                                size="xs"
                                                c="dimmed"
                                            >
                                                Founded by
                                            </Text>

                                            <Text size="sm">
                                                Founder Name
                                            </Text>
                                        </div>

                                        <div>
                                            <Text
                                                size="xs"
                                                c="dimmed"
                                            >
                                                Members
                                            </Text>

                                            <Text size="sm">
                                                12
                                            </Text>
                                        </div>
                                    </Stack>
                                </Card>

                                {/* Notable colonists preview */}
                                <Card
                                    shadow="sm"
                                    padding="md"
                                    radius="md"
                                    withBorder
                                    bg="#161616"
                                    style={{
                                        borderColor: `${color}55`,
                                    }}
                                >
                                    <Stack gap="xs">
                                        <Title
                                            order={4}
                                            style={{
                                                color,
                                            }}
                                        >
                                            Notable Colonists
                                        </Title>

                                        <Text
                                            size="sm"
                                            style={{
                                                color,
                                            }}
                                        >
                                            Colonist Name
                                        </Text>

                                        <Text
                                            size="sm"
                                            style={{
                                                color,
                                            }}
                                        >
                                            Colonist Name
                                        </Text>
                                    </Stack>
                                </Card>
                            </Stack>
                        </Card>

                        {/* Colonist card */}
                        <Card
                            padding="lg"
                            radius="md"
                            withBorder
                            bg="#161616"
                            style={{
                                borderColor: colonistHovered
                                    ? color
                                    : "#292929",
                                transform: colonistHovered
                                    ? "translateY(-2px)"
                                    : undefined,
                                boxShadow: colonistHovered
                                    ? "0 8px 20px rgba(0, 0, 0, 0.35)"
                                    : undefined,
                                transition:
                                    "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                                cursor: "default",
                            }}
                            onMouseEnter={() =>
                                setColonistHovered(true)
                            }
                            onMouseLeave={() =>
                                setColonistHovered(false)
                            }
                        >
                            <Stack gap="md">
                                <Text
                                    size="sm"
                                    fw={600}
                                    c="dimmed"
                                >
                                    Colonist card
                                </Text>

                                <Group
                                    align="flex-start"
                                    wrap="nowrap"
                                >
                                    {/* Portrait */}
                                    <div
                                        style={{
                                            width: 70,
                                            height: 90,
                                            borderRadius:
                                                "var(--mantine-radius-md)",
                                            border: "1px solid #292929",
                                            backgroundColor: "#111",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#666",
                                            fontSize: "1.5rem",
                                            flexShrink: 0,
                                        }}
                                    >
                                        ?
                                    </div>

                                    {/* Colonist information */}
                                    <div
                                        style={{
                                            minWidth: 0,
                                        }}
                                    >
                                        <Text
                                            fw={600}
                                            size="lg"
                                        >
                                            Colonist Name
                                        </Text>

                                        <Text
                                            size="sm"
                                            mt={4}
                                            fw={500}
                                            style={{
                                                color,
                                            }}
                                        >
                                            Colonist Title
                                        </Text>

                                        <Text
                                            size="sm"
                                            mt={2}
                                            style={{
                                                color,
                                            }}
                                        >
                                            {legacyName}
                                        </Text>

                                        <Text
                                            c="dimmed"
                                            size="sm"
                                            mt={2}
                                        >
                                            Group Name
                                        </Text>
                                    </div>
                                </Group>
                            </Stack>
                        </Card>
                    </SimpleGrid>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
}