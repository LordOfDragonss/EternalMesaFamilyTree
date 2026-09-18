"use client";

import {
    Button,
    Group,
    Image,
    Modal,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PendingImage = {
    id: string;
    file: File;
    previewURL: string;
    caption: string;
};

type LandmarkGalleryAddProps = {
    locationId: number;
    landmarkId: number;
};

export default function LandmarkGalleryAdd({
    locationId,
    landmarkId,
}: LandmarkGalleryAddProps) {
    const router = useRouter();

    const [opened, setOpened] =
        useState(false);

    const [images, setImages] =
        useState<PendingImage[]>([]);

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {
        return () => {
            images.forEach((image) =>
                URL.revokeObjectURL(
                    image.previewURL
                )
            );
        };
    }, [images]);

    function handleFiles(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const files = Array.from(
            event.target.files ?? []
        ).filter((file) =>
            file.type.startsWith("image/")
        );

        const newImages = files.map(
            (file) => ({
                id: crypto.randomUUID(),
                file,
                previewURL:
                    URL.createObjectURL(file),
                caption: "",
            })
        );

        setImages((current) => [
            ...current,
            ...newImages,
        ]);

        event.target.value = "";
    }

    function updateCaption(
        id: string,
        caption: string
    ) {
        setImages((current) =>
            current.map((image) =>
                image.id === id
                    ? {
                          ...image,
                          caption,
                      }
                    : image
            )
        );
    }

    function removeImage(id: string) {
        setImages((current) => {
            const image = current.find(
                (item) => item.id === id
            );

            if (image) {
                URL.revokeObjectURL(
                    image.previewURL
                );
            }

            return current.filter(
                (item) => item.id !== id
            );
        });
    }

    function closeModal() {
        if (saving) {
            return;
        }

        images.forEach((image) =>
            URL.revokeObjectURL(
                image.previewURL
            )
        );

        setImages([]);
        setOpened(false);
    }

    async function saveImages() {
        if (
            saving ||
            images.length === 0
        ) {
            return;
        }

        setSaving(true);

        try {
            const formData = new FormData();

            images.forEach((image) => {
                formData.append(
                    "landmarkImages",
                    image.file
                );

                formData.append(
                    "newImageCaptions[]",
                    image.caption
                );
            });

            const response = await fetch(
                `/api/locations/${locationId}/landmarks/${landmarkId}/gallery`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to add landmark images"
                );
            }

            images.forEach((image) =>
                URL.revokeObjectURL(
                    image.previewURL
                )
            );

            setImages([]);
            setOpened(false);

            router.refresh();
        } catch (error) {
            console.error(
                "Failed to add landmark images:",
                error
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Button
                leftSection={<Plus size={16} />}
                color="mesa"
                variant="light"
                onClick={() =>
                    setOpened(true)
                }
            >
                Add Images
            </Button>

            <Modal
                opened={opened}
                onClose={closeModal}
                centered
                size="lg"
                title="Add Images"
            >
                <Stack gap="md">
                    <Button
                        component="label"
                        variant="default"
                        disabled={saving}
                    >
                        Select Images
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={
                                handleFiles
                            }
                        />
                    </Button>

                    {images.length === 0 ? (
                        <Text
                            c="dimmed"
                            size="sm"
                        >
                            No images selected.
                        </Text>
                    ) : (
                        <Stack gap="md">
                            {images.map(
                                (image) => (
                                    <Group
                                        key={
                                            image.id
                                        }
                                        align="flex-start"
                                        wrap="nowrap"
                                    >
                                        <Image
                                            src={
                                                image.previewURL
                                            }
                                            alt=""
                                            w={140}
                                            h={100}
                                            fit="cover"
                                            radius="md"
                                        />

                                        <Stack
                                            gap="xs"
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            <TextInput
                                                label="Caption"
                                                placeholder="Image caption"
                                                value={
                                                    image.caption
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateCaption(
                                                        image.id,
                                                        event
                                                            .currentTarget
                                                            .value
                                                    )
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

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
                                                disabled={
                                                    saving
                                                }
                                                style={{
                                                    alignSelf:
                                                        "flex-start",
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </Stack>
                                    </Group>
                                )
                            )}
                        </Stack>
                    )}

                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            onClick={
                                closeModal
                            }
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="mesa"
                            onClick={saveImages}
                            loading={saving}
                            disabled={
                                images.length ===
                                0
                            }
                        >
                            Save Images
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}