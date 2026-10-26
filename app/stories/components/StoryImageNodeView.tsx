"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
    Button,
    Card,
    Group,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import {
    Check,
    ChevronDown,
    ChevronUp,
    Trash2,
} from "lucide-react";
import { Selection } from "@tiptap/pm/state";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

type Alignment = "left" | "center" | "right";

const MIN_IMAGE_WIDTH = 80;
const MAX_IMAGE_WIDTH = 2400;

function isPositiveInteger(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0
    );
}

export default function StoryImageNodeView({
    node,
    editor,
    selected,
    updateAttributes,
    deleteNode,
    getPos,
}: NodeViewProps) {
    const imageRef = useRef<HTMLImageElement>(null);
    const resizeCleanupRef = useRef<(() => void) | null>(null);
    const draftWidthRef = useRef<number | null>(null);
    const [draftWidth, setDraftWidth] = useState<number | null>(null);
    const [editorEditable, setEditorEditable] = useState(editor.isEditable);
    const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
    const assetId = Number(node.attrs.assetId);
    const src = isPositiveInteger(assetId)
        ? `/api/stories/assets/${assetId}`
        : typeof node.attrs.src === "string"
            ? node.attrs.src
            : "";
    const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
    const caption =
        typeof node.attrs.caption === "string" ? node.attrs.caption : "";
    const alignment: Alignment =
        node.attrs.align === "left" || node.attrs.align === "right"
            ? node.attrs.align
            : "center";
    const storedWidth = isPositiveInteger(node.attrs.width)
        ? node.attrs.width
        : null;
    const visibleWidth = draftWidth ?? storedWidth;
    const controlsVisible = selected && editorEditable;

    useEffect(() => {
        const syncEditableState = () => setEditorEditable(editor.isEditable);

        // setEditable() emits an update event in Tiptap; listening here keeps
        // the floating controls hidden when the parent switches to Preview.
        editor.on("update", syncEditableState);
        editor.on("selectionUpdate", syncEditableState);
        syncEditableState();

        return () => {
            editor.off("update", syncEditableState);
            editor.off("selectionUpdate", syncEditableState);
            resizeCleanupRef.current?.();
        };
    }, [editor]);
    function deselectImage() {
        const position = getPos();

        if (typeof position !== "number") return;

        // Move the cursor to a nearby valid text position,
        // clearing the image selection and hiding its controls.
        const targetPosition = Math.min(
            position + node.nodeSize,
            editor.state.doc.content.size,
        );

        const selection = Selection.near(
            editor.state.doc.resolve(targetPosition),
            1,
        );

        editor.view.dispatch(
            editor.state.tr.setSelection(selection),
        );

        editor.view.focus();
    }
    function beginResize(
        event: ReactPointerEvent<HTMLButtonElement>,
        horizontalDirection: -1 | 1,
        verticalDirection: -1 | 1,
    ) {
        event.preventDefault();
        event.stopPropagation();

        const image = imageRef.current;
        if (!image) return;

        resizeCleanupRef.current?.();

        const rect = image.getBoundingClientRect();
        const startWidth = rect.width;
        const startHeight = rect.height;
        if (startWidth <= 0 || startHeight <= 0) return;

        const aspectRatio = startWidth / startHeight;
        const startX = event.clientX;
        const startY = event.clientY;
        const pointerId = event.pointerId;

        draftWidthRef.current = startWidth;
        setDraftWidth(startWidth);

        const onMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== pointerId) return;

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            const widthFromX = startWidth + horizontalDirection * deltaX;
            const widthFromY =
                startWidth + verticalDirection * deltaY * aspectRatio;

            // Either axis can drive the resize; use the one with the larger
            // movement after accounting for the image's aspect ratio.
            const nextWidth =
                Math.abs(deltaX) >= Math.abs(deltaY * aspectRatio)
                    ? widthFromX
                    : widthFromY;
            const clampedWidth = Math.round(
                Math.max(
                    MIN_IMAGE_WIDTH,
                    Math.min(MAX_IMAGE_WIDTH, nextWidth),
                ),
            );

            draftWidthRef.current = clampedWidth;
            setDraftWidth(clampedWidth);
        };

        const removeListeners = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onCancel);
            if (resizeCleanupRef.current === removeListeners) {
                resizeCleanupRef.current = null;
            }
        };

        const onUp = (upEvent: PointerEvent) => {
            if (upEvent.pointerId !== pointerId) return;
            const finalWidth = draftWidthRef.current ?? startWidth;
            removeListeners();
            draftWidthRef.current = null;
            setDraftWidth(null);
            updateAttributes({ width: Math.round(finalWidth) });
        };

        const onCancel = (cancelEvent: PointerEvent) => {
            if (cancelEvent.pointerId !== pointerId) return;
            removeListeners();
            draftWidthRef.current = null;
            setDraftWidth(null);
        };

        resizeCleanupRef.current = removeListeners;
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
    }

    const wrapperAlignment =
        alignment === "left"
            ? "flex-start"
            : alignment === "right"
                ? "flex-end"
                : "center";

    const imageFrameStyle = {
        position: "relative" as const,
        width: visibleWidth ? `${visibleWidth}px` : "fit-content",
        maxWidth: "100%",
        boxSizing: "border-box" as const,
        outline: controlsVisible ? "1px solid #E9904F" : "1px solid transparent",
        outlineOffset: 1,
        lineHeight: 0,
    };

    const imageStyle = {
        display: "block",
        width: visibleWidth ? "100%" : "auto",
        height: "auto",
        maxWidth: "100%",
        borderRadius: 8,
        margin: "0 auto",
        userSelect: "none" as const,
    };

    const resizeHandles: {
        label: string;
        horizontal: -1 | 1;
        vertical: -1 | 1;
        position: Record<string, number>;
        cursor: string;
    }[] = [
            {
                label: "top left",
                horizontal: -1,
                vertical: -1,
                position: { top: -6, left: -6 },
                cursor: "nwse-resize",
            },
            {
                label: "top right",
                horizontal: 1,
                vertical: -1,
                position: { top: -6, right: -6 },
                cursor: "nesw-resize",
            },
            {
                label: "bottom left",
                horizontal: -1,
                vertical: 1,
                position: { bottom: -6, left: -6 },
                cursor: "nesw-resize",
            },
            {
                label: "bottom right",
                horizontal: 1,
                vertical: 1,
                position: { bottom: -6, right: -6 },
                cursor: "nwse-resize",
            },
        ];

    return (
        <NodeViewWrapper
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: wrapperAlignment,
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                margin: "1.25rem 0",
            }}
        >
            <div style={imageFrameStyle}>
                {src ? (
                    <img
                        ref={imageRef}
                        src={src}
                        alt={alt}
                        draggable={false}
                        style={imageStyle}
                    />
                ) : (
                    <div
                        style={{
                            padding: 24,
                            color: "#aaa",
                            background: "#181818",
                            border: "1px dashed #444",
                            lineHeight: 1.4,
                        }}
                    >
                        Image asset unavailable
                    </div>
                )}

                {controlsVisible &&
                    resizeHandles.map((handle) => (
                        <button
                            key={handle.label}
                            type="button"
                            aria-label={`Resize image from ${handle.label}`}
                            title="Drag to resize"
                            onPointerDown={(event) =>
                                beginResize(
                                    event,
                                    handle.horizontal,
                                    handle.vertical,
                                )
                            }
                            contentEditable={false}
                            style={{
                                position: "absolute",
                                ...handle.position,
                                zIndex: 2,
                                width: 12,
                                height: 12,
                                padding: 0,
                                borderRadius: 3,
                                border: "2px solid #fff",
                                background: "#E9904F",
                                cursor: handle.cursor,
                                touchAction: "none",
                            }}
                        />
                    ))}
            </div>

            {caption.trim() && (
                <div
                    style={{
                        width: visibleWidth ? `${visibleWidth}px` : "fit-content",
                        maxWidth: "100%",
                        marginTop: 8,
                        color: "#a0a0a0",
                        fontSize: "0.9rem",
                        lineHeight: 1.4,
                        textAlign: alignment,
                        overflowWrap: "anywhere",
                    }}
                >
                    {caption}
                </div>
            )}

            {controlsVisible && (
                <Card
                    withBorder
                    padding={propertiesCollapsed ? "xs" : "sm"}
                    radius="md"
                    bg="#161616"
                    contentEditable={false}
                    onMouseDown={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    style={{
                        width: "min(100%, 560px)",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        borderColor: "#8b522e",
                        marginTop: 12,
                        alignSelf: "center",
                        lineHeight: 1.4,
                    }}
                >
                    <Stack gap={propertiesCollapsed ? 0 : "sm"}>
                        <Group justify="space-between" align="center" gap="xs">
                            <Text fw={600} size="sm">
                                Image properties
                            </Text>

                            <Group gap="xs" wrap="nowrap">
                                <Button
                                    type="button"
                                    size="compact-sm"
                                    variant="subtle"
                                    color="gray"
                                    leftSection={
                                        propertiesCollapsed
                                            ? <ChevronDown size={14} />
                                            : <ChevronUp size={14} />
                                    }
                                    aria-expanded={!propertiesCollapsed}
                                    onClick={() =>
                                        setPropertiesCollapsed((current) => !current)
                                    }
                                >
                                    {propertiesCollapsed ? "Expand" : "Collapse"}
                                </Button>

                                <Button
                                    type="button"
                                    size="compact-sm"
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<Check size={14} />}
                                    onClick={deselectImage}
                                >
                                    Done
                                </Button>

                                <Button
                                    type="button"
                                    size="compact-sm"
                                    variant="subtle"
                                    color="red"
                                    leftSection={<Trash2 size={14} />}
                                    onClick={deleteNode}
                                >
                                    Delete
                                </Button>
                            </Group>
                        </Group>

                        {!propertiesCollapsed && (
                            <>
                                <TextInput
                                    label="Alt text"
                                    description="Describe the image for accessibility."
                                    value={alt}
                                    onChange={(event) =>
                                        updateAttributes({
                                            alt: event.currentTarget.value,
                                        })
                                    }
                                />

                                <TextInput
                                    label="Caption"
                                    placeholder="Optional caption shown below the image"
                                    value={caption}
                                    onChange={(event) =>
                                        updateAttributes({
                                            caption: event.currentTarget.value,
                                        })
                                    }
                                />

                                <Group align="flex-end" grow>
                                    <Select
                                        label="Alignment"
                                        data={[
                                            { label: "Left", value: "left" },
                                            { label: "Center", value: "center" },
                                            { label: "Right", value: "right" },
                                        ]}
                                        value={alignment}
                                        onChange={(value) =>
                                            updateAttributes({
                                                align:
                                                    value === "left" ||
                                                        value === "right"
                                                        ? value
                                                        : "center",
                                            })
                                        }
                                        allowDeselect={false}
                                    />

                                    <Stack gap={2}>
                                        <Text size="sm" fw={500}>
                                            Width
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            {visibleWidth
                                                ? `${Math.round(visibleWidth)} px`
                                                : "Original size"}
                                        </Text>
                                    </Stack>
                                </Group>

                                <Text size="xs" c="dimmed">
                                    Drag any corner handle to resize. The image keeps its
                                    aspect ratio and scales down to fit the story column.
                                </Text>
                            </>
                        )}
                    </Stack>
                </Card>
            )}
        </NodeViewWrapper>
    );
}
