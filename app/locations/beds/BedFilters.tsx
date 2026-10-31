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

type BedFiltersProps = {
    initialLocation: string;
    initialSearch: string;
    locations: {
        value: string;
        label: string;
    }[];
};

export default function BedFilters({
    initialLocation,
    initialSearch,
    locations,
}: BedFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(initialSearch);

    function updateParams(
        updates: Record<string, string | null>
    ) {
        const params = new URLSearchParams(
            searchParams.toString()
        );

        for (const [key, value] of Object.entries(updates)) {
            params.delete(key);

            if (value) {
                params.set(key, value);
            }
        }

        const query = params.toString();

        router.replace(
            query ? `${pathname}?${query}` : pathname
        );
    }

    /*
     * Update the search parameter after the user
     * stops typing.
     */
    useEffect(() => {
        const timeout = setTimeout(() => {
            updateParams({
                search: search.trim() || null,
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    function handleLocationChange(value: string | null) {
        updateParams({
            location: value,
        });
    }

    return (
        <Group mb="xl" align="flex-end">
            <TextInput
                label="Search"
                placeholder="Search by bed name..."
                value={search}
                onChange={(event) =>
                    setSearch(event.currentTarget.value)
                }
                w={{ base: "100%", sm: 280 }}
            />
            <Select
                label="Location"
                placeholder="All locations"
                data={locations}
                value={initialLocation || null}
                onChange={handleLocationChange}
                clearable
                searchable
                w={{ base: "100%", sm: 280 }}
            />
        </Group>
    );
}