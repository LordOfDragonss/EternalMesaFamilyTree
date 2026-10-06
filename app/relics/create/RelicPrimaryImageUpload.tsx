"use client";

import {
    ActionIcon,
    Text,
    Tooltip,
} from "@mantine/core";
import { X } from "lucide-react";
import { useRef, useState } from "react";

type RelicPrimaryImageUploadProps = {
    existingImage?: string | null;
};

export default function RelicPrimaryImageUpload({
    existingImage = null,
}: RelicPrimaryImageUploadProps) {
    const inputRef =
        useRef<HTMLInputElement>(null);

    const [preview, setPreview] =
        useState<string | null>(null);

    const [removed, setRemoved] =
        useState(false);

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            setPreview(null);
            return;
        }

        setRemoved(false);
        setPreview(
            URL.createObjectURL(file)
        );
    }

    function removeImage() {
        setPreview(null);
        setRemoved(true);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    const imageSrc =
        preview ??
        (!removed && existingImage
            ? `/api/images/${existingImage}`
            : null);

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                maxWidth: 500,
            }}
        >
            <div
                onClick={() =>
                    inputRef.current?.click()
                }
                style={{
                    width: "100%",
                    height: 280,
                    border: "1px dashed #444",
                    borderRadius:
                        "var(--mantine-radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888",
                    backgroundColor: "#111",
                    cursor: "pointer",
                    overflow: "hidden",
                }}
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt="Relic primary image"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    <>
                        <Text
                            size="2rem"
                            c="dimmed"
                        >
                            +
                        </Text>

                        <Text
                            size="sm"
                            c="dimmed"
                        >
                            Add primary image
                        </Text>
                    </>
                )}
            </div>

            {imageSrc && (
                <Tooltip label="Remove image">
                    <ActionIcon
                        type="button"
                        variant="filled"
                        color="red"
                        size="sm"
                        onClick={
                            removeImage
                        }
                        aria-label="Remove image"
                        style={{
                            position:
                                "absolute",
                            top: 8,
                            right: 8,
                        }}
                    >
                        <X size={14} />
                    </ActionIcon>
                </Tooltip>
            )}

            <input
                ref={inputRef}
                type="file"
                name="primaryImage"
                accept="image/*"
                onChange={handleChange}
                hidden
            />

            {removed && (
                <input
                    type="hidden"
                    name="removePrimaryImage"
                    value="true"
                />
            )}
        </div>
    );
}