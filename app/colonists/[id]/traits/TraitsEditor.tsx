"use client";

import {
    ActionIcon,
    Card,
    Group,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

export type CreateTrait = {
    traitId: number;
    trait: {
        id: number;
        defName: string;
        name: string | null;
        description: string | null;
    };
};

type Trait = {
    id: number;
    defName: string;
    name: string | null;
    description: string | null;
};

type TraitsEditorProps = {
    mode: "create";
    traits: Trait[];
};

export default function TraitsEditor({
    traits,
}: TraitsEditorProps) {
    const [selectedTrait, setSelectedTrait] =
        useState<string | null>(null);

    const [selectedTraits, setSelectedTraits] =
        useState<CreateTrait[]>([]);

    const availableTraits = useMemo(() => {
        const selectedIds = new Set(
            selectedTraits.map(
                (trait) => trait.traitId
            )
        );

        return traits
            .filter(
                (trait) =>
                    !selectedIds.has(trait.id)
            )
            .map((trait) => ({
                value: trait.id.toString(),
                label:
                    trait.name ??
                    trait.defName,
            }));
    }, [traits, selectedTraits]);

    function addTrait() {
        if (!selectedTrait) {
            return;
        }

        const traitId =
            Number(selectedTrait);

        const trait =
            traits.find(
                (trait) =>
                    trait.id === traitId
            );

        if (!trait) {
            return;
        }

        setSelectedTraits(
            (current) => [
                ...current,
                {
                    traitId: trait.id,
                    trait,
                },
            ]
        );

        setSelectedTrait(null);
    }

    function removeTrait(
        traitId: number
    ) {
        setSelectedTraits(
            (current) =>
                current.filter(
                    (trait) =>
                        trait.traitId !==
                        traitId
                )
        );
    }

    return (
        <Card
            shadow="sm"
            padding="xl"
            radius="md"
            withBorder
            bg="#161616"
            style={{
                borderColor: "#292929",
            }}
        >
            <Stack gap="md">
                <div>
                    <Title order={3}>
                        Traits
                    </Title>

                    <Text
                        c="dimmed"
                        size="sm"
                        mt={2}
                    >
                        Traits this colonist possesses.
                    </Text>
                </div>

                {selectedTraits.length === 0 ? (
                    <Text c="dimmed">
                        No traits selected.
                    </Text>
                ) : (
                    <SimpleGrid
                        cols={{
                            base: 1,
                            sm: 2,
                            md: 3,
                        }}
                        spacing="sm"
                    >
                        {selectedTraits.map(
                            (colonistTrait) => {
                                const traitName =
                                    colonistTrait.trait
                                        .name ??
                                    colonistTrait.trait
                                        .defName;

                                return (
                                    <Tooltip
                                        key={
                                            colonistTrait.traitId
                                        }
                                        label={
                                            colonistTrait
                                                .trait
                                                .description ??
                                            "No description available."
                                        }
                                        multiline
                                        maw={320}
                                        withArrow
                                    >
                                        <Group
                                            gap="xs"
                                            justify="space-between"
                                            wrap="nowrap"
                                            style={{
                                                border:
                                                    "1px solid #292929",
                                                borderRadius: 6,
                                                backgroundColor:
                                                    "#1d1d1d",
                                                padding:
                                                    "0.65rem 0.75rem",
                                                minHeight: 44,
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                fw={500}
                                                truncate
                                                style={{
                                                    minWidth:
                                                        0,
                                                }}
                                            >
                                                {
                                                    traitName
                                                }
                                            </Text>

                                            <ActionIcon
                                                type="button"
                                                variant="subtle"
                                                color="red"
                                                size="sm"
                                                onClick={() =>
                                                    removeTrait(
                                                        colonistTrait.traitId
                                                    )
                                                }
                                            >
                                                <X
                                                    size={
                                                        14
                                                    }
                                                />
                                            </ActionIcon>
                                        </Group>
                                    </Tooltip>
                                );
                            }
                        )}
                    </SimpleGrid>
                )}

                <Group align="flex-end">
                    <Select
                        searchable
                        clearable
                        data={availableTraits}
                        value={
                            selectedTrait
                        }
                        onChange={
                            setSelectedTrait
                        }
                        placeholder="Search traits..."
                        nothingFoundMessage="No traits found"
                        style={{
                            flex: 1,
                        }}
                    />

                    <Tooltip label="Add trait">
                        <ActionIcon
                            type="button"
                            variant="filled"
                            color="mesa"
                            size="lg"
                            onClick={
                                addTrait
                            }
                            disabled={
                                !selectedTrait
                            }
                        >
                            <Plus
                                size={18}
                            />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {selectedTraits.map(
                    (trait) => (
                        <input
                            key={
                                trait.traitId
                            }
                            type="hidden"
                            name="traitId[]"
                            value={
                                trait.traitId
                            }
                        />
                    )
                )}
            </Stack>
        </Card>
    );
}