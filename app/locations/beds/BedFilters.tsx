
"use client";

import { Group, Select } from "@mantine/core";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

type BedFiltersProps = {
    initialLocation: string;
    locations: {
        value: string;
        label: string;
    }[];
};

export default function BedFilters({
    initialLocation,
    locations,
}: BedFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function handleLocationChange(value: string | null) {
        const params = new URLSearchParams(
            searchParams.toString()
        );

        params.delete("location");

        if (value) {
            params.set("location", value);
        }

        const query = params.toString();

        router.replace(
            query ? `${pathname}?${query}` : pathname
        );
    }

    return (
        <Group mb="xl" align="flex-end">
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
