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
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type GalleryImage = {
    id: number;
    imageURL: string;
    caption: string | null;
};

type LandmarkGalleryProps = {
    images: GalleryImage[];
    landmarkName: string;
    landmarkId: number;
    locationId: number;
};

export default function LandmarkGallery({
    images,
    landmarkName,
    landmarkId,
    locationId,
}: LandmarkGalleryProps) {
    const router = useRouter();

    const [selectedImage, setSelectedImage] =
        useState<GalleryImage | null>(null);

    const [editingImageId, setEditingImageId] =
        useState<number | null>(null);

    const [editingCaption, setEditingCaption] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    function startEditing(image: GalleryImage) {
        setEditingImageId(image.id);
        setEditingCaption(image.caption ?? "");
    }

    function cancelEditing() {
        setEditingImageId(null);
        setEditingCaption("");
    }

    async function saveCaption(imageId: number) {
        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `/api/locations/${locationId}/landmarks/${landmarkId}/gallery/${imageId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        caption:
                            editingCaption.trim() ||
                            null,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to save image caption"
                );
            }

            setEditingImageId(null);
            setEditingCaption("");
            router.refresh();
        } catch (error) {
            console.error(
                "Failed to save image caption:",
                error
            );
        } finally {
            setSaving(false);
        }
    }

    async function removeImage(imageId: number) {
        if (saving) {
            return;
        }

        if (
            !window.confirm(
                "Remove this image from the gallery?"
            )
        ) {
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `/api/locations/${locationId}/landmarks/${landmarkId}/gallery/${imageId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to remove image"
                );
            }

            if (selectedImage?.id === imageId) {
                setSelectedImage(null);
            }

            setEditingImageId(null);
            router.refresh();
        } catch (error) {
            console.error(
                "Failed to remove image:",
                error
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
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
                                        cursor: isEditing
                                            ? "default"
                                            : "pointer",
                                    }}
                                    aria-label={
                                        image.caption
                                            ? `View ${image.caption}`
                                            : `View ${landmarkName} image`
                                    }
                                >
                                    <Image
                                        src={`/api/images/${image.imageURL}`}
                                        alt={
                                            image.caption ??
                                            landmarkName
                                        }
                                        w="100%"
                                        style={{
                                            aspectRatio:
                                                "4 / 3",
                                            objectFit:
                                                "cover",
                                        }}
                                    />
                                </button>

                                <Tooltip label="Edit image">
                                    <ActionIcon
                                        onClick={() =>
                                            startEditing(
                                                image
                                            )
                                        }
                                        variant="filled"
                                        color="dark"
                                        size="md"
                                        aria-label="Edit image"
                                        style={{
                                            position:
                                                "absolute",
                                            top: 8,
                                            right: 8,
                                        }}
                                    >
                                        <Pencil
                                            size={16}
                                        />
                                    </ActionIcon>
                                </Tooltip>
                            </div>

                            {isEditing ? (
                                <Stack
                                    gap="xs"
                                    mt="xs"
                                >
                                    <TextInput
                                        value={
                                            editingCaption
                                        }
                                        onChange={(event) =>
                                            setEditingCaption(
                                                event
                                                    .currentTarget
                                                    .value
                                            )
                                        }
                                        placeholder="Image caption"
                                        size="sm"
                                        autoFocus
                                    />

                                    <Group
                                        gap="xs"
                                        justify="flex-end"
                                    >
                                        <Button
                                            size="xs"
                                            variant="subtle"
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
                                            size="xs"
                                            color="red"
                                            variant="subtle"
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

                                        <Button
                                            size="xs"
                                            color="mesa"
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
                                </Stack>
                            ) : (
                                image.caption && (
                                    <Text
                                        size="sm"
                                        c="dimmed"
                                        mt="xs"
                                    >
                                        {image.caption}
                                    </Text>
                                )
                            )}
                        </div>
                    );
                })}
            </SimpleGrid>

            <Modal
                opened={selectedImage !== null}
                onClose={() =>
                    setSelectedImage(null)
                }
                centered
                size="auto"
                padding="sm"
                title={
                    selectedImage?.caption ??
                    landmarkName
                }
            >
                {selectedImage && (
                    <Stack gap="sm">
                        <Image
                            src={`/api/images/${selectedImage.imageURL}`}
                            alt={
                                selectedImage.caption ??
                                landmarkName
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