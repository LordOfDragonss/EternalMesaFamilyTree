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
import { useRouter } from "next/navigation";
import { useState } from "react";

type Trait = {
    id: number;
    defName: string;
    name: string | null;
    description: string | null;
};

type ColonistTrait = {
    traitId: number;
    trait: Trait;
};

type TraitCardProps = {
    colonistId: number;
    initialTraits: ColonistTrait[];
    traits: Trait[];
};

export default function TraitCard({
    colonistId,
    initialTraits,
    traits,
}: TraitCardProps) {
    const router = useRouter();

    const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const assignedTraitIds = new Set(
        initialTraits.map((colonistTrait) => colonistTrait.traitId)
    );

    const availableTraits = traits
        .filter((trait) => !assignedTraitIds.has(trait.id))
        .map((trait) => ({
            value: trait.id.toString(),
            label: trait.name ?? trait.defName,
        }));

    const addTrait = async () => {
        if (!selectedTrait || loading) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `/api/colonists/${colonistId}/traits`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        traitId: Number(selectedTrait),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to add trait.");
            }

            setSelectedTrait(null);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const removeTrait = async (traitId: number) => {
        if (loading) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `/api/colonists/${colonistId}/traits/${traitId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to remove trait.");
            }

            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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
                    <Title order={3}>Traits</Title>

                    <Text c="dimmed" size="sm" mt={2}>
                        Traits this colonist possesses.
                    </Text>
                </div>

                {initialTraits.length === 0 ? (
                    <Text c="dimmed">
                        This colonist has no traits recorded.
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
                        {initialTraits.map((colonistTrait) => {
                            const traitName =
                                colonistTrait.trait.name ??
                                colonistTrait.trait.defName;

                            return (
                                <Tooltip
                                    key={colonistTrait.traitId}
                                    label={
                                        colonistTrait.trait.description ??
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
                                            border: "1px solid #292929",
                                            borderRadius: 6,
                                            backgroundColor: "#1d1d1d",
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
                                                minWidth: 0,
                                            }}
                                        >
                                            {traitName}
                                        </Text>

                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            onClick={() =>
                                                removeTrait(
                                                    colonistTrait.traitId
                                                )
                                            }
                                            disabled={loading}
                                        >
                                            <X size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Tooltip>
                            );
                        })}
                    </SimpleGrid>
                )}

                <Group align="flex-end">
                    <Select
                        searchable
                        clearable
                        data={availableTraits}
                        value={selectedTrait}
                        onChange={setSelectedTrait}
                        placeholder="Search traits..."
                        nothingFoundMessage="No traits found"
                        style={{ flex: 1 }}
                    />

                    <Tooltip label="Add trait">
                        <ActionIcon
                            variant="filled"
                            color="mesa"
                            size="lg"
                            onClick={addTrait}
                            disabled={!selectedTrait || loading}
                        >
                            <Plus size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Stack>
        </Card>
    );
}