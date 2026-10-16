
"use client";

import {
    Accordion,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import type { HighlightSectionData } from "../highlights-data";
import HighlightCard from "./HighlightCard";

type HighlightSectionProps = {
    section: HighlightSectionData;
};

export default function HighlightSection({
    section,
}: HighlightSectionProps) {
    if (section.id === "firsts") {
        const legacyRecords = section.records.filter((record) =>
            record.id.startsWith("first-child-legacy-"),
        );

        const eventRecords = section.records.filter(
            (record) =>
                !record.id.startsWith("first-child-legacy-"),
        );

        return (
            <Stack id={section.id} gap="md" className="scroll-mt-8">
                <div>
                    <Title order={2} size="h3">
                        {section.title}
                    </Title>

                    <Text c="dimmed" size="sm" mt={4}>
                        {section.description}
                    </Text>
                </div>

                <Stack gap="xl">
                    <Stack gap="sm">
                        <Title order={3} size="h5">
                            Births &amp; deaths
                        </Title>

                        <SimpleGrid
                            cols={{ base: 1, sm: 2 }}
                            spacing="md"
                            verticalSpacing="md"
                        >
                            {eventRecords.map((record) => (
                                <HighlightCard
                                    key={record.id}
                                    record={record}
                                />
                            ))}
                        </SimpleGrid>
                    </Stack>

                    <Stack gap="sm">
                        <Title order={3} size="h5">
                            Legacy firsts
                        </Title>

                        <Accordion>
                            <Accordion.Item value="legacy-firsts">
                                <Accordion.Control>
                                    <div>
                                        <Text fw={600}>
                                            {legacyRecords.length} legacies
                                        </Text>

                                        <Text size="sm" c="dimmed">
                                            View the first recorded child of each legacy.
                                        </Text>
                                    </div>
                                </Accordion.Control>

                                <Accordion.Panel>
                                    <SimpleGrid
                                        cols={{ base: 1, sm: 2, lg: 3 }}
                                        spacing="md"
                                        verticalSpacing="md"
                                    >
                                        {legacyRecords.map((record) => (
                                            <HighlightCard
                                                key={record.id}
                                                record={record}
                                            />
                                        ))}
                                    </SimpleGrid>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Stack>
                </Stack>
            </Stack>
        );
    }

    if (section.id === "lasts") {
        const youngestRecords = section.records.filter((record) =>
            record.id.startsWith("last-youngest-"),
        );

        const latestDeathRecords = section.records.filter((record) =>
            record.id.startsWith("last-death-"),
        );

        return (
            <Stack id={section.id} gap="md" className="scroll-mt-8">
                <div>
                    <Title order={2} size="h3">
                        {section.title}
                    </Title>

                    <Text c="dimmed" size="sm" mt={4}>
                        {section.description}
                    </Text>
                </div>

                <Stack gap="xl">
                    <Stack gap="sm">
                        <Title order={3} size="h5">
                            Youngest members
                        </Title>

                        <Accordion>
                            <Accordion.Item value="youngest-members">
                                <Accordion.Control>
                                    <div>
                                        <Text fw={600}>
                                            {youngestRecords.length} legacies
                                        </Text>

                                        <Text size="sm" c="dimmed">
                                            View the youngest recorded member of each legacy.
                                        </Text>
                                    </div>
                                </Accordion.Control>

                                <Accordion.Panel>
                                    <SimpleGrid
                                        cols={{ base: 1, sm: 2, lg: 3 }}
                                        spacing="md"
                                        verticalSpacing="md"
                                    >
                                        {youngestRecords.map((record) => (
                                            <HighlightCard
                                                key={record.id}
                                                record={record}
                                            />
                                        ))}
                                    </SimpleGrid>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Stack>

                    <Stack gap="sm">
                        <Title order={3} size="h5">
                            Latest deaths
                        </Title>

                        <Accordion>
                            <Accordion.Item value="latest-deaths">
                                <Accordion.Control>
                                    <div>
                                        <Text fw={600}>
                                            {latestDeathRecords.length} legacies
                                        </Text>

                                        <Text size="sm" c="dimmed">
                                            View the most recently deceased recorded member of each legacy.
                                        </Text>
                                    </div>
                                </Accordion.Control>

                                <Accordion.Panel>
                                    <SimpleGrid
                                        cols={{ base: 1, sm: 2, lg: 3 }}
                                        spacing="md"
                                        verticalSpacing="md"
                                    >
                                        {latestDeathRecords.map((record) => (
                                            <HighlightCard
                                                key={record.id}
                                                record={record}
                                            />
                                        ))}
                                    </SimpleGrid>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Stack>
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack id={section.id} gap="md" className="scroll-mt-8">
            <div>
                <Title order={2} size="h3">
                    {section.title}
                </Title>

                <Text c="dimmed" size="sm" mt={4}>
                    {section.description}
                </Text>
            </div>

            <SimpleGrid
                cols={{ base: 1, sm: 2, lg: 3 }}
                spacing="md"
                verticalSpacing="md"
            >
                {section.records.map((record) => (
                    <HighlightCard key={record.id} record={record} />
                ))}
            </SimpleGrid>
        </Stack>
    );
}
