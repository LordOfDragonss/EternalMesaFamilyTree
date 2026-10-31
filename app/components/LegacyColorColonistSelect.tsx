"use client";

import {
    Group,
    Select,
    Tooltip,
    type SelectProps,
} from "@mantine/core";
import { Blend, Heart } from "lucide-react";
import { useEffect, useState } from "react";

export type LegacyColorColonistOption = {
    value: string;
    label: string;
    color: string | null;
    partnership?: {
        type: "Lover" | "Married";
        partnerName?: string;
    } | null;
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
        (colonist) => colonist.value === selectedValue
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
                        ...(typeof baseStyles?.input === "object"
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

                const partnership = colonist?.partnership;

                return (
                    <Group
                        justify="space-between"
                        wrap="nowrap"
                        gap="sm"
                        w="100%"
                    >
                        <span
                            style={{
                                color:
                                    colonist?.color ?? "#a0a0a0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {option.label}
                        </span>

                        {partnership && (
                            <Tooltip
                                label={
                                    partnership.partnerName
                                        ? `${partnership.type} of ${partnership.partnerName}`
                                        : `Current ${partnership.type.toLowerCase()}`
                                }
                                position="right"
                                withArrow
                            >
                                {partnership.type === "Lover" ? (
                                    <Heart
                                        size={15}
                                        color="#D66B9A"
                                        fill="#D66B9A"
                                        style={{ flexShrink: 0 }}
                                    />
                                ) : (
                                    <Blend
                                        size={15}
                                        color="#D4A84F"
                                        style={{ flexShrink: 0 }}
                                    />
                                )}
                            </Tooltip>
                        )}
                    </Group>
                );
            }}
        />
    );
}