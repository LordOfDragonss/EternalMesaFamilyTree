"use client";

import {
    Group,
    Select,
    TextInput,
} from "@mantine/core";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";
import {
    useEffect,
    useState,
} from "react";

type LegacyFiltersProps = {
    initialSearch: string;
    initialColor: string;
};

export default function LegacyFilters({
    initialSearch,
    initialColor,
}: LegacyFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] =
        useState(initialSearch);

    const [color, setColor] =
        useState(initialColor);

    /*
     * ---------------------------------------------------------
     * Update the URL while preserving all other parameters.
     * ---------------------------------------------------------
     */
    function updateParams(
        updates: Record<
            string,
            string | null
        >
    ) {
        const params = new URLSearchParams(
            searchParams.toString()
        );

        for (const [key, value] of Object.entries(
            updates
        )) {
            params.delete(key);

            if (value) {
                params.set(key, value);
            }
        }

        const query = params.toString();

        router.replace(
            query
                ? `${pathname}?${query}`
                : pathname
        );
    }

    /*
     * ---------------------------------------------------------
     * Update search after the user stops typing.
     * ---------------------------------------------------------
     */
    useEffect(() => {
        const timeout = setTimeout(() => {
            updateParams({
                search: search.trim()
                    ? search.trim()
                    : null,
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    function handleColorChange(
        value: string | null
    ) {
        const newValue = value ?? "";

        setColor(newValue);

        updateParams({
            color: newValue || null,
        });
    }

    return (
        <Group
            mb="xl"
            align="flex-end"
            grow
        >
            <TextInput
                label="Search"
                placeholder="Search by name..."
                value={search}
                onChange={(event) =>
                    setSearch(
                        event.currentTarget.value
                    )
                }
            />

            <Select
                label="Color"
                placeholder="Any color"
                data={[
                    {
                        value: "with",
                        label: "Has color",
                    },
                    {
                        value: "without",
                        label: "No color",
                    },
                ]}
                value={color || null}
                onChange={handleColorChange}
                clearable
            />
        </Group>
    );
}
