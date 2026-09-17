"use client";

import {
    ActionIcon,
    Group,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";
import { X } from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
} from "react";

type ExistingImage = {
    id: number;
    imageURL: string;
    caption: string | null;
};

type LocationLandmarkImageUploadProps = {
    existingImages?: ExistingImage[];
};

type NewImage = {
    id: string;
    file: File;
    preview: string;
    caption: string;
};

export default function LocationLandmarkImageUpload({
    existingImages = [],
}: LocationLandmarkImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [images, setImages] = useState<NewImage[]>([]);
    const [removedImages, setRemovedImages] =
        useState<number[]>([]);

    const [captions, setCaptions] =
        useState<Record<number, string>>(
            Object.fromEntries(
                existingImages.map((image) => [
                    image.id,
                    image.caption ?? "",
                ])
            )
        );

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const files = Array.from(
            event.target.files ?? []
        );

        if (files.length === 0) {
            return;
        }

        const newImages = files
            .filter((file) =>
                file.type.startsWith("image/")
            )
            .map((file) => ({
                id: crypto.randomUUID(),
                file,
                preview: URL.createObjectURL(file),
                caption: "",
            }));

        setImages((current) => [
            ...current,
            ...newImages,
        ]);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function removeNewImage(id: string) {
        setImages((current) => {
            const image = current.find(
                (image) => image.id === id
            );

            if (image) {
                URL.revokeObjectURL(
                    image.preview
                );
            }

            return current.filter(
                (image) => image.id !== id
            );
        });
    }

    function removeExistingImage(id: number) {
        setRemovedImages((current) =>
            current.includes(id)
                ? current
                : [...current, id]
        );
    }

    function updateNewCaption(
        id: string,
        caption: string
    ) {
        setImages((current) =>
            current.map((image) =>
                image.id === id
                    ? { ...image, caption }
                    : image
            )
        );
    }

    function updateExistingCaption(
        id: number,
        caption: string
    ) {
        setCaptions((current) => ({
            ...current,
            [id]: caption,
        }));
    }

    useEffect(() => {
        const input = inputRef.current;
        const form = input?.form;

        if (!form) {
            return;
        }

        function handleSubmit() {
            if (!input) {
                return;
            }

            const dataTransfer = new DataTransfer();

            for (const image of images) {
                dataTransfer.items.add(
                    image.file
                );
            }

            input.files =
                dataTransfer.files;
        }

        form.addEventListener(
            "submit",
            handleSubmit
        );

        return () => {
            form.removeEventListener(
                "submit",
                handleSubmit
            );
        };
    }, [images]);

    const visibleExistingImages =
        existingImages.filter(
            (image) =>
                !removedImages.includes(image.id)
        );

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                name="landmarkImages"
                accept="image/*"
                multiple
                onChange={handleChange}
                hidden
            />

            <Group
                gap="md"
                align="flex-start"
                wrap="wrap"
            >
                {visibleExistingImages.map((image) => (
                    <div
                        key={image.id}
                        style={{
                            width: 220,
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: 140,
                                borderRadius:
                                    "var(--mantine-radius-md)",
                                overflow: "hidden",
                                backgroundColor: "#111",
                            }}
                        >
                            <img
                                src={`/api/images/${image.imageURL}`}
                                alt={
                                    image.caption ??
                                    "Landmark image"
                                }
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>

                        <TextInput
                            mt="xs"
                            placeholder="Caption"
                            value={
                                captions[image.id] ?? ""
                            }
                            onChange={(event) =>
                                updateExistingCaption(
                                    image.id,
                                    event.currentTarget
                                        .value
                                )
                            }
                        />

                        <Tooltip label="Remove image">
                            <ActionIcon
                                type="button"
                                variant="filled"
                                color="red"
                                size="sm"
                                onClick={() =>
                                    removeExistingImage(
                                        image.id
                                    )
                                }
                                aria-label="Remove image"
                                style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                }}
                            >
                                <X size={14} />
                            </ActionIcon>
                        </Tooltip>

                        <input
                            type="hidden"
                            name="imageIds[]"
                            value={image.id}
                        />

                        <input
                            type="hidden"
                            name="imageCaptions[]"
                            value={
                                captions[image.id] ?? ""
                            }
                        />
                    </div>
                ))}

                {images.map((image) => (
                    <div
                        key={image.id}
                        style={{
                            width: 220,
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: 140,
                                borderRadius:
                                    "var(--mantine-radius-md)",
                                overflow: "hidden",
                                backgroundColor: "#111",
                            }}
                        >
                            <img
                                src={image.preview}
                                alt="New landmark image"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>

                        <TextInput
                            mt="xs"
                            placeholder="Caption"
                            value={image.caption}
                            onChange={(event) =>
                                updateNewCaption(
                                    image.id,
                                    event.currentTarget
                                        .value
                                )
                            }
                        />

                        <Tooltip label="Remove image">
                            <ActionIcon
                                type="button"
                                variant="filled"
                                color="red"
                                size="sm"
                                onClick={() =>
                                    removeNewImage(
                                        image.id
                                    )
                                }
                                aria-label="Remove image"
                                style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                }}
                            >
                                <X size={14} />
                            </ActionIcon>
                        </Tooltip>

                        <input
                            type="hidden"
                            name="newImageCaptions[]"
                            value={image.caption}
                        />
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() =>
                        inputRef.current?.click()
                    }
                    style={{
                        width: 220,
                        height: 140,
                        border: "1px dashed #444",
                        borderRadius:
                            "var(--mantine-radius-md)",
                        backgroundColor: "#111",
                        color: "#888",
                        cursor: "pointer",
                    }}
                >
                    <Text size="2rem">+</Text>
                    <Text size="sm">
                        Add images
                    </Text>
                </button>
            </Group>

            {removedImages.map((id) => (
                <input
                    key={id}
                    type="hidden"
                    name="removeImageIds[]"
                    value={id}
                />
            ))}
        </div>
    );
}