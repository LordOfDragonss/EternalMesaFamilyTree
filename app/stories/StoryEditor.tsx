"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Badge,
    Button,
    Group,
    Stack,
    Text,
} from "@mantine/core";
import { ArrowLeft, Save } from "lucide-react";
import classes from "./story-editor.module.css";
import { createStoryCollection, saveStory } from "./actions";
import StoryDetailsSection from "./components/StoryDetailsSection";
import StoryContentEditor from "./components/StoryContentEditor";
import RelatedArchiveRecordsSection from "./components/RelatedArchiveRecordsSection";
import ReferenceMaterialSection from "./components/ReferenceMaterialSection";
import EditorialNotesSection from "./components/EditorialNotesSection";
import {
    EMPTY_STORY_CONTENT,
    emptyStoryDateEndpoint,
    getInlineArchiveRecordKeys,
    type ArchiveRecord,
    type ArchiveRecordKey,
    type StoryDateEndpoint,
    type StoryDateTypeValue,
    type StoryEditorData,
    type StoryStatusValue,
    type StoryTiptapDocument,
    type ReferenceMaterialData,
    type StoryReferenceValue,
} from "./types";

type StoryEditorValues = Omit<StoryEditorData, "id">;

function getInitialValues(
    initialStory: StoryEditorData | null,
): StoryEditorValues {
    if (initialStory) {
        const { id: _id, ...values } = initialStory;
        return values;
    }

    return {
        title: "",
        summary: "",
        type: "Colony history",
        status: "Draft",
        content: EMPTY_STORY_CONTENT,
        dateType: "unknown",
        startDate: emptyStoryDateEndpoint(),
        endDate: emptyStoryDateEndpoint(),
        tags: [],
        collections: [],
        manualRelatedRecordKeys: [],
        references: [],
        editorialNotes: "",
        editorialComments: [],
    };
}

export default function StoryEditor({
    initialStory,
    initialAvailableCollections,
    availableArchiveRecords,
    initialAvailableReferences,
}: {
    initialStory: StoryEditorData | null;
    initialAvailableCollections: string[];
    availableArchiveRecords: ArchiveRecord[];
    initialAvailableReferences: ReferenceMaterialData[];
}) {
    const router = useRouter();

    const [values, setValues] = useState<StoryEditorValues>(
        () => getInitialValues(initialStory),
    );
    const [availableCollections, setAvailableCollections] = useState(
        initialAvailableCollections,
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(
        initialStory ? "All changes saved." : "",
    );
    const [saveError, setSaveError] = useState("");
    const [availableReferences, setAvailableReferences] = useState(
        initialAvailableReferences,
    );

    const inlineRelatedRecordKeys = useMemo(
        () => getInlineArchiveRecordKeys(values.content),
        [values.content],
    );

    function markChanged() {
        setSaveMessage("Unsaved changes");
        setSaveError("");
    }

    function updateValue<K extends keyof StoryEditorValues>(
        key: K,
        value: StoryEditorValues[K],
    ) {
        setValues((current) => ({
            ...current,
            [key]: value,
        }));

        markChanged();
    }

    function updateDate(
        key: "startDate" | "endDate",
        value: StoryDateEndpoint,
    ) {
        updateValue(key, value);
    }

    function handleReferenceCreated(
        reference: ReferenceMaterialData,
        contextNote: string,
    ) {
        setAvailableReferences((current) => {
            if (current.some((item) => item.id === reference.id)) {
                return current;
            }

            return [...current, reference].sort((a, b) =>
                a.title.localeCompare(b.title),
            );
        });

        updateValue("references", [
            ...values.references.filter(
                (item) => item.referenceId !== reference.id,
            ),
            { referenceId: reference.id, contextNote },
        ]);
    }

    async function handleCreateCollection(name: string) {
        const result = await createStoryCollection(name);

        if (result.ok) {
            setAvailableCollections((current) => {
                const exists = current.some(
                    (collection) =>
                        collection.toLocaleLowerCase() ===
                        result.name.toLocaleLowerCase(),
                );

                if (exists) return current;

                return [...current, result.name].sort((a, b) =>
                    a.localeCompare(b),
                );
            });
        }

        return result;
    }

    async function handleSave() {
        if (isSaving) return;

        setIsSaving(true);
        setSaveError("");
        setSaveMessage("Saving...");

        try {
            const { content, ...storyValues } = values;
            const result = await saveStory({
                id: initialStory?.id ?? null,
                ...storyValues,
                contentJson: JSON.stringify(content),
            });

            if (!result.ok) {
                setSaveError(result.error);
                setSaveMessage("Not saved");
                return;
            }

            setSaveMessage("Saved successfully.");

            if (initialStory === null) {
                router.replace(`/stories/${result.id}/edit`);
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save story:", error);
            setSaveError("Something went wrong while saving the story.");
            setSaveMessage("Not saved");
        } finally {
            setIsSaving(false);
        }
    }

    function handleManualRecordsChange(keys: ArchiveRecordKey[]) {
        updateValue("manualRelatedRecordKeys", keys);
    }

    return (
        <Stack
            gap="lg"
            className={classes.page}
            style={{
                maxWidth: 1200,
                width: "100%",
                marginInline: "auto",
            }}
        >
            <Button
                component="a"
                href="/stories"
                variant="subtle"
                color="gray"
                leftSection={<ArrowLeft size={16} />}
                style={{ alignSelf: "flex-start" }}
            >
                Back to Stories
            </Button>
            <Stack gap={4}>
                <Text fw={700} size="xl">
                    {initialStory ? "Edit story" : "Create story"}
                </Text>
                <Text c="dimmed" size="sm">
                    {initialStory
                        ? `Editing story #${initialStory.id}.`
                        : "Create a story for the colony archive."}
                </Text>
            </Stack>

            {saveError && (
                <Alert
                    color="red"
                    title="Unable to save story"
                    withCloseButton
                    onClose={() => setSaveError("")}
                >
                    {saveError}
                </Alert>
            )}

            <StoryDetailsSection
                title={values.title}
                summary={values.summary}
                type={values.type}
                status={values.status}
                dateType={values.dateType}
                startDate={values.startDate}
                endDate={values.endDate}
                tags={values.tags}
                collections={values.collections}
                availableCollections={availableCollections}
                onTitleChange={(value) => updateValue("title", value)}
                onSummaryChange={(value) => updateValue("summary", value)}
                onTypeChange={(value) => updateValue("type", value)}
                onStatusChange={(value: StoryStatusValue) =>
                    updateValue("status", value)
                }
                onDateTypeChange={(value: StoryDateTypeValue) =>
                    updateValue("dateType", value)
                }
                onStartDateChange={(value) => updateDate("startDate", value)}
                onEndDateChange={(value) => updateDate("endDate", value)}
                onTagsChange={(value) => updateValue("tags", value)}
                onCollectionsChange={(value) => updateValue("collections", value)}
                onCreateCollection={handleCreateCollection}
            />

            <RelatedArchiveRecordsSection
                records={availableArchiveRecords}
                manualRecordKeys={values.manualRelatedRecordKeys}
                inlineRecordKeys={inlineRelatedRecordKeys}
                onManualRecordKeysChange={handleManualRecordsChange}
            />

            <StoryContentEditor
                key={initialStory?.id ?? "new-story"}
                title={values.title}
                summary={values.summary}
                storyType={values.type}
                status={values.status}
                dateType={values.dateType}
                startDate={values.startDate}
                endDate={values.endDate}
                tags={values.tags}
                collections={values.collections}
                archiveRecords={availableArchiveRecords}
                initialContent={values.content as StoryTiptapDocument}
                onContentChange={(content) => updateValue("content", content)}
                editorialComments={values.editorialComments}
                onEditorialCommentsChange={(comments) =>
                    updateValue("editorialComments", comments)
                }
            />

            <ReferenceMaterialSection
                references={values.references}
                availableReferences={availableReferences}
                onReferencesChange={(references: StoryReferenceValue[]) =>
                    updateValue("references", references)
                }
                onReferenceCreated={handleReferenceCreated}
            />

            <EditorialNotesSection
                value={values.editorialNotes}
                onChange={(notes) => updateValue("editorialNotes", notes)}
            />

            <div className={classes.stickyActions}>
                <Group
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    className={classes.stickyActionsInner}
                >
                    <Group gap="xs">
                        <Badge
                            variant="light"
                            color={values.status === "Draft" ? "gray" : "teal"}
                        >
                            {values.status}
                        </Badge>
                        <Text size="sm" c="dimmed" role="status">
                            {saveMessage || "Ready to save changes."}
                        </Text>
                    </Group>
                    <Button
                        color="mesa"
                        leftSection={<Save size={16} />}
                        loading={isSaving}
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </Group>
            </div>
        </Stack>
    );
}
