"use client";

import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { X } from "lucide-react";
import { useRef, useState } from "react";

type PortraitUploadProps = {
    existingImage?: string | null;
};

export default function PortraitUpload({
    existingImage = null,
}: PortraitUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [removed, setRemoved] = useState(false);

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            setPreview(null);
            return;
        }

        setRemoved(false);
        setPreview(URL.createObjectURL(file));
    }

    function removePortrait() {
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
                width: 150,
                minWidth: 150,
            }}
        >
            <div
                onClick={() => inputRef.current?.click()}
                style={{
                    width: 150,
                    height: 190,
                    border: "1px dashed #444",
                    borderRadius: "var(--mantine-radius-md)",
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
                        alt="Portrait"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <>
                        <Text size="2rem" c="dimmed">
                            +
                        </Text>

                        <Text size="sm" c="dimmed">
                            Add portrait
                        </Text>
                    </>
                )}
            </div>

            {imageSrc && (
                <Tooltip label="Remove portrait">
                    <ActionIcon
                        type="button"
                        variant="filled"
                        color="red"
                        size="sm"
                        onClick={removePortrait}
                        aria-label="Remove portrait"
                        style={{
                            position: "absolute",
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
                name="portrait"
                accept="image/*"
                onChange={handleChange}
                hidden
            />

            {removed && (
                <input
                    type="hidden"
                    name="removePortrait"
                    value="true"
                />
            )}
        </div>
    );
}