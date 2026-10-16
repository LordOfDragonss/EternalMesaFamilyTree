
import { SimpleGrid, Stack, Text, Title } from "@mantine/core";

import type { HighlightRecord } from "../highlights-data";
import HighlightCard from "./HighlightCard";
import styles from "../highlights.module.css";

type FeaturedHighlightsProps = {
    records: HighlightRecord[];
};

export default function FeaturedHighlights({
    records,
}: FeaturedHighlightsProps) {
    if (records.length === 0) return null;

    return (
        <Stack gap="md">
            <div>
                <Title order={2} size="h3">
                    Worth remembering
                </Title>

                <Text c="dimmed" size="sm" mt={4}>
                    A few of the standout records found in the colony archive.
                </Text>
            </div>

            <SimpleGrid
                cols={{ base: 1, sm: 2, lg: 3 }}
                spacing="md"
            >
                {records.map((record, index) => (
                    <div
                        key={record.id}
                        className={index === 0 ? styles.featuredLead : undefined}
                    >
                        <HighlightCard record={record} featured />
                    </div>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
