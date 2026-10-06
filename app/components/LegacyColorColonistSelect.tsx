"use client";

import {
    Select,
    type SelectProps,
} from "@mantine/core";
import { useEffect, useState } from "react";

export type LegacyColorColonistOption = {
    value: string;
    label: string;
    color: string | null;
};

type Props = Omit<SelectProps, "data" | "renderOption"> & {
    data: LegacyColorColonistOption[];
};

export default function LegacyColorColonistSelect({
    data,
    value,
    defaultValue,
    onChange,
    styles,
    ...props
}: Props) {
    const [selectedValue, setSelectedValue] =
        useState<string | null>(
            value ?? defaultValue ?? null
        );

    useEffect(() => {
        if (value !== undefined) {
            setSelectedValue(value);
        }
    }, [value]);

    const selectedColonist = data.find(
        (colonist) =>
            colonist.value === selectedValue
    );

    const selectedColor =
        selectedColonist?.color ??
        "var(--mantine-color-text)";

    return (
        <Select
            {...props}
            data={data}
            value={value}
            defaultValue={defaultValue}
            onChange={(newValue, option) => {
                setSelectedValue(newValue);
                onChange?.(newValue, option);
            }}
            styles={(theme, props, ctx) => {
                const baseStyles =
                    typeof styles === "function"
                        ? styles(theme, props, ctx)
                        : styles;

                return {
                    ...baseStyles,
                    input: {
                        ...(typeof baseStyles?.input ===
                        "object"
                            ? baseStyles.input
                            : {}),
                        color: selectedColor,
                    },
                };
            }}
            renderOption={({ option }) => {
                const colonist = data.find(
                    (colonist) =>
                        colonist.value === option.value
                );

                return (
                    <span
                        style={{
                            color:
                                colonist?.color ??
                                "#a0a0a0",
                        }}
                    >
                        {option.label}
                    </span>
                );
            }}
        />
    );
}