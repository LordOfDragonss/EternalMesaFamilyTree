"use client";

import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Group,
    Modal,
    Select,
    Stack,
    Text,
    TextInput,
    Textarea,
} from "@mantine/core";
import { Plus } from "lucide-react";
import type {
    ReferenceMaterialData,
    ReferenceMaterialKind,
} from "../types";

type Props = {
    opened: boolean;
    onClose: () => void;
    onCreated: (
        reference: ReferenceMaterialData,
        contextNote: string,
    ) => void;
};

const KIND_OPTIONS = [
    { value: "IMAGE", label: "Screenshot / image" },
    { value: "TEXT", label: "Text reference" },
    { value: "FILE", label: "File attachment" },
    { value: "OTHER", label: "Other reference" },
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreateReferenceMaterialModal({
    opened,
    onClose,
    onCreated,
}: Props) {
    const [kind, setKind] = useState<ReferenceMaterialKind>("IMAGE");
    const [title, setTitle] = useState("");
    const [source, setSource] = useState("");
    const [content, setContent] = useState("");
    const [contextNote, setContextNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!file || kind !== "IMAGE") {
            setImagePreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file, kind]);

    function resetForm() {
        setKind("IMAGE");
        setTitle("");
        setSource("");
        setContent("");
        setContextNote("");
        setFile(null);
        setError("");
        setIsCreating(false);
    }

    function closeModal() {
        if (isCreating) return;
        resetForm();
        onClose();
    }

    function changeKind(value: string | null) {
        if (
            value !== "IMAGE" &&
            value !== "TEXT" &&
            value !== "FILE" &&
            value !== "OTHER"
        ) {
            return;
        }

        setKind(value);
        setFile(null);
        setError("");
    }

    function chooseFile(nextFile: File | null) {
        if (nextFile && kind === "IMAGE" && !nextFile.type.startsWith("image/")) {
            setError("Choose an image file for a screenshot / image reference.");
            setFile(null);
            return;
        }

        setError("");
        setFile(nextFile);
    }

    async function handleCreate() {
        if (isCreating || !title.trim()) return;

        if (file && kind === "IMAGE" && !file.type.startsWith("image/")) {
            setError("Choose an image file for a screenshot / image reference.");
            return;
        }

        setIsCreating(true);
        setError("");

        try {
            const formData = new FormData();
            formData.set("title", title.trim());
            formData.set("kind", kind);
            formData.set("source", source);
            formData.set("content", content);
            if (file) formData.set("file", file);

            const response = await fetch("/api/stories/references", {
                method: "POST",
                body: formData,
            });
            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.reference) {
                setError(
                    typeof result?.error === "string"
                        ? result.error
                        : "The reference could not be created.",
                );
                return;
            }

            onCreated(result.reference as ReferenceMaterialData, contextNote.trim());
            resetForm();
            onClose();
        } catch (cause) {
            console.error("Failed to create reference:", cause);
            setError("Something went wrong while creating the reference.");
        } finally {
            setIsCreating(false);
        }
    }

    const isImage = kind === "IMAGE";
    const isFile = kind === "FILE";

    return (
        <Modal
            opened={opened}
            onClose={closeModal}
            title="Create a reference"
            centered
            size="lg"
            closeOnClickOutside={!isCreating}
            closeOnEscape={!isCreating}
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Create a reusable source in the reference library and attach it
                    to this story. The source material and your story-specific
                    contextual note are kept separate.
                </Text>

                {error && (
                    <Alert color="red" title="Unable to create reference">
                        {error}
                    </Alert>
                )}

                <Select
                    label="Reference type"
                    data={KIND_OPTIONS}
                    value={kind}
                    onChange={changeKind}
                    allowDeselect={false}
                    disabled={isCreating}
                />

                <TextInput
                    label="Title"
                    placeholder={
                        isImage
                            ? "e.g. Predatus shortly after founding"
                            : kind === "TEXT"
                              ? "e.g. Founding entry in colony notes"
                              : isFile
                                ? "e.g. Original colony save"
                                : "Give this reference a useful title"
                    }
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                    required
                    autoFocus
                    disabled={isCreating}
                />

                <TextInput
                    label="Source / identifier (optional)"
                    placeholder={
                        isImage
                            ? "Where the screenshot came from"
                            : kind === "TEXT"
                              ? "Where this reference came from"
                              : isFile
                                ? "Original filename or source"
                                : "Any useful source or identifying details"
                    }
                    value={source}
                    onChange={(event) => setSource(event.currentTarget.value)}
                    disabled={isCreating}
                />

                {(isImage || isFile) && (
                    <Stack gap="xs">
                        <Text size="sm" fw={500}>
                            {isImage ? "Choose an image (optional)" : "Choose a file (optional)"}
                        </Text>
                        <input
                            type="file"
                            accept={isImage ? "image/*" : undefined}
                            aria-label={isImage ? "Choose a reference image" : "Choose a reference file"}
                            disabled={isCreating}
                            onChange={(event) => {
                                chooseFile(event.currentTarget.files?.[0] ?? null);
                                // Allows selecting the same file again after removing it.
                                event.currentTarget.value = "";
                            }}
                            style={{
                                width: "100%",
                                padding: 10,
                                border: "1px solid #393939",
                                borderRadius: 6,
                                background: "#191919",
                                color: "#d6d6d6",
                            }}
                        />

                        {file && (
                            <Card
                                withBorder
                                padding="sm"
                                radius="md"
                                bg="#111"
                                style={{ borderColor: "#292929" }}
                            >
                                <Stack gap="xs">
                                    {isImage && imagePreviewUrl && (
                                        <img
                                            src={imagePreviewUrl}
                                            alt={title.trim() || file.name}
                                            style={{
                                                display: "block",
                                                maxWidth: "100%",
                                                maxHeight: 220,
                                                objectFit: "contain",
                                                margin: "0 auto",
                                                borderRadius: 6,
                                            }}
                                        />
                                    )}
                                    <Text size="sm" fw={500} style={{ overflowWrap: "anywhere" }}>
                                        {file.name}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {file.type || "Unknown file type"} · {formatFileSize(file.size)}
                                    </Text>
                                    <Group justify="flex-end">
                                        <Button
                                            variant="subtle"
                                            color="gray"
                                            size="compact-sm"
                                            onClick={() => setFile(null)}
                                            disabled={isCreating}
                                        >
                                            Remove file
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        )}
                    </Stack>
                )}

                <Textarea
                    label={
                        isImage
                            ? "Caption / description"
                            : isFile
                              ? "File description (optional)"
                              : kind === "TEXT"
                                ? "Source excerpt / details"
                                : "Details (optional)"
                    }
                    placeholder={
                        isImage
                            ? "What does the screenshot show?"
                            : isFile
                              ? "What is this file, and which part is relevant?"
                              : kind === "TEXT"
                                ? "Paste a relevant excerpt, record an identifying detail, or describe the source..."
                                : "Describe this reference and why you're keeping it..."
                    }
                    value={content}
                    onChange={(event) => setContent(event.currentTarget.value)}
                    minRows={3}
                    autosize
                    disabled={isCreating}
                />

                <Textarea
                    label="Why it's relevant (optional)"
                    description="This note belongs to this story, not to the reusable reference itself."
                    placeholder="What does this help establish, and what still needs checking?"
                    value={contextNote}
                    onChange={(event) => setContextNote(event.currentTarget.value)}
                    minRows={2}
                    autosize
                    disabled={isCreating}
                />

                <Group justify="flex-end">
                    <Button
                        variant="subtle"
                        color="gray"
                        onClick={closeModal}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="mesa"
                        leftSection={<Plus size={16} />}
                        onClick={handleCreate}
                        loading={isCreating}
                        disabled={!title.trim()}
                    >
                        Create and attach
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
