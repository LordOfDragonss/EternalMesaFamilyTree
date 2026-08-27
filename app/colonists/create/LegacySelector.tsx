"use client";

import {
    Button,
    ColorInput,
    Group,
    Select,
    Stack,
    Text,
    TextInput,
    Textarea,
} from "@mantine/core";
import { Plus, X } from "lucide-react";
import { useState } from "react";

type LegacyOption = {
    value: string;
    label: string;
    color: string | null;
};

type LegacySelectorProps = {
    legacyOptions: LegacyOption[];
    defaultValue?: string | null;
};

export default function LegacySelector({
    legacyOptions,
    defaultValue = null,
}: LegacySelectorProps) {
    const [creatingLegacy, setCreatingLegacy] = useState(false);

    function cancelCreateLegacy() {
        setCreatingLegacy(false);
    }

    if (creatingLegacy) {
        return (
            <Stack gap="md">
                <div>
                    <Text fw={600}>Create new legacy</Text>

                    <Text size="xs" c="dimmed">
                        This colonist will become the founding colonist of
                        the new legacy.
                    </Text>
                </div>

                <Group
                    align="flex-end"
                    wrap="nowrap"
                    gap="sm"
                >
                    <TextInput
                        name="legacyName"
                        label="Name"
                        placeholder="Legacy name"
                        required
                        style={{ flex: 1 }}
                    />

                    <ColorInput
                        name="legacyColor"
                        label="Color"
                        placeholder="Choose a color"
                        swatches={[
                            "#8B4513",
                            "#A0522D",
                            "#CD853F",
                            "#556B2F",
                            "#4682B4",
                            "#6A5ACD",
                            "#8B5A83",
                            "#B22222",
                        ]}
                        style={{ width: 180 }}
                    />
                </Group>

                <Textarea
                    name="legacyDescription"
                    label="Description"
                    placeholder="Describe this family line..."
                    autosize
                    minRows={2}
                    maxRows={4}
                />

                <Group>
                    <Button
                        type="button"
                        variant="light"
                        color="mesa"
                        leftSection={<X size={16} />}
                        onClick={cancelCreateLegacy}
                    >
                        Cancel
                    </Button>
                </Group>

                <input
                    type="hidden"
                    name="createLegacy"
                    value="true"
                />
            </Stack>
        );
    }

    return (
        <Group
            align="flex-end"
            wrap="nowrap"
            gap="sm"
        >
            <Select
                name="legacyId"
                label="Legacy"
                placeholder="No legacy"
                data={legacyOptions}
                defaultValue={defaultValue}
                clearable
                searchable
                style={{ flex: 1 }}
                renderOption={({ option }) => {
                    if (option.value === "none") {
                        return (
                            <span>
                                No legacy
                            </span>
                        );
                    }

                    const legacy = legacyOptions.find(
                        (legacy) =>
                            legacy.value === option.value
                    );

                    return (
                        <span
                            style={
                                legacy?.color
                                    ? {
                                        color: legacy.color,
                                    }
                                    : undefined
                            }
                        >
                            {option.label}
                        </span>
                    );
                }}
            />

            <Button
                type="button"
                variant="light"
                color="mesa"
                leftSection={<Plus size={16} />}
                onClick={() =>
                    setCreatingLegacy(true)
                }
            >
                Create new legacy
            </Button>
        </Group>
    );
}