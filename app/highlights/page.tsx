
import {
    Anchor,
    Badge,
    Box,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import Image from "next/image";

import { getHighlightsData } from "./highlights-data";
import HighlightSection from "./components/HighlightSection";
import FeaturedHighlights from "./components/FeaturedHighlights";
import ActivityChart from "./components/ActivityChart";
import styles from "./highlights.module.css";
import HighlightUpdates from "./components/HighlightUpdates";

export default async function HighlightsPage() {
    const data = await getHighlightsData();

    const overview = [
        { label: "Recorded colonists", value: data.totals.colonists },
        { label: "Living", value: data.totals.living },
        { label: "Deceased", value: data.totals.dead },
        { label: "Legacies", value: data.totals.legacies },
        { label: "Relics", value: data.totals.relics },
    ];

    return (
        <main className={styles.page}>
            <Stack gap={36}>
                <header className={styles.hero}>
                    <div className={styles.heroContent}>
                        <Badge
                            variant="light"
                            color="orange"
                            size="lg"
                            radius="sm"
                        >
                            Highlights
                        </Badge>

                        <Title order={1} className={styles.heroTitle}>
                            A colony, remembered.
                        </Title>

                        <Text className={styles.heroDescription}>
                            The people, families, and histories that shaped
                            Eternal Mesa — discovered through the records
                            left behind.
                        </Text>

                        <Group gap="xs" mt="md" wrap="wrap">
                            {data.sections.map((section) => (
                                <Anchor
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className={styles.sectionLink}
                                >
                                    {section.title}
                                </Anchor>
                            ))}
                        </Group>
                    </div>

                    <div className={styles.heroDecoration} aria-hidden="true">
                        <div className={styles.heroRing} />
                        <div className={styles.heroRingInner} />
                        <div className={styles.heroMark}>
                            <Image
                                src="/predatus2.png"
                                alt=""
                                width={64}
                                height={64}
                            />
                        </div>
                    </div>
                </header>

                <SimpleGrid
                    cols={{ base: 2, sm: 3, lg: 5 }}
                    spacing="sm"
                >
                    {overview.map((item) => (
                        <Box key={item.label} className={styles.overviewTile}>
                            <Text className={styles.overviewValue}>
                                {item.value.toLocaleString()}
                            </Text>
                            <Text c="dimmed" size="sm">
                                {item.label}
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>

                <FeaturedHighlights records={data.featured} />

                <HighlightUpdates updates={data.updates} />

                <ActivityChart years={data.activityYears} />

                <Stack gap={36}>
                    {data.sections.map((section) => (
                        <HighlightSection
                            key={section.id}
                            section={section}
                        />
                    ))}
                </Stack>

                <footer className={styles.footer}>
                    <Text c="dimmed" size="xs">
                        Highlights are calculated from the current archive.
                        Missing or incomplete dates may affect historical records.
                    </Text>
                </footer>
            </Stack>
        </main>
    );
}
