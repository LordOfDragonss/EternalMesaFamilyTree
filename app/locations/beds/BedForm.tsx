
"use client";

import {
    ActionIcon,
    Button,
    Container,
    Group,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
    Textarea,
    Tooltip,
} from "@mantine/core";
import { ArrowLeft, BedDouble, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type BedFormProps = {
    mode: "create" | "edit";
    locations: {
        value: string;
        label: string;
    }[];
    bedId?: number;
    initialLocationId?: number;
    initialName?: string | null;
    initialScreenshot?: string | null;
    initialNotes?: string | null;
};

export default function BedForm({
    mode,
    locations,
    bedId,
    initialLocationId,
    initialName,
    initialScreenshot,
    initialNotes,
}: BedFormProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [preview, setPreview] =
        useState<string | null>(null);

    const [removed, setRemoved] =
        useState(false);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    function handleScreenshotChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) return;

        setRemoved(false);
        setPreview(URL.createObjectURL(file));
    }

    function removeScreenshot() {
        setPreview(null);
        setRemoved(true);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    const screenshotSrc =
        preview ??
        (!removed && initialScreenshot
            ? `/api/images/${initialScreenshot}`
            : null);

    const action =
        mode === "create"
            ? "/api/locations/beds/create"
            : `/api/locations/beds/${bedId}/edit`;

    return (
        <Container size="lg" py="xl">
            <Stack gap="lg">
                <Group gap="sm">
                    <Tooltip label="Back to Double Bed Manager">
                        <ActionIcon
                            component={Link}
                            href="/locations/beds"
                            variant="subtle"
                            size="lg"
                            color="mesa"
                            aria-label="Back to Double Bed Manager"
                        >
                            <ArrowLeft size={20} />
                        </ActionIcon>
                    </Tooltip>

                    <div>
                        <Text
                            size="xs"
                            c="dimmed"
                            tt="uppercase"
                            fw={700}
                        >
                            Double Bed Manager
                        </Text>

                        <Text size="xl" fw={700}>
                            {mode === "create"
                                ? "Add Double Bed"
                                : "Edit Double Bed"}
                        </Text>
                    </div>
                </Group>

                <Paper
                    p="xl"
                    radius="md"
                    bg="#161616"
                    withBorder
                    style={{
                        borderColor: "#292929",
                    }}
                >
                    <form
                        action={action}
                        method="POST"
                        encType="multipart/form-data"
                    >
                        <Stack gap="lg">
                            <TextInput
                                label="Bed name"
                                description="Optional. Unnamed beds are automatically numbered within their location."
                                name="name"
                                placeholder="e.g. Main bedroom"
                                defaultValue={initialName ?? ""}
                                maxLength={100}
                            />

                            <Select
                                label="Location"
                                description="The playable map this bed belongs to."
                                name="locationId"
                                placeholder="Select a location"
                                data={locations}
                                defaultValue={
                                    initialLocationId !== undefined
                                        ? String(initialLocationId)
                                        : null
                                }
                                required
                                allowDeselect={false}
                            />

                            <Stack gap="xs">
                                <div>
                                    <Text fw={500} size="sm">
                                        Screenshot
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Optional image showing the bed's position or orientation.
                                    </Text>
                                </div>

                                <div
                                    onClick={() =>
                                        inputRef.current?.click()
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault();
                                            inputRef.current?.click();
                                        }
                                    }}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: 320,
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
                                    {screenshotSrc ? (
                                        <img
                                            src={screenshotSrc}
                                            alt="Double bed screenshot preview"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <BedDouble
                                                size={32}
                                                strokeWidth={1.5}
                                            />
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                mt="xs"
                                            >
                                                Select a screenshot
                                            </Text>
                                        </>
                                    )}
                                </div>

                                {screenshotSrc && (
                                    <Group justify="flex-end">
                                        <Tooltip label="Remove screenshot">
                                            <ActionIcon
                                                type="button"
                                                variant="filled"
                                                color="red"
                                                size="sm"
                                                onClick={removeScreenshot}
                                                aria-label="Remove screenshot"
                                            >
                                                <X size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                )}

                                <input
                                    ref={inputRef}
                                    type="file"
                                    name="screenshot"
                                    accept="image/*"
                                    onChange={handleScreenshotChange}
                                    hidden
                                />

                                {removed && (
                                    <input
                                        type="hidden"
                                        name="removeScreenshot"
                                        value="true"
                                    />
                                )}
                            </Stack>

                            <Textarea
                                label="Notes"
                                description="Optional notes about this bed or its placement."
                                name="notes"
                                placeholder="Add any relevant details..."
                                defaultValue={initialNotes ?? ""}
                                minRows={3}
                                autosize
                                maxRows={8}
                            />

                            <Group justify="flex-end" mt="sm">
                                <Button
                                    type="submit"
                                    color="mesa"
                                >
                                    {mode === "create"
                                        ? "Create Bed"
                                        : "Save Changes"}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Paper>
            </Stack>
        </Container>
    );
}
