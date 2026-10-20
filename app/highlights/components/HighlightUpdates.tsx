
"use client";

import {
    Accordion,
    Anchor,
    Badge,
    Box,
    Group,
    Stack,
    Text,
} from "@mantine/core";

import type {
    HighlightUpdate,
    HighlightValuePart,
} from "../highlights-data";

import styles from "../highlights.module.css";

type Props = {
    updates: HighlightUpdate[];
};


function UpdateTitle({
    title,
    titleParts,
}: {
    title: string;
    titleParts?: HighlightValuePart[];
}) {
    return (
        <Text fw={700}>
            {title}
            {titleParts?.map((part, index) => (
                <Text
                    key={`${part.label}-${index}`}
                    component="span"
                    c={part.color ?? "inherit"}
                    fw={700}
                >
                    {" "}
                    {part.href ? (
                        <Anchor
                            href={part.href}
                            c={part.color ?? "inherit"}
                            fw={700}
                            underline="never"
                        >
                            {part.label}
                        </Anchor>
                    ) : (
                        part.label
                    )}
                </Text>
            ))}
        </Text>
    );
}

function UpdateValue({
    value,
    href,
    color,
    valueParts,
}: {
    value: string;
    href?: string;
    color?: string | null;
    valueParts?: HighlightValuePart[];
}) {
    if (valueParts && valueParts.length > 0) {
        return (
            <Group gap={6} wrap="wrap">
                {valueParts.map((part, index) => (
                    <Box key={`${part.label}-${index}`}>
                        {part.href ? (
                            <Anchor
                                href={part.href}
                                c={part.color ?? undefined}
                                size="sm"
                            >
                                {part.label}
                            </Anchor>
                        ) : (
                            <Text
                                component="span"
                                size="sm"
                                c={part.color ?? undefined}
                            >
                                {part.label}
                            </Text>
                        )}
                    </Box>
                ))}
            </Group>
        );
    }

    if (href) {
        return (
            <Anchor href={href} c={color ?? undefined} fw={600}>
                {value}
            </Anchor>
        );
    }

    return (
        <Text fw={600} c={color ?? undefined}>
            {value}
        </Text>
    );
}

export default function HighlightUpdates({ updates }: Props) {
    return (
        <section
            id="updates"
            className={styles.updatesSection}
            aria-label="Recent highlight updates"
        >
            <Accordion
                className={styles.updatesPanel}
                variant="default"
                radius="md"
            >
                <Accordion.Item value="recent-updates">
                    <Accordion.Control>
                        <Box>
                            <Group gap="xs" align="center">
                                <Text fw={700} size="lg">
                                    Updates
                                </Text>

                                <Badge
                                    variant="light"
                                    color={updates.length > 0 ? "orange" : "gray"}
                                >
                                    {updates.length}
                                </Badge>
                            </Group>

                            <Text size="sm" c="dimmed" mt={4}>
                                Recent changes to the colony’s records
                            </Text>
                        </Box>
                    </Accordion.Control>

                    <Accordion.Panel>
                        {updates.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                No highlight records have changed in the last
                                three days.
                            </Text>
                        ) : (
                            <Stack gap={0}>
                                {updates.map((update) => (
                                    <Box
                                        key={`${update.id}-${update.detectedAt}`}
                                        className={styles.updateEntry}
                                    >
                                        <Group
                                            justify="space-between"
                                            align="flex-start"
                                            gap="sm"
                                            wrap="wrap"
                                        >
                                            <UpdateTitle
                                                title={update.title}
                                                titleParts={update.current.titleParts}
                                            />

                                            <Text size="xs" c="dimmed">
                                                {new Date(
                                                    update.detectedAt,
                                                ).toLocaleString(undefined, {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </Text>
                                        </Group>

                                        <div className={styles.updateChange}>
                                            <Text
                                                size="xs"
                                                c="dimmed"
                                                className={styles.updateLabel}
                                            >
                                                Previous
                                            </Text>

                                            <Box className={styles.updateValue}>
                                                <UpdateValue
                                                    value={update.previous.value}
                                                    href={update.previous.href}
                                                    color={update.previous.color}
                                                    valueParts={update.previous.valueParts}
                                                />
                                            </Box>
                                        </div>

                                        <div className={styles.updateChange}>
                                            <Text
                                                size="xs"
                                                c="dimmed"
                                                className={styles.updateLabel}
                                            >
                                                Current
                                            </Text>

                                            <Box className={styles.updateValue}>
                                                <UpdateValue
                                                    value={update.current.value}
                                                    href={update.current.href}
                                                    color={update.current.color}
                                                    valueParts={update.current.valueParts}
                                                />
                                            </Box>
                                        </div>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </section>
    );
}
