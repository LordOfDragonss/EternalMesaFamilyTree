
"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Anchor,
    Button,
    Card,
    Group,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";
import {
    CalendarDays,
    Crown,
    Gem,
    Heart,
    Sparkles,
    Trophy,
    Users,
} from "lucide-react";

import type { HighlightRecord, HighlightValuePart } from "../highlights-data";
import styles from "../highlights.module.css";

const icons = {
    users: Users,
    calendar: CalendarDays,
    trophy: Trophy,
    heart: Heart,
    legacy: Crown,
    relic: Gem,
    sparkles: Sparkles,
};

type HighlightCardProps = {
    record: HighlightRecord;
    featured?: boolean;
};

function ValuePart({ part }: { part: HighlightValuePart }) {
    if (part.href) {
        return (
            <Anchor
                component={Link}
                href={part.href}
                c={part.color ?? "inherit"}
                fw={700}
                underline="never"
            >
                {part.label}
            </Anchor>
        );
    }

    return (
        <Text span fw={700} c={part.color ?? "inherit"}>
            {part.label}
        </Text>
    );
}

export default function HighlightCard({
    record,
    featured = false,
}: HighlightCardProps) {
    const Icon = icons[record.icon];
    const [expanded, setExpanded] = useState(false);

    const parts = record.valueParts ?? [];
    const canCollapse = parts.length > 3;
    const visibleParts =
        canCollapse && !expanded ? parts.slice(0, 2) : parts;

    const value = record.href ? (
        <Anchor
            component={Link}
            href={record.href}
            c={record.color ?? "inherit"}
            fw={700}
            underline="never"
        >
            {record.value}
        </Anchor>
    ) : (
        record.value
    );

    const description =
        record.href &&
        record.description?.toLowerCase().includes("share this record")
            ? undefined
            : record.description;

    return (
        <Card
            className={`${styles.highlightCard} ${featured ? styles.featuredCard : ""}`}
            h="100%"
            padding={featured ? "lg" : "md"}
            radius="lg"
            withBorder
        >
            <Stack gap="sm" h="100%">
                <Group justify="space-between" align="center" wrap="nowrap">
                    <Text className={styles.cardLabel} size="sm" fw={600}>
                        {record.title}
                        {record.titleParts?.map((part, index) => (
                            <Text
                                key={`${part.label}-${index}`}
                                span
                                c={part.color ?? "inherit"}
                                fw={700}
                            >
                                {" "}{part.label}
                            </Text>
                        ))}
                    </Text>

                    <ThemeIcon
                        variant="light"
                        color="gray"
                        size={featured ? 38 : 32}
                        radius="md"
                    >
                        <Icon size={featured ? 19 : 16} />
                    </ThemeIcon>
                </Group>

                <div className={styles.cardValue}>
                    {value}
                </div>

                {parts.length > 0 && (
                    <Stack gap={4}>
                        <Group gap={6} wrap="wrap">
                            {visibleParts.map((part, index) => (
                                <span key={`${part.href ?? part.label}-${index}`}>
                                    {index > 0 && (
                                        <Text span c="dimmed">
                                            {expanded ? " · " : " & "}
                                        </Text>
                                    )}
                                    <ValuePart part={part} />
                                </span>
                            ))}

                            {canCollapse && !expanded && (
                                <Text span c="dimmed" size="sm">
                                    {` · and ${parts.length - visibleParts.length} more`}
                                </Text>
                            )}
                        </Group>

                        {canCollapse && (
                            <Button
                                variant="subtle"
                                color="gray"
                                size="compact-sm"
                                px={0}
                                w="fit-content"
                                onClick={() =>
                                    setExpanded((current) => !current)
                                }
                            >
                                {expanded
                                    ? "Show less"
                                    : `Show all ${parts.length}`}
                            </Button>
                        )}
                    </Stack>
                )}

                {description && (
                    <Text
                        c="dimmed"
                        size="sm"
                        className={styles.cardDescription}
                    >
                        {description}
                    </Text>
                )}
            </Stack>
        </Card>
    );
}
