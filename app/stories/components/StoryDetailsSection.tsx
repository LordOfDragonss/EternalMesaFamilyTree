"use client";

import { useState } from "react";
import {
    Badge,
    Button,
    Card,
    Collapse,
    Divider,
    Group,
    MultiSelect,
    SegmentedControl,
    Select,
    Stack,
    TagsInput,
    Text,
    TextInput,
    Textarea,
} from "@mantine/core";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    X,
} from "lucide-react";
import classes from "../story-editor.module.css";
import {
    STORY_TYPE_OPTIONS,
    formatStoryDate,
    type StoryDateEndpoint,
    type StoryDateTypeValue,
    type StoryStatusValue,
} from "../types";
import {
    type CreateStoryCollectionResult,
} from "../actions";
import StoryDateFields from "./StoryDateFields";

type StoryDetailsSectionProps = {
    title: string;
    summary: string;
    type: string;
    status: StoryStatusValue;
    dateType: StoryDateTypeValue;
    startDate: StoryDateEndpoint;
    endDate: StoryDateEndpoint;
    tags: string[];
    collections: string[];
    availableCollections: string[];
    onTitleChange: (value: string) => void;
    onSummaryChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    onStatusChange: (value: StoryStatusValue) => void;
    onDateTypeChange: (value: StoryDateTypeValue) => void;
    onStartDateChange: (value: StoryDateEndpoint) => void;
    onEndDateChange: (value: StoryDateEndpoint) => void;
    onTagsChange: (value: string[]) => void;
    onCollectionsChange: (value: string[]) => void;
    onCreateCollection: (
        name: string,
    ) => Promise<CreateStoryCollectionResult>;
};

export default function StoryDetailsSection({
    title,
    summary,
    type,
    status,
    dateType,
    startDate,
    endDate,
    tags,
    collections,
    availableCollections,
    onTitleChange,
    onSummaryChange,
    onTypeChange,
    onStatusChange,
    onDateTypeChange,
    onStartDateChange,
    onEndDateChange,
    onTagsChange,
    onCollectionsChange,
    onCreateCollection,
}: StoryDetailsSectionProps) {
    const [metadataCollapsed, setMetadataCollapsed] = useState(false);
    const [creatingCollection, setCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [collectionError, setCollectionError] = useState("");

    const dateDescription =
        dateType === "unknown"
            ? "Date unknown"
            : dateType === "range"
              ? `${formatStoryDate(startDate)} – ${formatStoryDate(endDate)}`
              : formatStoryDate(startDate);

    async function createCollection() {
        const name = newCollectionName.trim();

        if (!name || isCreatingCollection) return;

        setIsCreatingCollection(true);
        setCollectionError("");

        try {
            const result = await onCreateCollection(name);

            if (!result.ok) {
                setCollectionError(result.error);
                return;
            }

            const alreadySelected = collections.some(
                (collection) =>
                    collection.toLocaleLowerCase() ===
                    result.name.toLocaleLowerCase(),
            );

            if (!alreadySelected) {
                onCollectionsChange([...collections, result.name]);
            }

            setNewCollectionName("");
            setCreatingCollection(false);
        } catch (error) {
            console.error("Failed to create collection:", error);
            setCollectionError("The collection could not be created.");
        } finally {
            setIsCreatingCollection(false);
        }
    }

    return (
        <Card
            withBorder
            padding="lg"
            radius="md"
            className={classes.metadataCard}
        >
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Text fw={600}>Story details</Text>

                    <Group gap="xs" wrap="nowrap">
                        {!metadataCollapsed && (
                            <Badge
                                color={status === "Draft" ? "gray" : "teal"}
                                variant="light"
                            >
                                {status}
                            </Badge>
                        )}

                        <Button
                            variant="subtle"
                            color="mesa"
                            size="compact-sm"
                            rightSection={
                                metadataCollapsed ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronUp size={16} />
                                )
                            }
                            onClick={() =>
                                setMetadataCollapsed((collapsed) => !collapsed)
                            }
                            aria-expanded={!metadataCollapsed}
                        >
                            {metadataCollapsed ? "Show details" : "Hide details"}
                        </Button>
                    </Group>
                </Group>

                {metadataCollapsed && (
                    <Stack gap="xs">
                        <Group gap="xs" align="center">
                            <Text fw={600} lineClamp={2}>
                                {title || "Untitled story"}
                            </Text>

                            {type && (
                                <Badge variant="light" color="gray">
                                    {type}
                                </Badge>
                            )}

                            <Badge
                                color={status === "Draft" ? "gray" : "teal"}
                                variant="light"
                            >
                                {status}
                            </Badge>
                        </Group>

                        <Text size="sm" c="dimmed">
                            {dateDescription}
                        </Text>
                    </Stack>
                )}

                <Collapse expanded={!metadataCollapsed}>
                    <Stack gap="md">
                        <TextInput
                            label="Title"
                            value={title}
                            onChange={(event) =>
                                onTitleChange(event.currentTarget.value)
                            }
                            placeholder="Give this story a title"
                        />

                        <Textarea
                            label="Summary"
                            description="Optional. A short introduction for story listings."
                            value={summary}
                            onChange={(event) =>
                                onSummaryChange(event.currentTarget.value)
                            }
                            minRows={2}
                            autosize
                        />

                        <Group grow align="flex-start">
                            <Select
                                label="Story type"
                                data={STORY_TYPE_OPTIONS}
                                value={type}
                                onChange={(value) => {
                                    if (value) onTypeChange(value);
                                }}
                                allowDeselect={false}
                            />

                            <Stack gap={6}>
                                <Text fw={500} size="sm">
                                    Publication status
                                </Text>

                                <SegmentedControl
                                    fullWidth
                                    value={status}
                                    onChange={(value) => {
                                        if (
                                            value === "Draft" ||
                                            value === "Complete"
                                        ) {
                                            onStatusChange(value);
                                        }
                                    }}
                                    data={[
                                        { label: "Draft", value: "Draft" },
                                        { label: "Complete", value: "Complete" },
                                    ]}
                                    styles={{
                                        root: {
                                            backgroundColor: "#24201d",
                                        },
                                        indicator: {
                                            backgroundColor: "#A95728",
                                        },
                                        label: {
                                            color: "#d6d6d6",
                                        },
                                    }}
                                />
                            </Stack>
                        </Group>

                        <TagsInput
                            label="Tags"
                            description="Add tags to help categorize and find this story."
                            placeholder={
                                tags.length === 0
                                    ? "Type a tag and press Enter"
                                    : "Add another tag"
                            }
                            value={tags}
                            onChange={onTagsChange}
                            splitChars={[","]}
                            clearable
                        />

                        {creatingCollection ? (
                            <Stack gap="md">
                                <div>
                                    <Text fw={600}>Create new collection</Text>
                                    <Text size="xs" c="dimmed">
                                        Create a collection to group related stories together.
                                    </Text>
                                </div>

                                <TextInput
                                    label="Name"
                                    placeholder="Collection name"
                                    value={newCollectionName}
                                    onChange={(event) =>
                                        setNewCollectionName(
                                            event.currentTarget.value,
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            void createCollection();
                                        }
                                    }}
                                    required
                                />

                                {collectionError && (
                                    <Text size="sm" c="red">
                                        {collectionError}
                                    </Text>
                                )}

                                <Group>
                                    <Button
                                        type="button"
                                        variant="light"
                                        color="mesa"
                                        leftSection={<X size={16} />}
                                        disabled={isCreatingCollection}
                                        onClick={() => {
                                            setCreatingCollection(false);
                                            setNewCollectionName("");
                                            setCollectionError("");
                                        }}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="button"
                                        color="mesa"
                                        leftSection={<Plus size={16} />}
                                        loading={isCreatingCollection}
                                        disabled={!newCollectionName.trim()}
                                        onClick={() => void createCollection()}
                                    >
                                        Create collection
                                    </Button>
                                </Group>
                            </Stack>
                        ) : (
                            <Group
                                align="flex-end"
                                gap="sm"
                                wrap="nowrap"
                            >
                                <MultiSelect
                                    label="Collections"
                                    description="Group this story into one or more collections."
                                    placeholder={
                                        collections.length === 0
                                            ? "Select collections"
                                            : "Add another collection"
                                    }
                                    data={availableCollections}
                                    value={collections}
                                    onChange={onCollectionsChange}
                                    searchable
                                    clearable
                                    hidePickedOptions
                                    style={{ flex: 1, minWidth: 0 }}
                                />

                                <Button
                                    type="button"
                                    variant="light"
                                    color="mesa"
                                    leftSection={<Plus size={16} />}
                                    onClick={() => {
                                        setCreatingCollection(true);
                                        setCollectionError("");
                                    }}
                                    style={{
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Create collection
                                </Button>
                            </Group>
                        )}

                        <Divider my="md" />

                        <Stack gap="md">
                            <Text fw={500} size="sm">
                                Story date
                            </Text>

                            <SegmentedControl
                                fullWidth
                                value={dateType}
                                onChange={(value) => {
                                    if (
                                        value === "single" ||
                                        value === "range" ||
                                        value === "unknown"
                                    ) {
                                        onDateTypeChange(value);
                                    }
                                }}
                                data={[
                                    { label: "Single date", value: "single" },
                                    { label: "Date range", value: "range" },
                                    { label: "Unknown", value: "unknown" },
                                ]}
                                styles={{
                                    root: {
                                        backgroundColor: "#24201d",
                                    },
                                    indicator: {
                                        backgroundColor: "#A95728",
                                    },
                                    label: {
                                        color: "#d6d6d6",
                                    },
                                }}
                            />

                            {dateType !== "unknown" && (
                                <Stack gap="md">
                                    <StoryDateFields
                                        label={
                                            dateType === "range"
                                                ? "Start date"
                                                : "Date"
                                        }
                                        value={startDate}
                                        onChange={onStartDateChange}
                                    />

                                    {dateType === "range" && (
                                        <StoryDateFields
                                            label="End date"
                                            value={endDate}
                                            onChange={onEndDateChange}
                                        />
                                    )}
                                </Stack>
                            )}

                            <Text size="xs" c="dimmed">
                                Displayed date: {dateDescription}
                            </Text>
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Card>
    );
}