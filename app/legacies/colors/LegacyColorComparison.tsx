"use client";

import {
    Accordion,
    ActionIcon,
    Button,
    Card,
    ColorInput,
    Group,
    Modal,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Copy, X, Plus } from "lucide-react";
import { useState } from "react";
import {
    colorDistance,
    getColorDistanceLabel,
    getColorFamily,
    getColorFamilyColor
} from "@/app/lib/colorUtils";
import LegacyColorPreview from "./LegacyColorPreview";

type LegacyColor = {
    id: number;
    name: string;
    color: string | null;
};

type LegacyColorComparisonProps = {
    legacies: LegacyColor[];
};

export default function LegacyColorComparison({
    legacies,
}: LegacyColorComparisonProps) {
    const [candidates, setCandidates] = useState([
        {
            id: 1,
            color: "#ffffff",
            compareLegacyId: null as number | null,
        },
    ]);
    const [nextCandidateId, setNextCandidateId] =
        useState(2);
    const [applyCandidateId, setApplyCandidateId] =
        useState<number | null>(null);

    const [applyLegacyId, setApplyLegacyId] =
        useState<number | null>(null);

    const comparisons = candidates.map((candidate) => {
        const matches = legacies
            .filter(
                (legacy): legacy is LegacyColor & {
                    color: string;
                } => legacy.color !== null
            )
            .filter(
                (legacy) =>
                    legacy.id !== candidate.compareLegacyId
            )
            .map((legacy) => ({
                ...legacy,
                distance: colorDistance(
                    candidate.color,
                    legacy.color
                ),
            }))
            .sort(
                (a, b) => a.distance - b.distance
            );

        return {
            candidate,
            matches,
        };
    });
    const candidateComparisons = candidates.map((candidate, index) => {
        return {
            candidate,
            comparisons: candidates.slice(index + 1).map((otherCandidate) => ({
                candidate: otherCandidate,
                distance: colorDistance(
                    candidate.color,
                    otherCandidate.color
                ),
            })),
        };
    });
    const coloredLegacies = legacies.filter(
        (legacy): legacy is LegacyColor & { color: string } =>
            legacy.color !== null
    );

    const paletteComparisons = coloredLegacies
        .flatMap((legacy, index) =>
            coloredLegacies.slice(index + 1).map((otherLegacy) => ({
                first: legacy,
                second: otherLegacy,
                distance: colorDistance(
                    legacy.color,
                    otherLegacy.color
                ),
            }))
        )
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);

    const comparisonMap = new Map(
        comparisons.map((comparison) => [
            comparison.candidate.id,
            comparison.matches,
        ])
    );
    const colorFamilies = new Map<
        string,
        (LegacyColor & { color: string })[]
    >();

    legacies.forEach((legacy) => {
        if (legacy.color === null) {
            return;
        }

        const coloredLegacy: LegacyColor & { color: string } = {
            ...legacy,
            color: legacy.color,
        };

        const family = getColorFamily(legacy.color);

        const existing = colorFamilies.get(family) ?? [];
        existing.push(coloredLegacy);
        colorFamilies.set(family, existing);
    });
    const colorFamilyOrder = [
        "Red",
        "Orange",
        "Yellow",
        "Green",
        "Cyan",
        "Blue",
        "Purple",
        "Pink",
        "Brown",
        "Neutral",
    ];
    const colorFamilySummary = colorFamilyOrder
        .map((family) => ({
            family,
            count: colorFamilies.get(family)?.length ?? 0,
        }))
        .filter((item) => item.count > 0);
    const applyCandidate = candidates.find(
        (candidate) => candidate.id === applyCandidateId
    );

    const applyLegacy = legacies.find(
        (legacy) => legacy.id === applyLegacyId
    );
    return (
        <Stack gap="xl">
            <div>
                <Title order={1}>
                    Legacy Color Comparison
                </Title>

                <Text c="dimmed" mt={4}>
                    Experiment with a color and compare it
                    against the existing legacy palette.
                </Text>
            </div>
            {/*Candidates Section*/}
            <div>
                <Group justify="space-between" mb="md">
                    <div>
                        <Title order={2} size="h3">
                            Candidates
                        </Title>

                        <Text size="sm" c="dimmed" mt={2}>
                            Try different colors and compare them against
                            the existing palette.
                        </Text>
                    </div>

                    <Button
                        leftSection={<Plus size={16} />}
                        onClick={() => {
                            setCandidates((current) => [
                                ...current,
                                {
                                    id: nextCandidateId,
                                    color: "#ffffff",
                                    compareLegacyId: null,
                                }
                            ]);

                            setNextCandidateId(
                                (current) => current + 1
                            );
                        }}
                    >
                        Add candidate
                    </Button>
                </Group>

                <SimpleGrid
                    cols={{
                        base: 1,
                        sm: 2,
                        lg: 3,
                    }}
                    spacing="md"
                >
                    {candidates.map((candidate, index) => (
                        <div key={candidate.id}>
                            <div
                                style={{
                                    aspectRatio: "16 / 9",
                                    borderRadius: 10,
                                    backgroundColor:
                                        candidate.color,
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "space-between",
                                    padding: "1rem",
                                    boxShadow:
                                        "0 4px 16px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                <Text
                                    fw={700}
                                    c="white"
                                    style={{
                                        textShadow:
                                            "0 1px 5px rgba(0, 0, 0, 0.6)",
                                    }}
                                >
                                    Candidate {index + 1}
                                </Text>

                                <Text
                                    fw={600}
                                    ff="monospace"
                                    c="white"
                                    style={{
                                        textShadow:
                                            "0 1px 5px rgba(0, 0, 0, 0.6)",
                                    }}
                                >
                                    {candidate.color.toUpperCase()}
                                </Text>
                            </div>
                            <div>
                                <Group
                                    mt="xs"
                                    align="flex-end"
                                    justify="space-between"
                                >
                                    <Group align="flex-end" gap="md">
                                        <Group align="flex-end" gap="xs">
                                            <ColorInput
                                                label="Color"
                                                value={candidate.color}
                                                onChange={(value) => {
                                                    setCandidates((current) =>
                                                        current.map((item) =>
                                                            item.id === candidate.id
                                                                ? {
                                                                    ...item,
                                                                    color: value,
                                                                }
                                                                : item
                                                        )
                                                    );
                                                }}
                                                format="hex"
                                                withPicker
                                            />

                                            <Group gap={6} mb={8}>
                                                <div
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: 3,
                                                        backgroundColor: getColorFamilyColor(
                                                            getColorFamily(candidate.color)
                                                        ),
                                                        flexShrink: 0,
                                                    }}
                                                />

                                                <Text size="sm" c="dimmed">
                                                    {getColorFamily(candidate.color)}
                                                </Text>
                                            </Group>
                                        </Group>

                                        <Select
                                            label="Compare to legacy"
                                            placeholder="None"
                                            clearable
                                            searchable
                                            data={coloredLegacies.map((legacy) => ({
                                                value: legacy.id.toString(),
                                                label: legacy.name,
                                            }))}
                                            value={
                                                candidate.compareLegacyId !== null
                                                    ? candidate.compareLegacyId.toString()
                                                    : null
                                            }
                                            onChange={(value) => {
                                                setCandidates((current) =>
                                                    current.map((item) =>
                                                        item.id === candidate.id
                                                            ? {
                                                                ...item,
                                                                compareLegacyId:
                                                                    value !== null
                                                                        ? Number(value)
                                                                        : null,
                                                            }
                                                            : item
                                                    )
                                                );
                                            }}
                                        />
                                    </Group>

                                    {candidates.length > 1 && (
                                        <Tooltip label="Remove candidate">
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={() => {
                                                    setCandidates((current) =>
                                                        current.filter(
                                                            (item) =>
                                                                item.id !== candidate.id
                                                        )
                                                    );
                                                }}
                                                aria-label={`Remove candidate ${index + 1}`}
                                            >
                                                <X size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            </div>
                            <Button
                                mt="md"
                                variant="light"
                                onClick={() => {
                                    setApplyCandidateId(candidate.id);
                                    setApplyLegacyId(candidate.compareLegacyId);
                                }}
                            >
                                Apply to legacy
                            </Button>

                            <div style={{ marginTop: "1rem" }}>
                                <LegacyColorPreview
                                    color={candidate.color}
                                />
                            </div>

                            {candidate.compareLegacyId !== null &&
                                (() => {
                                    const comparedLegacy = coloredLegacies.find(
                                        (legacy) =>
                                            legacy.id === candidate.compareLegacyId
                                    );

                                    if (!comparedLegacy) {
                                        return null;
                                    }

                                    const distance = colorDistance(
                                        candidate.color,
                                        comparedLegacy.color
                                    );

                                    return (
                                        <div style={{ marginTop: "1rem" }}>
                                            <Text size="sm" fw={600} mb="xs">
                                                Direct comparison
                                            </Text>

                                            <Group
                                                gap="sm"
                                                wrap="nowrap"
                                                style={{
                                                    padding: "0.75rem",
                                                    borderRadius: 8,
                                                    border: "1px solid var(--mantine-color-default-border)",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        flexShrink: 0,
                                                        borderRadius: 6,
                                                        backgroundColor:
                                                            comparedLegacy.color,
                                                        boxShadow:
                                                            "0 2px 8px rgba(0, 0, 0, 0.2)",
                                                    }}
                                                />

                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <Text fw={600} truncate>
                                                        {comparedLegacy.name}
                                                    </Text>

                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                        ff="monospace"
                                                    >
                                                        {comparedLegacy.color.toUpperCase()}
                                                    </Text>
                                                </div>

                                                <Text c="dimmed">
                                                    ↔
                                                </Text>

                                                <div
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        flexShrink: 0,
                                                        borderRadius: 6,
                                                        backgroundColor:
                                                            candidate.color,
                                                        boxShadow:
                                                            "0 2px 8px rgba(0, 0, 0, 0.2)",
                                                    }}
                                                />

                                                <div
                                                    style={{
                                                        flexShrink: 0,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    <Text
                                                        size="sm"
                                                        fw={700}
                                                        ff="monospace"
                                                    >
                                                        ΔE {distance.toFixed(1)}
                                                    </Text>

                                                    <Text size="xs" c="dimmed">
                                                        {getColorDistanceLabel(distance)}
                                                    </Text>
                                                </div>
                                            </Group>
                                        </div>
                                    );
                                })()}
                            <div style={{ marginTop: "1rem" }}>
                                <Text size="sm" fw={600} mb="xs">
                                    {candidate.compareLegacyId !== null
                                        ? "Closest other legacy colors"
                                        : "Closest existing colors"}
                                </Text>

                                <Stack gap="xs">
                                    {comparisonMap
                                        .get(candidate.id)
                                        ?.slice(0, 3)
                                        .map((match, matchIndex) => (
                                            <Group
                                                key={match.id}
                                                gap="sm"
                                                wrap="nowrap"
                                                style={{
                                                    padding: "0.5rem",
                                                    borderRadius: 8,
                                                    border:
                                                        matchIndex === 0
                                                            ? "2px solid #A96E28"
                                                            : "2px solid transparent",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        flexShrink: 0,
                                                        borderRadius: 6,
                                                        backgroundColor: match.color,
                                                        boxShadow:
                                                            "0 2px 8px rgba(0, 0, 0, 0.2)",
                                                    }}
                                                />

                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <Text
                                                        fw={matchIndex === 0 ? 700 : 600}
                                                        truncate
                                                    >
                                                        {match.name}
                                                    </Text>

                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                        ff="monospace"
                                                    >
                                                        {match.color.toUpperCase()}
                                                    </Text>
                                                </div>

                                                <div style={{ flexShrink: 0, textAlign: "right" }}>
                                                    <Text
                                                        size="sm"
                                                        fw={matchIndex === 0 ? 700 : 400}
                                                        c={matchIndex === 0 ? undefined : "dimmed"}
                                                        ff="monospace"
                                                    >
                                                        ΔE {match.distance.toFixed(1)}
                                                    </Text>

                                                    <Text size="xs" c="dimmed">
                                                        {getColorDistanceLabel(match.distance)}
                                                    </Text>
                                                </div>
                                            </Group>
                                        ))}
                                </Stack>
                            </div>
                        </div>
                    ))}
                </SimpleGrid>
                {candidates.length > 1 && (
                    <div style={{ marginTop: "1.5rem" }}>
                        <Text size="sm" fw={600} mb="sm">
                            Candidate comparison
                        </Text>

                        <Stack gap="xs">
                            {candidateComparisons.map((row) =>
                                row.comparisons.map((comparison) => {
                                    const firstIndex =
                                        candidates.findIndex(
                                            (candidate) =>
                                                candidate.id === row.candidate.id
                                        ) + 1;

                                    const secondIndex =
                                        candidates.findIndex(
                                            (candidate) =>
                                                candidate.id === comparison.candidate.id
                                        ) + 1;

                                    return (
                                        <Group
                                            key={`${row.candidate.id}-${comparison.candidate.id}`}
                                            justify="space-between"
                                            wrap="nowrap"
                                            style={{
                                                padding: "0.75rem",
                                                borderRadius: 8,
                                                border: "1px solid var(--mantine-color-default-border)",
                                            }}
                                        >
                                            <Group gap="sm" wrap="nowrap">
                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        flexShrink: 0,
                                                        borderRadius: 6,
                                                        backgroundColor:
                                                            row.candidate.color,
                                                    }}
                                                />

                                                <Text fw={600}>
                                                    Candidate {firstIndex}
                                                </Text>

                                                <Text c="dimmed">
                                                    vs.
                                                </Text>

                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        flexShrink: 0,
                                                        borderRadius: 6,
                                                        backgroundColor:
                                                            comparison.candidate.color,
                                                    }}
                                                />

                                                <Text fw={600}>
                                                    Candidate {secondIndex}
                                                </Text>
                                            </Group>

                                            <div
                                                style={{
                                                    flexShrink: 0,
                                                    textAlign: "right",
                                                }}
                                            >
                                                <Text
                                                    size="sm"
                                                    fw={600}
                                                    ff="monospace"
                                                >
                                                    ΔE {comparison.distance.toFixed(1)}
                                                </Text>

                                                <Text size="xs" c="dimmed">
                                                    {getColorDistanceLabel(
                                                        comparison.distance
                                                    )}
                                                </Text>
                                            </div>
                                        </Group>
                                    );
                                })
                            )}
                        </Stack>
                    </div>
                )}
            </div>
            <div>
                <Title order={2} size="h3" mb="sm">
                    Palette summary
                </Title>

                <SimpleGrid
                    cols={{
                        base: 2,
                        xs: 3,
                        sm: 4,
                        md: 5,
                        lg: 6,
                    }}
                    spacing="sm"
                >
                    {colorFamilySummary.map(({ family, count }) => (
                        <div
                            key={family}
                            style={{
                                padding: "0.75rem",
                                borderRadius: 8,
                                border: "1px solid var(--mantine-color-default-border)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 3,
                                    backgroundColor:
                                        getColorFamilyColor(family),
                                    flexShrink: 0,
                                }}
                            />

                            <Text size="sm" fw={600}>
                                {family}
                            </Text>

                            <Text size="sm" c="dimmed" ml="auto">
                                {count}
                            </Text>
                        </div>
                    ))}
                </SimpleGrid>
            </div>
            <Accordion
                multiple
                defaultValue={["existing-colors"]}
            >
                {/* Palette Comparison */}
                <Accordion.Item value="palette-comparison">
                    <Accordion.Control>
                        <div>
                            <Text fw={600}>
                                Palette comparison
                            </Text>

                            <Text size="sm" c="dimmed">
                                View the closest color relationships within the existing palette.
                            </Text>
                        </div>
                    </Accordion.Control>

                    <Accordion.Panel>
                        {paletteComparisons.length === 0 ? (
                            <Text c="dimmed">
                                Not enough legacy colors to compare.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {paletteComparisons.map((comparison) => (
                                    <Group
                                        key={`${comparison.first.id}-${comparison.second.id}`}
                                        justify="space-between"
                                        wrap="nowrap"
                                        style={{
                                            padding: "0.75rem",
                                            borderRadius: 8,
                                            border: "1px solid var(--mantine-color-default-border)",
                                        }}
                                    >
                                        <Group gap="sm" wrap="nowrap">
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    flexShrink: 0,
                                                    borderRadius: 6,
                                                    backgroundColor:
                                                        comparison.first.color,
                                                    boxShadow:
                                                        "0 2px 8px rgba(0, 0, 0, 0.2)",
                                                }}
                                            />

                                            <Text fw={600} truncate>
                                                {comparison.first.name}
                                            </Text>

                                            <Text c="dimmed">
                                                ↔
                                            </Text>

                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    flexShrink: 0,
                                                    borderRadius: 6,
                                                    backgroundColor:
                                                        comparison.second.color,
                                                    boxShadow:
                                                        "0 2px 8px rgba(0, 0, 0, 0.2)",
                                                }}
                                            />

                                            <Text fw={600} truncate>
                                                {comparison.second.name}
                                            </Text>
                                        </Group>

                                        <div
                                            style={{
                                                flexShrink: 0,
                                                textAlign: "right",
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                fw={600}
                                                ff="monospace"
                                            >
                                                ΔE {comparison.distance.toFixed(1)}
                                            </Text>

                                            <Text size="xs" c="dimmed">
                                                {getColorDistanceLabel(
                                                    comparison.distance
                                                )}
                                            </Text>
                                        </div>
                                    </Group>
                                ))}
                            </Stack>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
                {/* Color Families */}
                <Accordion.Item value="color-families">
                    <Accordion.Control>
                        <div>
                            <Text fw={600}>
                                Color families
                            </Text>

                            <Text size="sm" c="dimmed">
                                View the existing palette grouped by approximate color family.
                            </Text>
                        </div>
                    </Accordion.Control>

                    <Accordion.Panel>
                        <Stack gap="xl">
                            {colorFamilyOrder.map((family) => {
                                const familyLegacies = colorFamilies.get(family);

                                if (!familyLegacies || familyLegacies.length === 0) {
                                    return null;
                                }

                                return (
                                    <div key={family}>
                                        <Text fw={600} mb="sm">
                                            {family}
                                        </Text>

                                        <SimpleGrid
                                            cols={{
                                                base: 2,
                                                xs: 3,
                                                sm: 4,
                                                md: 5,
                                                lg: 6,
                                            }}
                                            spacing="md"
                                        >
                                            {familyLegacies.map((legacy) => (
                                                <div key={legacy.id}>
                                                    <div
                                                        style={{
                                                            aspectRatio: "1 / 1",
                                                            borderRadius: 8,
                                                            backgroundColor: legacy.color,
                                                            display: "flex",
                                                            alignItems: "flex-end",
                                                            padding: "0.75rem",
                                                            boxShadow:
                                                                "0 2px 8px rgba(0, 0, 0, 0.25)",
                                                        }}
                                                    >
                                                        <Text
                                                            fw={700}
                                                            c="white"
                                                            style={{
                                                                textShadow:
                                                                    "0 1px 4px rgba(0, 0, 0, 0.6)",
                                                            }}
                                                        >
                                                            {legacy.name}
                                                        </Text>
                                                    </div>
                                                    <Group gap={4} align="center">
                                                        <Text
                                                            size="sm"
                                                            c="dimmed"
                                                            ff="monospace"
                                                        >
                                                            {legacy.color?.toUpperCase()}
                                                        </Text>

                                                        <Tooltip label="Copy color">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="subtle"
                                                                onClick={() => {
                                                                    if (legacy.color) {
                                                                        navigator.clipboard.writeText(
                                                                            legacy.color
                                                                        );
                                                                    }
                                                                }}
                                                                aria-label={`Copy ${legacy.name} color`}
                                                            >
                                                                <Copy size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                </div>
                                            ))}
                                        </SimpleGrid>
                                    </div>
                                );
                            })}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                {/* Existing legacy Colors */}
                <Accordion.Item value="existing-colors">
                    <Accordion.Control>
                        <div>
                            <Text fw={600}>
                                Existing legacy colors
                            </Text>

                            <Text size="sm" c="dimmed">
                                View all currently assigned legacy colors.
                            </Text>
                        </div>
                    </Accordion.Control>

                    <Accordion.Panel>
                        <SimpleGrid
                            cols={{
                                base: 2,
                                xs: 3,
                                sm: 4,
                                md: 5,
                                lg: 6,
                            }}
                            spacing="md"
                        >
                            {legacies.map((legacy) => (
                                <div key={legacy.id}>
                                    <div
                                        style={{
                                            aspectRatio: "1 / 1",
                                            borderRadius: 8,
                                            backgroundColor:
                                                legacy.color ?? "#3a3a3a",
                                            display: "flex",
                                            alignItems: "flex-end",
                                            padding: "0.75rem",
                                            boxShadow:
                                                "0 2px 8px rgba(0, 0, 0, 0.25)",
                                        }}
                                    >
                                        <Text
                                            fw={700}
                                            c="white"
                                            style={{
                                                textShadow:
                                                    "0 1px 4px rgba(0, 0, 0, 0.6)",
                                            }}
                                        >
                                            {legacy.name}
                                        </Text>
                                    </div>

                                    <Group gap={4} align="center">
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            ff="monospace"
                                        >
                                            {legacy.color?.toUpperCase()}
                                        </Text>

                                        <Tooltip label="Copy color">
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                onClick={() => {
                                                    if (legacy.color) {
                                                        navigator.clipboard.writeText(
                                                            legacy.color
                                                        );
                                                    }
                                                }}
                                                aria-label={`Copy ${legacy.name} color`}
                                            >
                                                <Copy size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </div>
                            ))}
                        </SimpleGrid>

                        {legacies.length === 0 && (
                            <Text c="dimmed">
                                No legacy colors have been assigned yet.
                            </Text>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
            <Modal
                opened={applyCandidateId !== null}
                onClose={() => {
                    setApplyCandidateId(null);
                    setApplyLegacyId(null);
                }}
                title="Apply candidate color"
            >
                <Stack>
                    <Select
                        label="Legacy"
                        placeholder="Select a legacy"
                        searchable
                        data={legacies.map((legacy) => ({
                            value: legacy.id.toString(),
                            label: legacy.name,
                        }))}
                        value={
                            applyLegacyId !== null
                                ? applyLegacyId.toString()
                                : null
                        }
                        onChange={(value) => {
                            setApplyLegacyId(
                                value !== null
                                    ? Number(value)
                                    : null
                            );
                        }}
                    />

                    {applyCandidate && (
                        <div>
                            <Text size="sm" fw={600} mb="xs">
                                Color preview
                            </Text>

                            <div
                                style={{
                                    height: 120,
                                    borderRadius: 10,
                                    backgroundColor: applyCandidate.color,
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "space-between",
                                    padding: "1rem",
                                    boxShadow:
                                        "0 4px 16px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                <Text
                                    fw={700}
                                    c="white"
                                    style={{
                                        textShadow:
                                            "0 1px 5px rgba(0, 0, 0, 0.6)",
                                    }}
                                >
                                    Candidate
                                </Text>

                                <Text
                                    fw={600}
                                    ff="monospace"
                                    c="white"
                                    style={{
                                        textShadow:
                                            "0 1px 5px rgba(0, 0, 0, 0.6)",
                                    }}
                                >
                                    {applyCandidate.color.toUpperCase()}
                                </Text>
                            </div>
                        </div>
                    )}

                    {applyLegacy && (
                        <Text size="sm" c="dimmed">
                            {applyLegacy.color
                                ? `This will replace ${applyLegacy.name}'s current color (${applyLegacy.color.toUpperCase()}).`
                                : `This will assign this color to ${applyLegacy.name}.`}
                        </Text>
                    )}

                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            onClick={() => {
                                setApplyCandidateId(null);
                                setApplyLegacyId(null);
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={applyLegacyId === null}
                            onClick={async () => {
                                if (!applyCandidate || applyLegacyId === null) {
                                    return;
                                }

                                try {
                                    const response = await fetch(
                                        `/api/legacies/${applyLegacyId}/color`,
                                        {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                                color: applyCandidate.color,
                                            }),
                                        }
                                    );

                                    if (!response.ok) {
                                        const data = await response.json();
                                        throw new Error(
                                            data.error || "Failed to apply color"
                                        );
                                    }

                                    setApplyCandidateId(null);
                                    setApplyLegacyId(null);

                                    window.location.reload();
                                } catch (error) {
                                    console.error("Failed to apply legacy color:", error);
                                }
                            }}
                        >
                            Apply color
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}