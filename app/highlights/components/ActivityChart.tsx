
"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Avatar,
    Card,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import type { ActivityYear } from "../highlights-data";
import styles from "../highlights.module.css";

type ActivityChartProps = {
    years: ActivityYear[];
};

export default function ActivityChart({ years }: ActivityChartProps) {
    const [selectedYear, setSelectedYear] = useState<number | null>(
        years.length > 0 ? years[years.length - 1].year : null
    );

    const maximum = Math.max(
        1,
        ...years.flatMap((year) => [year.births, year.deaths])
    );

    const selected = years.find((year) => year.year === selectedYear);

    function getColonistName(colonist: {
        firstName: string;
        nickname: string | null;
        lastName: string;
    }) {
        const nickname = colonist.nickname
            ? ` "${colonist.nickname}"`
            : "";

        return `${colonist.firstName}${nickname} ${colonist.lastName}`;
    }

    return (
        <Card
            className={styles.activityCard}
            padding="lg"
            radius="lg"
            withBorder
        >
            <Stack gap="md">
                <div>
                    <Title order={2} size="h3">
                        Colony through the years
                    </Title>

                    <Text c="dimmed" size="sm" mt={4}>
                        Recorded births and deaths, grouped by RimWorld year.
                        Select a year to see the colonists behind the numbers.
                    </Text>
                </div>

                <Group gap="md">
                    <Group gap={6}>
                        <span
                            className={`${styles.legendDot} ${styles.birthDot}`}
                        />
                        <Text size="xs" c="dimmed">
                            Births
                        </Text>
                    </Group>

                    <Group gap={6}>
                        <span
                            className={`${styles.legendDot} ${styles.deathDot}`}
                        />
                        <Text size="xs" c="dimmed">
                            Deaths
                        </Text>
                    </Group>
                </Group>

                {years.length === 0 ? (
                    <Text c="dimmed" size="sm">
                        No dated births or deaths are recorded yet.
                    </Text>
                ) : (
                    <>
                        <div className={styles.chartScroll}>
                            <div className={styles.chart}>
                                {years.map((year) => {
                                    const birthHeight = Math.max(
                                        year.births > 0 ? 4 : 0,
                                        (year.births / maximum) * 100
                                    );

                                    const deathHeight = Math.max(
                                        year.deaths > 0 ? 4 : 0,
                                        (year.deaths / maximum) * 100
                                    );

                                    const isSelected =
                                        year.year === selectedYear;

                                    return (
                                        <button
                                            className={`${styles.chartYearButton} ${
                                                isSelected
                                                    ? styles.chartYearSelected
                                                    : ""
                                            }`}
                                            key={year.year}
                                            type="button"
                                            onClick={() =>
                                                setSelectedYear(year.year)
                                            }
                                            aria-pressed={isSelected}
                                            aria-label={`Select year ${year.year}: ${year.births} births and ${year.deaths} deaths`}
                                        >
                                            <div className={styles.chartBars}>
                                                <div
                                                    className={`${styles.chartBar} ${styles.birthBar}`}
                                                    style={{
                                                        height: `${birthHeight}%`,
                                                    }}
                                                    title={`${year.births} births in ${year.year}`}
                                                />
                                                <div
                                                    className={`${styles.chartBar} ${styles.deathBar}`}
                                                    style={{
                                                        height: `${deathHeight}%`,
                                                    }}
                                                    title={`${year.deaths} deaths in ${year.year}`}
                                                />
                                            </div>

                                            <Text
                                                className={
                                                    styles.chartYearLabel
                                                }
                                                size="xs"
                                                ta="center"
                                            >
                                                {year.year}
                                            </Text>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selected && (
                            <Stack
                                className={styles.selectedYearPanel}
                                gap="lg"
                            >
                                <div>
                                    <Title order={3} size="h4">
                                        Year {selected.year}
                                    </Title>

                                    <Group gap="xs" mt={6}>
                                        <Text size="sm" c="dimmed">
                                            {selected.births}{" "}
                                            {selected.births === 1
                                                ? "birth"
                                                : "births"}
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            ·
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            {selected.deaths}{" "}
                                            {selected.deaths === 1
                                                ? "death"
                                                : "deaths"}
                                        </Text>
                                    </Group>
                                </div>

                                <div className={styles.yearEventSection}>
                                    <Title order={4} size="h5">
                                        Born this year
                                    </Title>

                                    {selected.birthColonists.length === 0 ? (
                                        <Text c="dimmed" size="sm" mt="xs">
                                            No recorded births.
                                        </Text>
                                    ) : (
                                        <div
                                            className={styles.yearColonistList}
                                        >
                                            {selected.birthColonists.map(
                                                (colonist) => (
                                                    <Link
                                                        className={
                                                            styles.yearColonist
                                                        }
                                                        href={`/colonists/${colonist.id}`}
                                                        key={colonist.id}
                                                    >
                                                        <Avatar
                                                            src={
                                                                colonist.imageURL
                                                                    ? `/api/images/${colonist.imageURL}`
                                                                    : null
                                                            }
                                                            size={42}
                                                            radius="md"
                                                        >
                                                            {colonist.firstName
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </Avatar>

                                                        <Stack gap={2}>
                                                            <Text
                                                                className={
                                                                    styles.yearColonistName
                                                                }
                                                                size="sm"
                                                                fw={600}
                                                                style={{
                                                                    color:
                                                                        colonist
                                                                            .legacy
                                                                            ?.color ||
                                                                        undefined,
                                                                }}
                                                            >
                                                                {getColonistName(
                                                                    colonist
                                                                )}
                                                            </Text>

                                                            {colonist.legacy && (
                                                                <Text
                                                                    size="xs"
                                                                    c="dimmed"
                                                                >
                                                                    {
                                                                        colonist
                                                                            .legacy
                                                                            .name
                                                                    }
                                                                </Text>
                                                            )}
                                                        </Stack>
                                                    </Link>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.yearEventSection}>
                                    <Title order={4} size="h5">
                                        Died this year
                                    </Title>

                                    {selected.deathColonists.length === 0 ? (
                                        <Text c="dimmed" size="sm" mt="xs">
                                            No recorded deaths.
                                        </Text>
                                    ) : (
                                        <div
                                            className={styles.yearColonistList}
                                        >
                                            {selected.deathColonists.map(
                                                (colonist) => (
                                                    <Link
                                                        className={
                                                            styles.yearColonist
                                                        }
                                                        href={`/colonists/${colonist.id}`}
                                                        key={colonist.id}
                                                    >
                                                        <Avatar
                                                            src={
                                                                colonist.imageURL
                                                                    ? `/api/images/${colonist.imageURL}`
                                                                    : null
                                                            }
                                                            size={42}
                                                            radius="md"
                                                        >
                                                            {colonist.firstName
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </Avatar>

                                                        <Stack gap={2}>
                                                            <Text
                                                                className={
                                                                    styles.yearColonistName
                                                                }
                                                                size="sm"
                                                                fw={600}
                                                                style={{
                                                                    color:
                                                                        colonist
                                                                            .legacy
                                                                            ?.color ||
                                                                        undefined,
                                                                }}
                                                            >
                                                                {getColonistName(
                                                                    colonist
                                                                )}
                                                            </Text>

                                                            {colonist.legacy && (
                                                                <Text
                                                                    size="xs"
                                                                    c="dimmed"
                                                                >
                                                                    {
                                                                        colonist
                                                                            .legacy
                                                                            .name
                                                                    }
                                                                </Text>
                                                            )}
                                                        </Stack>
                                                    </Link>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Stack>
                        )}
                    </>
                )}
            </Stack>
        </Card>
    );
}
