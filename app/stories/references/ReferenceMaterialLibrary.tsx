
"use client";

import { useMemo, useState } from "react";
import {
    ActionIcon,
    Alert,
    Anchor,
    Badge,
    Button,
    Card,
    Checkbox,
    Group,
    Image,
    Modal,
    Select,
    Stack,
    Text,
    TextInput,
    Textarea,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    AlertCircle,
    ArrowLeft,
    File as FileIcon,
    FileText,
    Image as ImageIcon,
    LibraryBig,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import type {
    ReferenceMaterialData,
    ReferenceMaterialKind,
} from "@/app/stories/types";
import CreateReferenceMaterialModal from "@/app/stories/components/CreateReferenceMaterialModal";
import DeleteButton from "@/app/components/DeleteButton";

type ReferenceStory = {
    id: number;
    title: string;
    contextNote: string | null;
};

type LibraryReference = ReferenceMaterialData & {
    stories: ReferenceStory[];
};

type Props = {
    initialReferences: LibraryReference[];
};

const KIND_OPTIONS = [
    { value: "IMAGE", label: "Screenshot / image" },
    { value: "TEXT", label: "Text reference" },
    { value: "FILE", label: "File attachment" },
    { value: "OTHER", label: "Other reference" },
];

function getKindLabel(kind: ReferenceMaterialKind) {
    return KIND_OPTIONS.find((option) => option.value === kind)?.label ?? kind;
}

function formatBytes(bytes: number | null) {
    if (bytes === null) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ReferenceIcon({
    kind,
    size = 20,
}: {
    kind: ReferenceMaterialKind;
    size?: number;
}) {
    if (kind === "IMAGE") return <ImageIcon size={size} />;
    if (kind === "TEXT") return <FileText size={size} />;
    if (kind === "FILE") return <FileIcon size={size} />;
    return <LibraryBig size={size} />;
}

export default function ReferenceMaterialLibrary({
    initialReferences,
}: Props) {
    const [references, setReferences] =
        useState<LibraryReference[]>(initialReferences);
    const [search, setSearch] = useState("");
    const [kindFilter, setKindFilter] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [selected, setSelected] = useState<LibraryReference | null>(null);
    const [editing, setEditing] = useState<LibraryReference | null>(null);
    const [deleting, setDeleting] = useState<LibraryReference | null>(null);

    const [editTitle, setEditTitle] = useState("");
    const [editKind, setEditKind] = useState<ReferenceMaterialKind>("OTHER");
    const [editSource, setEditSource] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editFile, setEditFile] = useState<File | null>(null);
    const [removeAttachment, setRemoveAttachment] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const filteredReferences = useMemo(() => {
        const query = search.trim().toLowerCase();

        return references.filter((reference) => {
            if (kindFilter && reference.kind !== kindFilter) return false;
            if (!query) return true;

            const searchableText = [
                reference.title,
                reference.source ?? "",
                reference.content ?? "",
                reference.asset?.originalFileName ?? "",
                ...reference.stories.map((story) => story.title),
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [references, search, kindFilter]);

    function openEdit(reference: LibraryReference) {
        setEditing(reference);
        setEditTitle(reference.title);
        setEditKind(reference.kind);
        setEditSource(reference.source ?? "");
        setEditContent(reference.content ?? "");
        setEditFile(null);
        setRemoveAttachment(false);
        setError("");
        setSelected(null);
    }

    function closeEdit() {
        if (isSaving) return;
        setEditing(null);
        setEditFile(null);
        setRemoveAttachment(false);
        setError("");
    }

    async function saveEdit() {
        if (!editing || isSaving || !editTitle.trim()) return;

        setIsSaving(true);
        setError("");

        try {
            const formData = new FormData();
            formData.set("title", editTitle.trim());
            formData.set("kind", editKind);
            formData.set("source", editSource);
            formData.set("content", editContent);
            formData.set("removeAttachment", String(removeAttachment));

            if (editFile) {
                formData.set("file", editFile);
            }

            const response = await fetch(
                `/api/stories/references/${editing.id}`,
                {
                    method: "PATCH",
                    body: formData,
                },
            );

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.reference) {
                setError(
                    typeof result?.error === "string"
                        ? result.error
                        : "The reference could not be updated.",
                );
                return;
            }

            const updatedReference =
                result.reference as ReferenceMaterialData;

            setReferences((current) =>
                current.map((reference) =>
                    reference.id === editing.id
                        ? { ...reference, ...updatedReference }
                        : reference,
                ),
            );

            setNotice("Reference updated.");
            setEditing(null);
            setEditFile(null);
            setRemoveAttachment(false);
        } catch (cause) {
            console.error("Failed to update reference:", cause);
            setError("Something went wrong while updating the reference.");
        } finally {
            setIsSaving(false);
        }
    }

    function handleCreated(reference: ReferenceMaterialData) {
        const libraryReference: LibraryReference = {
            ...reference,
            stories: [],
        };

        setReferences((current) =>
            [...current.filter((item) => item.id !== reference.id), libraryReference]
                .sort((a, b) => a.title.localeCompare(b.title)),
        );

        setNotice("Reference created.");
        setCreateOpen(false);
    }

    function openDetails(reference: LibraryReference) {
        setSelected(reference);
        setNotice("");
    }

    return (
        <Stack gap="xl">
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <div>
                    <Title order={1}>Reference library</Title>
                    <Text c="dimmed" mt={4}>
                        Reusable images, text, files, and other source material for your stories.
                    </Text>
                </div>

                <Group gap="xs">
                    <Tooltip label="Back to stories">
                        <ActionIcon
                            component="a"
                            href="/stories"
                            variant="subtle"
                            size="lg"
                            color="mesa"
                            aria-label="Back to stories"
                        >
                            <ArrowLeft size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Create reference">
                        <ActionIcon
                            variant="filled"
                            color="mesa"
                            size="lg"
                            aria-label="Create reference"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <Text c="dimmed" size="sm">
                Reusable images, text, files, and other source material for your
                stories.
            </Text>

            {(notice || (error && !editing)) && (
                <Alert
                    color={error && !editing ? "red" : "mesa"}
                    variant="light"
                    title={error && !editing
                        ? "Action could not be completed"
                        : "Changes saved"}
                    withCloseButton
                    onClose={() => {
                        setNotice("");
                        setError("");
                    }}
                >
                    {error && !editing ? error : notice}
                </Alert>
            )}

            <Group align="flex-end" grow>
                <TextInput
                    label="Search references"
                    placeholder="Search titles, sources, content, or stories..."
                    leftSection={<Search size={16} />}
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                />

                <Select
                    label="Reference type"
                    placeholder="All types"
                    clearable
                    data={KIND_OPTIONS}
                    value={kindFilter}
                    onChange={setKindFilter}
                />
            </Group>

            <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                    {filteredReferences.length}{" "}
                    {filteredReferences.length === 1 ? "reference" : "references"}
                </Text>
            </Group>

            {filteredReferences.length === 0 ? (
                <Card
                    withBorder
                    padding="xl"
                    radius="md"
                    bg="#161616"
                    style={{ borderColor: "#292929" }}
                >
                    <Stack align="center" gap="xs">
                        <LibraryBig size={28} color="#929292" />
                        <Text fw={500}>
                            {references.length === 0
                                ? "Your reference library is empty"
                                : "No references match your search"}
                        </Text>
                        <Text c="dimmed" size="sm" ta="center">
                            {references.length === 0
                                ? "Create a reference to start collecting source material for your stories."
                                : "Try a different search term or reference type."}
                        </Text>
                        {references.length === 0 && (
                            <Button
                                color="mesa"
                                leftSection={<Plus size={16} />}
                                onClick={() => setCreateOpen(true)}
                            >
                                Create reference
                            </Button>
                        )}
                    </Stack>
                </Card>
            ) : (
                <Stack gap="sm">

                    {filteredReferences.map((reference) => (
                        <Card
                            key={reference.id}
                            shadow="sm"
                            padding="md"
                            radius="md"
                            withBorder
                            bg="#161616"
                            style={{
                                borderColor: "#292929",
                                cursor: "pointer",
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`View reference: ${reference.title}`}
                            onClick={() => openDetails(reference)}
                            onKeyDown={(event) => {
                                if (
                                    event.target === event.currentTarget &&
                                    (event.key === "Enter" || event.key === " ")
                                ) {
                                    event.preventDefault();
                                    openDetails(reference);
                                }
                            }}
                        >
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                                <Group
                                    align="flex-start"
                                    gap="md"
                                    wrap="nowrap"
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <div style={{ color: "#e9904f", paddingTop: 2 }}>
                                        <ReferenceIcon kind={reference.kind} size={22} />
                                    </div>

                                    <Stack gap={5} style={{ minWidth: 0, flex: 1 }}>
                                        <Group gap="xs" align="center" wrap="wrap">
                                            <Text
                                                fw={600}
                                                style={{ overflowWrap: "anywhere" }}
                                            >
                                                {reference.title}
                                            </Text>
                                            <Badge variant="light" color="gray">
                                                {getKindLabel(reference.kind)}
                                            </Badge>
                                        </Group>

                                        {reference.source && (
                                            <Text size="sm" c="dimmed" lineClamp={1}>
                                                {reference.source}
                                            </Text>
                                        )}

                                        {reference.content && (
                                            <Text size="sm" c="dimmed" lineClamp={2}>
                                                {reference.content}
                                            </Text>
                                        )}

                                        {reference.asset && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                Attachment: {reference.asset.originalFileName}
                                                {formatBytes(reference.asset.sizeBytes)
                                                    ? ` · ${formatBytes(reference.asset.sizeBytes)}`
                                                    : ""}
                                            </Text>
                                        )}

                                        <Group gap="xs" mt={2}>
                                            <Badge variant="outline" color="gray">
                                                {reference.stories.length}{" "}
                                                {reference.stories.length === 1
                                                    ? "connected story"
                                                    : "connected stories"}
                                            </Badge>
                                            <Text size="xs" c="dimmed">
                                                Select to view details
                                            </Text>
                                        </Group>
                                    </Stack>
                                </Group>

                                <Group
                                    gap={4}
                                    wrap="nowrap"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <Tooltip label="Edit reference">
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            aria-label={`Edit ${reference.title}`}
                                            onClick={() => openEdit(reference)}
                                        >
                                            <Pencil size={16} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <DeleteButton
                                        action={`/api/stories/references/${reference.id}/delete`}
                                        name={reference.title}
                                        type="Reference"
                                    />
                                </Group>
                            </Group>
                        </Card>
                    ))}

                </Stack>
            )}

            <CreateReferenceMaterialModal
                opened={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(reference, _contextNote) => handleCreated(reference)}
            />

            <Modal
                opened={selected !== null}
                onClose={() => setSelected(null)}
                title={
                    selected ? (
                        <Group gap="sm" wrap="nowrap">
                            <div style={{ color: "#e9904f" }}>
                                <ReferenceIcon kind={selected.kind} />
                            </div>
                            <Text fw={600} style={{ overflowWrap: "anywhere" }}>
                                {selected.title}
                            </Text>
                        </Group>
                    ) : null
                }
                centered
                size="xl"
                scrollAreaComponent={undefined}
            >
                {selected && (
                    <Stack gap="md">
                        <Group justify="space-between" align="center">
                            <Badge variant="light" color="gray">
                                {getKindLabel(selected.kind)}
                            </Badge>
                            <Group gap="xs">
                                <Tooltip label="Edit reference">
                                    <ActionIcon
                                        variant="subtle"
                                        color="mesa"
                                        size="lg"
                                        aria-label="Edit reference"
                                        onClick={() => openEdit(selected)}
                                    >
                                        <Pencil size={17} />
                                    </ActionIcon>
                                </Tooltip>

                                <DeleteButton
                                    action={`/api/stories/references/${selected.id}/delete`}
                                    name={selected.title}
                                    type="Reference"
                                />

                            </Group>
                        </Group>

                        {selected.asset && selected.kind === "IMAGE" && (
                            <Image
                                src={`/api/stories/assets/${selected.asset.id}`}
                                alt={selected.title}
                                fit="contain"
                                mah={460}
                                radius="md"
                                bg="#111"
                            />
                        )}

                        {selected.source && (
                            <Stack gap={4}>
                                <Text size="sm" fw={600}>Source / identifier</Text>
                                <Text style={{ overflowWrap: "anywhere" }}>
                                    {selected.source}
                                </Text>
                            </Stack>
                        )}

                        {selected.content && (
                            <Stack gap={4}>
                                <Text size="sm" fw={600}>
                                    {selected.kind === "IMAGE"
                                        ? "Caption / description"
                                        : selected.kind === "FILE"
                                            ? "File description"
                                            : "Details"}
                                </Text>
                                <Text style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                    {selected.content}
                                </Text>
                            </Stack>
                        )}

                        {selected.asset && (
                            <Card
                                withBorder
                                padding="sm"
                                radius="md"
                                bg="#111"
                                style={{ borderColor: "#292929" }}
                            >
                                <Group justify="space-between" align="center" wrap="wrap">
                                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                                        <FileIcon size={20} />
                                        <Stack gap={2} style={{ minWidth: 0 }}>
                                            <Text fw={500} size="sm" style={{ overflowWrap: "anywhere" }}>
                                                {selected.asset.originalFileName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {selected.asset.mimeType ?? "Unknown file type"}
                                                {formatBytes(selected.asset.sizeBytes)
                                                    ? ` · ${formatBytes(selected.asset.sizeBytes)}`
                                                    : ""}
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <Anchor
                                        href={`/api/stories/assets/${selected.asset.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open attachment
                                    </Anchor>
                                </Group>
                            </Card>
                        )}

                        <Stack gap="xs">
                            <Title order={4}>Connected stories</Title>
                            {selected.stories.length === 0 ? (
                                <Text size="sm" c="dimmed">
                                    This reference is not connected to any stories yet.
                                </Text>
                            ) : (
                                <Stack gap="sm">
                                    {selected.stories.map((story) => (
                                        <Card
                                            key={story.id}
                                            withBorder
                                            padding="sm"
                                            radius="md"
                                            bg="#161616"
                                            style={{ borderColor: "#292929" }}
                                        >
                                            <Stack gap={4}>
                                                <Anchor
                                                    href={`/stories/${story.id}`}
                                                    fw={500}
                                                >
                                                    {story.title}
                                                </Anchor>
                                                {story.contextNote && (
                                                    <Text
                                                        size="sm"
                                                        c="dimmed"
                                                        style={{ whiteSpace: "pre-wrap" }}
                                                    >
                                                        {story.contextNote}
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </Stack>
                )}
            </Modal>

            <Modal
                opened={editing !== null}
                onClose={closeEdit}
                title="Edit reference"
                centered
                size="lg"
                closeOnClickOutside={!isSaving}
                closeOnEscape={!isSaving}
            >
                <Stack gap="md">
                    {error && (
                        <Alert color="red" title="Unable to update reference">
                            {error}
                        </Alert>
                    )}

                    <Select
                        label="Reference type"
                        data={KIND_OPTIONS}
                        value={editKind}
                        onChange={(value) => {
                            if (
                                value === "IMAGE" ||
                                value === "TEXT" ||
                                value === "FILE" ||
                                value === "OTHER"
                            ) {
                                setEditKind(value);
                                setEditFile(null);
                            }
                        }}
                        allowDeselect={false}
                        disabled={isSaving}
                    />

                    <TextInput
                        label="Title"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.currentTarget.value)}
                        required
                        disabled={isSaving}
                    />

                    <TextInput
                        label="Source / identifier"
                        value={editSource}
                        onChange={(event) => setEditSource(event.currentTarget.value)}
                        disabled={isSaving}
                    />

                    <Textarea
                        label="Content / description"
                        value={editContent}
                        onChange={(event) => setEditContent(event.currentTarget.value)}
                        minRows={3}
                        autosize
                        disabled={isSaving}
                    />

                    {editing?.asset && (
                        <Card
                            withBorder
                            padding="sm"
                            radius="md"
                            bg="#111"
                            style={{ borderColor: "#292929" }}
                        >
                            <Group justify="space-between" align="center">
                                <Stack gap={2} style={{ minWidth: 0 }}>
                                    <Text size="sm" fw={500} style={{ overflowWrap: "anywhere" }}>
                                        {editing.asset.originalFileName}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Current attachment
                                    </Text>
                                </Stack>
                                <Checkbox
                                    label="Remove"
                                    checked={removeAttachment}
                                    onChange={(event) =>
                                        setRemoveAttachment(event.currentTarget.checked)
                                    }
                                    disabled={isSaving || Boolean(editFile)}
                                />
                            </Group>
                        </Card>
                    )}

                    {(editKind === "IMAGE" || editKind === "FILE") && (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>
                                {editKind === "IMAGE" ? "Replace image" : "Replace attachment"}
                            </Text>
                            <input
                                type="file"
                                accept={editKind === "IMAGE" ? "image/*" : undefined}
                                aria-label={
                                    editKind === "IMAGE"
                                        ? "Replace reference image"
                                        : "Replace reference attachment"
                                }
                                disabled={isSaving}
                                onChange={(event) => {
                                    const file = event.currentTarget.files?.[0] ?? null;

                                    if (
                                        file &&
                                        editKind === "IMAGE" &&
                                        !file.type.startsWith("image/")
                                    ) {
                                        setError("Choose an image file for an image reference.");
                                        setEditFile(null);
                                    } else {
                                        setError("");
                                        setEditFile(file);
                                        if (file) setRemoveAttachment(false);
                                    }

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
                            {editFile && (
                                <Group justify="space-between">
                                    <Text size="sm" style={{ overflowWrap: "anywhere" }}>
                                        {editFile.name}
                                    </Text>
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        aria-label="Remove selected replacement file"
                                        onClick={() => setEditFile(null)}
                                        disabled={isSaving}
                                    >
                                        <X size={16} />
                                    </ActionIcon>
                                </Group>
                            )}
                        </Stack>
                    )}

                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={closeEdit}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="mesa"
                            onClick={saveEdit}
                            loading={isSaving}
                            disabled={!editTitle.trim()}
                        >
                            Save changes
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
