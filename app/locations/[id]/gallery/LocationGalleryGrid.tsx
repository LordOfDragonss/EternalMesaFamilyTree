"use client";

import {
    Image,
    Modal,
    SimpleGrid,
    Stack,
    Text,
} from "@mantine/core";
import { useState } from "react";

type GalleryImage = {
    id: number;
    imageURL: string;
    caption: string | null;
};

type LocationGalleryGridProps = {
    images: GalleryImage[];
};

export default function LocationGalleryGrid({
    images,
}: LocationGalleryGridProps) {
    const [selectedImage, setSelectedImage] =
        useState<GalleryImage | null>(null);

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
                {images.map((image) => (
                    <div key={image.id}>
                        <button
                            type="button"
                            onClick={() =>
                                setSelectedImage(image)
                            }
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 0,
                                border: 0,
                                borderRadius:
                                    "var(--mantine-radius-md)",
                                overflow: "hidden",
                                background: "#111",
                                cursor: "pointer",
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
                                    aspectRatio: "4 / 3",
                                    objectFit: "cover",
                                }}
                            />
                        </button>

                        {image.caption && (
                            <Text
                                size="sm"
                                c="dimmed"
                                mt="xs"
                            >
                                {image.caption}
                            </Text>
                        )}
                    </div>
                ))}
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
                                {selectedImage.caption}
                            </Text>
                        )}
                    </Stack>
                )}
            </Modal>
        </>
    );
}