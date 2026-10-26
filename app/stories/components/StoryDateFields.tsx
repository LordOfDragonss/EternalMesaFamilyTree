"use client";

import {
    Group,
    NativeSelect,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import {
    STORY_DATE_MONTHS,
    type StoryDateEndpoint,
} from "../types";

export default function StoryDateFields({
    label,
    value,
    onChange,
}: {
    label: string;
    value: StoryDateEndpoint;
    onChange: (date: StoryDateEndpoint) => void;
}) {
    return (
        <Stack gap="xs">
            <Text size="sm" c="dimmed">
                {label}
            </Text>

            <Group grow align="flex-start">
                <NativeSelect
                    label="Day"
                    value={value.day}
                    disabled={!value.month}
                    onChange={(event) =>
                        onChange({
                            ...value,
                            day: event.currentTarget.value,
                        })
                    }
                    data={[
                        { value: "", label: "Not set" },
                        ...Array.from({ length: 15 }, (_, index) => {
                            const day = String(index + 1);
                            return { value: day, label: day };
                        }),
                    ]}
                />

                <NativeSelect
                    label="Month"
                    value={value.month}
                    onChange={(event) => {
                        const month = event.currentTarget.value;

                        onChange({
                            ...value,
                            month,
                            day: month ? value.day : "",
                        });
                    }}
                    data={[
                        { value: "", label: "Not set" },
                        ...STORY_DATE_MONTHS.map((month) => ({
                            value: month,
                            label: month,
                        })),
                    ]}
                />

                <TextInput
                    label="Year"
                    value={value.year}
                    onChange={(event) =>
                        onChange({
                            ...value,
                            year: event.currentTarget.value,
                        })
                    }
                    inputMode="numeric"
                />
            </Group>

            <Select
                label="Certainty"
                data={[
                    { value: "exact", label: "Exact" },
                    { value: "approximate", label: "Approximate" },
                ]}
                value={value.approximate ? "approximate" : "exact"}
                onChange={(next) => {
                    if (next === "exact" || next === "approximate") {
                        onChange({
                            ...value,
                            approximate: next === "approximate",
                        });
                    }
                }}
                allowDeselect={false}
            />
        </Stack>
    );
}