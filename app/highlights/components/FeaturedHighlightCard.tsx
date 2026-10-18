
"use client";

import { Anchor, Card, Image, Stack, Text } from "@mantine/core";

import type { HighlightRecord } from "../highlights-data";
import HighlightCard from "./HighlightCard";
import styles from "../highlights.module.css";

type FeaturedHighlightCardProps = {
    record: HighlightRecord;
    featured?: boolean;
};

export default function FeaturedHighlightCard({
    record,
    featured = false,
}: FeaturedHighlightCardProps) {
    if (!record.imageURL) {
        return <HighlightCard record={record} featured={featured} />;
    }

    return (
        <Card
            className={[
                styles.featuredImageCard,
                featured ? styles.featuredImageCardMain : "",
            ]
                .filter(Boolean)
                .join(" ")}
            padding={0}
            radius="md"
            withBorder
        >


            <Stack align="center" pt="md" px="md">
                <Image
                    src={`/api/images/${record.imageURL}`}
                    alt={record.value}
                    w={90}
                    h={115}
                    fit="cover"
                    radius="md"
                    style={{
                        border: `2px solid ${record.color ?? "#292929"}`,
                        flexShrink: 0,
                    }}
                />
            </Stack>



            <Stack gap="xs" p="md">
                <Text c="dimmed" size="xs" fw={600}>
                    {record.title}
                    {record.titleParts?.map((part, index) => (
                        <Text
                            key={`${part.label}-${index}`}
                            span
                            c={part.color ?? "inherit"}
                            fw={700}
                        >
                            {" "}{part.href ? (
                                <Anchor
                                    href={part.href}
                                    c={part.color ?? "inherit"}
                                    size="xs"
                                    fw={700}
                                >
                                    {part.label}
                                </Anchor>
                            ) : (
                                part.label
                            )}
                        </Text>
                    ))}
                </Text>

                {record.href ? (
                    <Anchor
                        href={record.href}
                        c={record.color ?? undefined}
                        fw={700}
                        size={featured ? "lg" : "md"}
                        lineClamp={2}
                    >
                        {record.value}
                    </Anchor>
                ) : (
                    <Text
                        fw={700}
                        size={featured ? "lg" : "md"}
                        lineClamp={2}
                    >
                        {record.value}
                    </Text>
                )}

                {record.valueParts && record.valueParts.length > 0 && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                        {record.valueParts.map((part, index) => (
                            <span key={`${part.label}-${index}`}>
                                {index > 0 ? " → " : ""}
                                {part.href ? (
                                    <Anchor
                                        href={part.href}
                                        c={part.color ?? undefined}
                                        size="xs"
                                    >
                                        {part.label}
                                    </Anchor>
                                ) : (
                                    part.label
                                )}
                            </span>
                        ))}
                    </Text>
                )}

                {record.description && (
                    <Text c="dimmed" size="sm" lineClamp={featured ? 3 : 2}>
                        {record.description}
                    </Text>
                )}
            </Stack>
        </Card>
    );
}
