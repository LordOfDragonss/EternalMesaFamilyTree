"use client";

import {
    ActionIcon,
    Button,
    Badge,
    Group,
    Image,
    Modal,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";
import {
    Check,
    Pencil,
    Star,
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type GalleryImage = {
    id: number;
    imageURL: string;
    caption: string | null;
    order: number;
};

type RelicGalleryGridProps = {
    relicId: number;
    primaryImageURL: string | null;
    images: GalleryImage[];
};

export default function RelicGalleryGrid({
    relicId,
    primaryImageURL,
    images,
}: RelicGalleryGridProps) {
    const router = useRouter();

    const [selectedImage, setSelectedImage] =
        useState<GalleryImage | null>(null);

    const [editingImageId, setEditingImageId] =
        useState<number | null>(null);

    const [editedCaption, setEditedCaption] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    function startEditing(image: GalleryImage) {
        setEditingImageId(image.id);
        setEditedCaption(image.caption ?? "");
        setError(null);
    }

    function cancelEditing() {
        if (saving) {
            return;
        }

        setEditingImageId(null);
        setEditedCaption("");
        setError(null);
    }

    async function saveCaption(imageId: number) {
        if (saving) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/relics/${relicId}/gallery/${imageId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        caption:
                            editedCaption.trim() ||
                            null,
                    }),
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.error ??
                    "Failed to save image."
                );
            }

            setEditingImageId(null);
            setEditedCaption("");

            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to save image."
            );
        } finally {
            setSaving(false);
        }
    }

    async function removeImage(imageId: number) {
        if (saving) {
            return;
        }

        const confirmed = window.confirm(
            "Remove this image from the gallery?"
        );

        if (!confirmed) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/relics/${relicId}/gallery/${imageId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.error ??
                    "Failed to remove image."
                );
            }

            setEditingImageId(null);

            if (
                selectedImage?.id === imageId
            ) {
                setSelectedImage(null);
            }

            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to remove image."
            );
        } finally {
            setSaving(false);
        }
    }

    async function setPrimary(imageId: number) {
        if (saving) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/relics/${relicId}/gallery/${imageId}`,
                {
                    method: "PATCH",
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.error ??
                    "Failed to set primary image."
                );
            }

            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to set primary image."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            {error && (
                <Text c="red" size="sm">
                    {error}
                </Text>
            )}

            <SimpleGrid
                cols={{
                    base: 1,
                    sm: 2,
                    md: 3,
                }}
                spacing="md"
            >
                {images.map((image) => {
                    const isEditing =
                        editingImageId === image.id;

                    const isPrimary =
                        primaryImageURL ===
                        image.imageURL;

                    return (
                        <div key={image.id}>
                            <div
                                style={{
                                    position:
                                        "relative",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        !isEditing &&
                                        setSelectedImage(
                                            image
                                        )
                                    }
                                    style={{
                                        display:
                                            "block",
                                        width: "100%",
                                        padding: 0,
                                        border: 0,
                                        borderRadius:
                                            "var(--mantine-radius-md)",
                                        overflow:
                                            "hidden",
                                        background:
                                            "#111",
                                        cursor:
                                            isEditing
                                                ? "default"
                                                : "pointer",
                                    }}
                                    aria-label={
                                        image.caption
                                            ? `View ${image.caption}`
                                            : "View relic image"
                                    }
                                >
                                    <Image
                                        src={`/api/images/${image.imageURL}`}
                                        alt={
                                            image.caption ??
                                            "Relic image"
                                        }
                                        w="100%"
                                        h={220}
                                        fit="contain"
                                        style={{
                                            background:
                                                "#111",
                                        }}
                                    />
                                </button>

                                {isPrimary && (
                                    <Badge
                                        size="sm"
                                        color="mesa"
                                        variant="filled"
                                        style={{
                                            position: "absolute",
                                            left: 8,
                                            top: 8,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <Group gap={4}>
                                            <Star size={14} />
                                            <span>Primary</span>
                                        </Group>
                                    </Badge>
                                )}

                                {!isEditing && (
                                    <Group
                                        gap={4}
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                        }}
                                    >
                                        {!isPrimary && (
                                            <Tooltip label="Set as primary">
                                                <ActionIcon
                                                    type="button"
                                                    variant="filled"
                                                    color="mesa"
                                                    size="sm"
                                                    onClick={() =>
                                                        setPrimary(image.id)
                                                    }
                                                    loading={saving}
                                                    aria-label="Set as primary"
                                                >
                                                    <Star size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}

                                        <Tooltip label="Edit image">
                                            <ActionIcon
                                                type="button"
                                                variant="filled"
                                                color="mesa"
                                                size="sm"
                                                onClick={() =>
                                                    startEditing(image)
                                                }
                                                aria-label="Edit image"
                                            >
                                                <Pencil size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                )}
                            </div>

                            {isEditing ? (
                                <Stack
                                    gap="xs"
                                    mt="xs"
                                >
                                    <TextInput
                                        placeholder="Caption"
                                        value={
                                            editedCaption
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setEditedCaption(
                                                event
                                                    .currentTarget
                                                    .value
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                        autoFocus
                                    />

                                    <Group
                                        gap="xs"
                                        justify="space-between"
                                    >
                                        <Button
                                            type="button"
                                            variant="subtle"
                                            color="red"
                                            size="xs"
                                            leftSection={
                                                <Trash2
                                                    size={14}
                                                />
                                            }
                                            onClick={() =>
                                                removeImage(
                                                    image.id
                                                )
                                            }
                                            loading={
                                                saving
                                            }
                                        >
                                            Remove
                                        </Button>

                                        <Group gap="xs">

                                            <Button
                                                type="button"
                                                variant="subtle"
                                                color="gray"
                                                size="xs"
                                                leftSection={
                                                    <X
                                                        size={
                                                            14
                                                        }
                                                    />
                                                }
                                                onClick={
                                                    cancelEditing
                                                }
                                                disabled={
                                                    saving
                                                }
                                            >
                                                Cancel
                                            </Button>

                                            <Button
                                                type="button"
                                                color="mesa"
                                                size="xs"
                                                leftSection={
                                                    <Check
                                                        size={
                                                            14
                                                        }
                                                    />
                                                }
                                                onClick={() =>
                                                    saveCaption(
                                                        image.id
                                                    )
                                                }
                                                loading={
                                                    saving
                                                }
                                            >
                                                Save
                                            </Button>
                                        </Group>
                                    </Group>
                                </Stack>
                            ) : (
                                image.caption && (
                                    <Text
                                        size="sm"
                                        c="dimmed"
                                        mt="xs"
                                    >
                                        {
                                            image.caption
                                        }
                                    </Text>
                                )
                            )}
                        </div>
                    );
                })}
            </SimpleGrid>

            <Modal
                opened={
                    selectedImage !== null
                }
                onClose={() =>
                    setSelectedImage(null)
                }
                centered
                size="auto"
                padding="sm"
                title={
                    selectedImage?.caption ??
                    "Relic image"
                }
            >
                {selectedImage && (
                    <Stack gap="sm">
                        <Image
                            src={`/api/images/${selectedImage.imageURL}`}
                            alt={
                                selectedImage.caption ??
                                "Relic image"
                            }
                            fit="contain"
                            mah="80vh"
                        />

                        {selectedImage.caption && (
                            <Text
                                c="dimmed"
                                size="sm"
                            >
                                {
                                    selectedImage.caption
                                }
                            </Text>
                        )}
                    </Stack>
                )}
            </Modal>
        </>
    );
}