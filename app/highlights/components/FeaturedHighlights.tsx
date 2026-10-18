
"use client";

import { useState } from "react";
import { ActionIcon, Group, Stack, Text, Title } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { HighlightRecord } from "../highlights-data";
import FeaturedHighlightCard from "./FeaturedHighlightCard";
import styles from "../highlights.module.css";

type FeaturedHighlightsProps = {
    records: HighlightRecord[];
};

export default function FeaturedHighlights({
    records,
}: FeaturedHighlightsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (records.length === 0) return null;

    const activeIndex = currentIndex % records.length;
    const activeRecord = records[activeIndex];

    const previousIndex =
        (activeIndex - 1 + records.length) % records.length;
    const nextIndex = (activeIndex + 1) % records.length;

    const showSides = records.length > 2;
    const showNext = records.length > 1;

    function move(direction: -1 | 1) {
        setCurrentIndex(
            (current) => (current + direction + records.length) % records.length,
        );
    }

    return (
        <Stack gap="md">
            <div>
                <Title order={2} size="h3">
                    Worth remembering
                </Title>

                <Text c="dimmed" size="sm" mt={4}>
                    Discover standout people and moments from the colony archive.
                </Text>
            </div>

            <div
                className={[
                    styles.featuredCarousel,
                    records.length === 2
                        ? styles.featuredCarouselTwo
                        : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                {showSides && (
                    <div className={styles.featuredSide}>
                        <FeaturedHighlightCard record={records[previousIndex]} />
                    </div>
                )}

                <div
                    className={styles.featuredCenter}
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <FeaturedHighlightCard record={activeRecord} featured />
                </div>

                {showNext && (
                    <div className={styles.featuredSide}>
                        <FeaturedHighlightCard record={records[nextIndex]} />
                    </div>
                )}
            </div>

            {records.length > 1 && (
                <Group justify="center" gap="md">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        radius="xl"
                        aria-label="Previous highlight"
                        onClick={() => move(-1)}
                    >
                        <ChevronLeft size={20} />
                    </ActionIcon>

                    <Text c="dimmed" size="sm" className={styles.featuredCounter}>
                        {activeIndex + 1} / {records.length}
                    </Text>

                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        radius="xl"
                        aria-label="Next highlight"
                        onClick={() => move(1)}
                    >
                        <ChevronRight size={20} />
                    </ActionIcon>
                </Group>
            )}
        </Stack>
    );
}
