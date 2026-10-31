
"use client";

import { useEffect, useRef, useState } from "react";
import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
    bedId: number;
    isFirst: boolean;
    isLast: boolean;
};

export default function BedReorderControls({
    bedId,
    isFirst: initialIsFirst,
    isLast: initialIsLast,
}: Props) {
    const rootRef = useRef<HTMLDivElement>(null);

    const [isFirst, setIsFirst] = useState(initialIsFirst);
    const [isLast, setIsLast] = useState(initialIsLast);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const card = rootRef.current?.closest<HTMLElement>(
            "[data-bed-card]"
        );

        const grid = card?.parentElement;

        if (!card || !grid) return;

        const updatePosition = () => {
            const cards = Array.from(grid.children).filter(
                (element): element is HTMLElement =>
                    element instanceof HTMLElement &&
                    element.hasAttribute("data-bed-card")
            );

            const index = cards.indexOf(card);

            setIsFirst(index === 0);
            setIsLast(index === cards.length - 1);
        };

        const handleReorderStart = () => setIsSaving(true);
        const handleReorderFinish = () => setIsSaving(false);

        grid.addEventListener(
            "bed-order-changed",
            updatePosition
        );

        grid.addEventListener(
            "bed-reorder-start",
            handleReorderStart
        );

        grid.addEventListener(
            "bed-reorder-finish",
            handleReorderFinish
        );

        return () => {
            grid.removeEventListener(
                "bed-order-changed",
                updatePosition
            );

            grid.removeEventListener(
                "bed-reorder-start",
                handleReorderStart
            );

            grid.removeEventListener(
                "bed-reorder-finish",
                handleReorderFinish
            );
        };
    }, []);

    async function moveBed(
        direction: "left" | "right"
    ) {
        const card = rootRef.current?.closest<HTMLElement>(
            "[data-bed-card]"
        );

        const grid = card?.parentElement;

        if (!card || !grid || grid.dataset.reordering === "true") {
            return;
        }

        const originalNextSibling = card.nextElementSibling;

        const cards = Array.from(grid.children).filter(
            (element): element is HTMLElement =>
                element instanceof HTMLElement &&
                element.hasAttribute("data-bed-card")
        );

        const currentIndex = cards.indexOf(card);
        const targetIndex =
            direction === "left"
                ? currentIndex - 1
                : currentIndex + 1;

        if (
            targetIndex < 0 ||
            targetIndex >= cards.length
        ) {
            return;
        }

        grid.dataset.reordering = "true";
        grid.dispatchEvent(new Event("bed-reorder-start"));

        // Move the card immediately.
        if (direction === "left") {
            grid.insertBefore(card, card.previousElementSibling);
        } else {
            grid.insertBefore(card.nextElementSibling!, card);
        }

        grid.dispatchEvent(new Event("bed-order-changed"));

        try {
            const response = await fetch(
                `/api/locations/beds/${bedId}/reorder`,
                {
                    method: "POST",
                    body: new URLSearchParams({
                        direction,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to save bed order.");
            }
        } catch (error) {
            console.error("Failed to reorder bed:", error);

            // Restore the original position.
            if (originalNextSibling?.parentElement === grid) {
                grid.insertBefore(card, originalNextSibling);
            } else {
                grid.appendChild(card);
            }

            grid.dispatchEvent(new Event("bed-order-changed"));

            window.alert(
                "The bed order could not be saved. The previous order has been restored."
            );
        } finally {
            delete grid.dataset.reordering;

            grid.dispatchEvent(new Event("bed-reorder-finish"));
            grid.dispatchEvent(new Event("bed-order-changed"));
        }
    }

    return (
        <div ref={rootRef}>
            <Group justify="space-between" align="center" mb="xs">
                <Tooltip label="Move bed left">
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="mesa"
                        size="sm"
                        disabled={isFirst || isSaving}
                        aria-label="Move bed left"
                        onClick={() => moveBed("left")}
                    >
                        <ArrowLeft size={18} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="Move bed right">
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="mesa"
                        size="sm"
                        disabled={isLast || isSaving}
                        aria-label="Move bed right"
                        onClick={() => moveBed("right")}
                    >
                        <ArrowRight size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </div>
    );
}
