"use client";

import {
    Button,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import {
    Check,
    ImagePlus,
    X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NewImage = {
    id: string;
    file: File;
    preview: string;
    caption: string;
};

type LocationGalleryAddProps = {
    locationId: number;
};

export default function LocationGalleryAdd({
    locationId,
}: LocationGalleryAddProps) {
    const router = useRouter();

    const inputRef =
        useRef<HTMLInputElement>(null);

    const [opened, setOpened] =
        useState(false);

    const [images, setImages] =
        useState<NewImage[]>([]);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    function openModal() {
        setError(null);
        setOpened(true);
    }

    function closeModal() {
        if (saving) {
            return;
        }

        for (const image of images) {
            URL.revokeObjectURL(
                image.preview
            );
        }

        setImages([]);
        setError(null);
        setOpened(false);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function handleFiles(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const files = Array.from(
            event.target.files ?? []
        ).filter((file) =>
            file.type.startsWith("image/")
        );

        if (files.length === 0) {
            return;
        }

        const newImages = files.map(
            (file) => ({
                id: crypto.randomUUID(),
                file,
                preview:
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

    function removeNewImage(
        id: string
    ) {
        setImages((current) => {
            const image =
                current.find(
                    (image) =>
                        image.id === id
                );

            if (image) {
                URL.revokeObjectURL(
                    image.preview
                );
            }

            return current.filter(
                (image) =>
                    image.id !== id
            );
        });
    }

    async function saveImages() {
        if (
            saving ||
            images.length === 0
        ) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const formData =
                new FormData();

            for (const image of images) {
                formData.append(
                    "locationImages",
                    image.file
                );

                formData.append(
                    "imageCaptions[]",
                    image.caption
                );
            }

            const response =
                await fetch(
                    `/api/locations/${locationId}/gallery`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.error ??
                    "Failed to add images."
                );
            }

            for (const image of images) {
                URL.revokeObjectURL(
                    image.preview
                );
            }

            setImages([]);
            setOpened(false);

            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to add images."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="subtle"
                color="mesa"
                leftSection={
                    <ImagePlus
                        size={16}
                    />
                }
                onClick={openModal}
            >
                Add Images
            </Button>

            <Modal
                opened={opened}
                onClose={closeModal}
                title="Add Images"
                centered
                size="lg"
            >
                <Stack gap="md">
                    <Button
                        type="button"
                        variant="default"
                        onClick={() =>
                            inputRef.current?.click()
                        }
                    >
                        Choose Images
                    </Button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={
                            handleFiles
                        }
                    />

                    {images.length ===
                    0 ? (
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
                                        <div
                                            style={{
                                                width: 140,
                                                height: 100,
                                                flexShrink: 0,
                                                borderRadius:
                                                    "var(--mantine-radius-md)",
                                                overflow:
                                                    "hidden",
                                                backgroundColor:
                                                    "#111",
                                            }}
                                        >
                                            <img
                                                src={
                                                    image.preview
                                                }
                                                alt="New location image"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit:
                                                        "cover",
                                                }}
                                            />
                                        </div>

                                        <TextInput
                                            style={{
                                                flex: 1,
                                            }}
                                            placeholder="Caption"
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
                                        />

                                        <Button
                                            type="button"
                                            variant="subtle"
                                            color="red"
                                            px="xs"
                                            onClick={() =>
                                                removeNewImage(
                                                    image.id
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            aria-label="Remove selected image"
                                        >
                                            <X
                                                size={
                                                    16
                                                }
                                            />
                                        </Button>
                                    </Group>
                                )
                            )}
                        </Stack>
                    )}

                    {error && (
                        <Text
                            c="red"
                            size="sm"
                        >
                            {error}
                        </Text>
                    )}

                    <Group justify="flex-end">
                        <Button
                            type="button"
                            variant="subtle"
                            color="gray"
                            leftSection={
                                <X
                                    size={16}
                                />
                            }
                            onClick={
                                closeModal
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
                            leftSection={
                                <Check
                                    size={16}
                                />
                            }
                            onClick={
                                saveImages
                            }
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