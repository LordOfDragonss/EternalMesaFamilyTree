"use client";

import {
    ActionIcon,
    Button,
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
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type GalleryImage = {
    id: number;
    imageURL: string;
    caption: string | null;
};

type LocationGalleryGridProps = {
    locationId: number;
    images: GalleryImage[];
};

export default function LocationGalleryGrid({
    locationId,
    images,
}: LocationGalleryGridProps) {
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
                `/api/locations/${locationId}/gallery/${imageId}`,
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
                `/api/locations/${locationId}/gallery/${imageId}`,
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

    return (
        <>
            {error && (
                <Text
                    c="red"
                    size="sm"
                >
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
                        editingImageId ===
                        image.id;

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
                                            : "View location image"
                                    }
                                >
                                    <Image
                                        src={`/api/images/${image.imageURL}`}
                                        alt={
                                            image.caption ??
                                            "Location image"
                                        }
                                        w="100%"
                                        h="auto"
                                        style={{
                                            aspectRatio:
                                                "4 / 3",
                                            objectFit:
                                                "cover",
                                        }}
                                    />
                                </button>

                                {!isEditing && (
                                    <Tooltip label="Edit image">
                                        <ActionIcon
                                            type="button"
                                            variant="filled"
                                            color="mesa"
                                            size="sm"
                                            onClick={() =>
                                                startEditing(
                                                    image
                                                )
                                            }
                                            aria-label="Edit image"
                                            style={{
                                                position:
                                                    "absolute",
                                                top: 8,
                                                right: 8,
                                            }}
                                        >
                                            <Pencil
                                                size={
                                                    14
                                                }
                                            />
                                        </ActionIcon>
                                    </Tooltip>
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
                                                    size={
                                                        14
                                                    }
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
                    "Location image"
                }
            >
                {selectedImage && (
                    <Stack gap="sm">
                        <Image
                            src={`/api/images/${selectedImage.imageURL}`}
                            alt={
                                selectedImage.caption ??
                                "Location image"
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