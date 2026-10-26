"use client";

import { useMemo, useState } from "react";
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Collapse,
    Group,
    Select,
    Stack,
    Text,
    Textarea,
    Tooltip,
} from "@mantine/core";
import {
    ChevronDown,
    ChevronUp,
    FileText,
    ImagePlus,
    Paperclip,
    Plus,
    X,
} from "lucide-react";
import classes from "../story-editor.module.css";
import type {
    ReferenceMaterialData,
    ReferenceMaterialKind,
    StoryReferenceValue,
} from "../types";
import CreateReferenceMaterialModal from "./CreateReferenceMaterialModal";

type Props = {
    references: StoryReferenceValue[];
    availableReferences: ReferenceMaterialData[];
    onReferencesChange: (references: StoryReferenceValue[]) => void;
    onReferenceCreated: (
        reference: ReferenceMaterialData,
        contextNote: string,
    ) => void;
};

function getKindLabel(kind: ReferenceMaterialKind): string {
    switch (kind) {
        case "IMAGE":
            return "Screenshot / image";
        case "TEXT":
            return "Text reference";
        case "FILE":
            return "File attachment";
        case "OTHER":
            return "Other";
    }
}

function getKindIcon(kind: ReferenceMaterialKind) {
    switch (kind) {
        case "IMAGE":
            return <ImagePlus size={18} />;
        case "FILE":
            return <Paperclip size={18} />;
        case "TEXT":
        case "OTHER":
            return <FileText size={18} />;
    }
}

function getContentLabel(kind: ReferenceMaterialKind): string {
    switch (kind) {
        case "IMAGE":
            return "Caption / description";
        case "FILE":
            return "File description";
        case "TEXT":
            return "Source excerpt / details";
        case "OTHER":
            return "Details";
    }
}

export default function ReferenceMaterialSection({
    references,
    availableReferences,
    onReferencesChange,
    onReferenceCreated,
}: Props) {
    const [collapsed, setCollapsed] = useState(false);
    const [referenceToAdd, setReferenceToAdd] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const attachedReferences = useMemo(
        () =>
            references.flatMap((association) => {
                const reference = availableReferences.find(
                    (item) => item.id === association.referenceId,
                );

                return reference
                    ? [{ association, reference }]
                    : [];
            }),
        [availableReferences, references],
    );

    const availableOptions = useMemo(
        () =>
            availableReferences
                .filter(
                    (reference) =>
                        !references.some(
                            (association) =>
                                association.referenceId === reference.id,
                        ),
                )
                .map((reference) => ({
                    value: String(reference.id),
                    label: `${reference.title} · ${getKindLabel(reference.kind)}`,
                })),
        [availableReferences, references],
    );

    function attachExistingReference(value: string | null) {
        if (!value) {
            setReferenceToAdd(null);
            return;
        }

        const referenceId = Number(value);

        if (
            Number.isSafeInteger(referenceId) &&
            referenceId > 0 &&
            !references.some(
                (item) => item.referenceId === referenceId,
            )
        ) {
            onReferencesChange([
                ...references,
                {
                    referenceId,
                    contextNote: "",
                },
            ]);
        }

        setReferenceToAdd(null);
    }

    function updateContextNote(referenceId: number, contextNote: string) {
        onReferencesChange(
            references.map((association) =>
                association.referenceId === referenceId
                    ? { ...association, contextNote }
                    : association,
            ),
        );
    }

    function detachReference(referenceId: number) {
        onReferencesChange(
            references.filter(
                (association) => association.referenceId !== referenceId,
            ),
        );
    }

    return (
        <>
            <Card
                withBorder
                padding="md"
                radius="md"
                bg="#161616"
                style={{ borderColor: "#292929" }}
                className={classes.referenceCard}
            >
                <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                        <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
                            <Group gap="xs" align="center">
                                <Text fw={600}>Reference material</Text>
                                <Badge variant="light" color="gray">
                                    {attachedReferences.length} attached
                                </Badge>
                            </Group>

                            <Text size="sm" c="dimmed">
                                Reusable sources and clues used to reconstruct
                                this story. Removing an item here only detaches
                                it from this story; it remains in the reference
                                library.
                            </Text>
                        </Stack>

                        <Button
                            variant="subtle"
                            color="gray"
                            size="compact-sm"
                            rightSection={
                                collapsed ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronUp size={16} />
                                )
                            }
                            onClick={() =>
                                setCollapsed((current) => !current)
                            }
                            aria-expanded={!collapsed}
                        >
                            {collapsed ? "Show references" : "Hide references"}
                        </Button>
                    </Group>

                    <Collapse expanded={!collapsed}>
                        <Stack gap="md">
                            <Group align="flex-end" gap="sm" wrap="wrap">
                                <Select
                                    label="Attach an existing reference"
                                    placeholder={
                                        availableOptions.length > 0
                                            ? "Search the reference library..."
                                            : "All references are attached"
                                    }
                                    data={availableOptions}
                                    value={referenceToAdd}
                                    onChange={attachExistingReference}
                                    searchable
                                    clearable
                                    disabled={availableOptions.length === 0}
                                    style={{
                                        flex: "1 1 260px",
                                        minWidth: 0,
                                    }}
                                    comboboxProps={{ withinPortal: true }}
                                />

                                <Button
                                    type="button"
                                    color="mesa"
                                    variant="light"
                                    leftSection={<Plus size={16} />}
                                    onClick={() => setCreateModalOpen(true)}
                                    style={{
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    New reference
                                </Button>
                            </Group>

                            {attachedReferences.length > 0 ? (
                                <Stack gap="sm">
                                    {attachedReferences.map(
                                        ({ association, reference }) => (
                                            <Card
                                                key={reference.id}
                                                withBorder
                                                padding="sm"
                                                radius="md"
                                                bg="#121212"
                                                style={{
                                                    borderColor: "#292929",
                                                }}
                                            >
                                                <Stack gap="sm">
                                                    <Group
                                                        justify="space-between"
                                                        align="flex-start"
                                                        wrap="nowrap"
                                                    >
                                                        <Group
                                                            gap="sm"
                                                            align="flex-start"
                                                            wrap="nowrap"
                                                            style={{
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    flex: "0 0 36px",
                                                                    borderRadius: 8,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    background:
                                                                        "#202020",
                                                                    color: "#b8b8b8",
                                                                }}
                                                            >
                                                                {getKindIcon(
                                                                    reference.kind,
                                                                )}
                                                            </div>

                                                            <Stack
                                                                gap={3}
                                                                style={{
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Group
                                                                    gap="xs"
                                                                    align="center"
                                                                    wrap="wrap"
                                                                >
                                                                    <Text
                                                                        fw={600}
                                                                        size="sm"
                                                                        style={{
                                                                            overflowWrap:
                                                                                "anywhere",
                                                                        }}
                                                                    >
                                                                        {
                                                                            reference.title
                                                                        }
                                                                    </Text>

                                                                    <Badge
                                                                        variant="outline"
                                                                        color="gray"
                                                                    >
                                                                        {getKindLabel(
                                                                            reference.kind,
                                                                        )}
                                                                    </Badge>
                                                                </Group>

                                                                {reference.source && (
                                                                    <Text
                                                                        size="xs"
                                                                        c="dimmed"
                                                                        style={{
                                                                            overflowWrap:
                                                                                "anywhere",
                                                                        }}
                                                                    >
                                                                        Source:{" "}
                                                                        {
                                                                            reference.source
                                                                        }
                                                                    </Text>
                                                                )}
                                                            </Stack>
                                                        </Group>

                                                        <Tooltip
                                                            label="Remove from this story"
                                                            withArrow
                                                        >
                                                            <ActionIcon
                                                                type="button"
                                                                variant="subtle"
                                                                color="gray"
                                                                aria-label={`Remove ${reference.title} from this story`}
                                                                onClick={() =>
                                                                    detachReference(
                                                                        reference.id,
                                                                    )
                                                                }
                                                            >
                                                                <X size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>

                                                    {reference.kind ===
                                                        "IMAGE" &&
                                                        !reference.asset && (
                                                            <Group
                                                                gap="xs"
                                                                p="sm"
                                                                wrap="nowrap"
                                                                style={{
                                                                    background:
                                                                        "#0d0d0d",
                                                                    border:
                                                                        "1px dashed #333",
                                                                    borderRadius: 6,
                                                                }}
                                                            >
                                                                <ImagePlus
                                                                    size={16}
                                                                    color="#888"
                                                                />
                                                                <Text
                                                                    size="xs"
                                                                    c="dimmed"
                                                                >
                                                                    Image
                                                                    reference
                                                                    {reference.source
                                                                        ? ` · ${reference.source}`
                                                                        : " · No filename recorded"}
                                                                </Text>
                                                            </Group>
                                                        )}

                                                    {reference.asset && (
                                                        <Stack gap="xs">
                                                            {reference.kind === "IMAGE" ? (
                                                                <a
                                                                    href={`/api/stories/assets/${reference.asset.id}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={{ display: "block" }}
                                                                >
                                                                    <img
                                                                        src={`/api/stories/assets/${reference.asset.id}`}
                                                                        alt={reference.title}
                                                                        style={{
                                                                            display: "block",
                                                                            maxWidth: "100%",
                                                                            maxHeight: 260,
                                                                            objectFit: "contain",
                                                                            borderRadius: 6,
                                                                            background: "#0d0d0d",
                                                                        }}
                                                                    />
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={`/api/stories/assets/${reference.asset.id}?download=1`}
                                                                    style={{ color: "var(--mantine-color-mesa-4)", overflowWrap: "anywhere" }}
                                                                >
                                                                    {reference.asset.originalFileName} · Download
                                                                </a>
                                                            )}
                                                            <Text size="xs" c="dimmed" style={{ overflowWrap: "anywhere" }}>
                                                                {reference.asset.mimeType ?? "File"}
                                                                {reference.asset.sizeBytes !== null
                                                                    ? ` · ${reference.asset.sizeBytes.toLocaleString()} bytes`
                                                                    : ""}
                                                            </Text>
                                                        </Stack>
                                                    )}

                                                    {reference.content && (
                                                        <Stack gap={3}>
                                                            <Text
                                                                size="xs"
                                                                fw={600}
                                                                c="dimmed"
                                                            >
                                                                {getContentLabel(
                                                                    reference.kind,
                                                                )}
                                                            </Text>

                                                            <Text
                                                                size="sm"
                                                                style={{
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                    overflowWrap:
                                                                        "anywhere",
                                                                }}
                                                            >
                                                                {
                                                                    reference.content
                                                                }
                                                            </Text>
                                                        </Stack>
                                                    )}

                                                    <Textarea
                                                        label="Why it's relevant (optional)"
                                                        description="Your story-specific interpretation or a reminder of how this source helps reconstruct the story."
                                                        placeholder="What does this help establish, and what still needs checking?"
                                                        value={
                                                            association.contextNote
                                                        }
                                                        onChange={(event) =>
                                                            updateContextNote(
                                                                reference.id,
                                                                event
                                                                    .currentTarget
                                                                    .value,
                                                            )
                                                        }
                                                        minRows={2}
                                                        autosize
                                                    />
                                                </Stack>
                                            </Card>
                                        ),
                                    )}
                                </Stack>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    No references attached yet. Add an existing
                                    item from the library or create a new
                                    reference.
                                </Text>
                            )}
                        </Stack>
                    </Collapse>
                </Stack>
            </Card>

            <CreateReferenceMaterialModal
                opened={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreated={onReferenceCreated}
            />
        </>
    );
}