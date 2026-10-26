"use client";

import { useState } from "react";
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Collapse,
    Group,
    MultiSelect,
    Stack,
    Text,
    Tooltip,
} from "@mantine/core";
import {
    ChevronDown,
    ChevronUp,
    X,
} from "lucide-react";
import classes from "../story-editor.module.css";
import type {
    ArchiveRecord,
    ArchiveRecordKey,
} from "../types";

type Props = {
    records: ArchiveRecord[];
    manualRecordKeys: ArchiveRecordKey[];
    inlineRecordKeys: ArchiveRecordKey[];
    onManualRecordKeysChange: (keys: ArchiveRecordKey[]) => void;
};

export default function RelatedArchiveRecordsSection({
    records,
    manualRecordKeys,
    inlineRecordKeys,
    onManualRecordKeysChange,
}: Props) {
    const [collapsed, setCollapsed] = useState(true);

    const manualSet = new Set<string>(manualRecordKeys);
    const inlineSet = new Set<string>(inlineRecordKeys);
    const associatedKeys = new Set([
        ...manualRecordKeys,
        ...inlineRecordKeys,
    ]);

    const relatedRecords = records.filter((record) =>
        associatedKeys.has(record.key),
    );

    const options = records.map((record) => ({
        value: record.key,
        label: `${record.title} · ${record.category}`,
    }));

    return (
        <Card
            withBorder
            radius="md"
            p="md"
            className={classes.refrenceCard}
        >
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Stack gap={2}>
                        <Text fw={600}>Related archive records</Text>

                        <Text size="sm" c="dimmed">
                            {relatedRecords.length === 0
                                ? "No associated records"
                                : `${relatedRecords.length} associated ${
                                    relatedRecords.length === 1
                                        ? "record"
                                        : "records"
                                }`}
                        </Text>
                    </Stack>

                    <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        rightSection={
                            collapsed
                                ? <ChevronDown size={16} />
                                : <ChevronUp size={16} />
                        }
                        onClick={() => setCollapsed((value) => !value)}
                        aria-expanded={!collapsed}
                    >
                        {collapsed ? "Show records" : "Hide records"}
                    </Button>
                </Group>

                <Collapse expanded={!collapsed}>
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            Records associated with this story, either through
                            inline links or by manual selection.
                        </Text>

                        <MultiSelect
                            label="Manual associations"
                            description="Select records that are relevant even if they aren't linked in the story text."
                            placeholder="Search archive records..."
                            data={options}
                            value={manualRecordKeys}
                            onChange={(values) =>
                                onManualRecordKeysChange(
                                    values as ArchiveRecordKey[],
                                )
                            }
                            searchable
                            clearable
                            hidePickedOptions
                        />

                        {relatedRecords.length > 0 ? (
                            <Stack gap="xs">
                                {relatedRecords.map((record) => {
                                    const isManual = manualSet.has(record.key);
                                    const isInline = inlineSet.has(record.key);

                                    const associationLabel =
                                        isManual && isInline
                                            ? "Inline + manual"
                                            : isInline
                                              ? "Inline link"
                                              : "Manual";

                                    return (
                                        <Group
                                            key={record.key}
                                            justify="space-between"
                                            align="center"
                                            wrap="nowrap"
                                            p="sm"
                                            style={{
                                                border: "1px solid var(--mantine-color-dark-4)",
                                                borderRadius: "var(--mantine-radius-md)",
                                            }}
                                        >
                                            <Stack
                                                gap={2}
                                                style={{
                                                    minWidth: 0,
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                <Text
                                                    component="a"
                                                    href={record.href}
                                                    fw={500}
                                                    size="sm"
                                                    c={record.color ?? "mesa"}
                                                    style={{
                                                        overflowWrap: "anywhere",
                                                    }}
                                                >
                                                    {record.title}
                                                </Text>

                                                <Text size="xs" c="dimmed">
                                                    {record.category}
                                                    {record.subtitle
                                                        ? ` · ${record.subtitle}`
                                                        : ""}
                                                </Text>
                                            </Stack>

                                            <Group gap="xs" wrap="nowrap">
                                                <Badge
                                                    variant="light"
                                                    color={
                                                        isManual && isInline
                                                            ? "teal"
                                                            : "gray"
                                                    }
                                                >
                                                    {associationLabel}
                                                </Badge>

                                                {isManual && (
                                                    <Tooltip
                                                        label="Remove manual association"
                                                        withArrow
                                                    >
                                                        <ActionIcon
                                                            type="button"
                                                            variant="subtle"
                                                            color="gray"
                                                            aria-label={`Remove manual association for ${record.title}`}
                                                            onClick={() =>
                                                                onManualRecordKeysChange(
                                                                    manualRecordKeys.filter(
                                                                        (key) =>
                                                                            key !== record.key,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <X size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </Group>
                                        </Group>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Text size="sm" c="dimmed">
                                No related records yet. Link records in the
                                story or add manual associations above.
                            </Text>
                        )}
                    </Stack>
                </Collapse>
            </Stack>
        </Card>
    );
}