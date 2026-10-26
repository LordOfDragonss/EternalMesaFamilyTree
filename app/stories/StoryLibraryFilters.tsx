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
import { STORY_TYPE_OPTIONS } from "./types";

type StoryLibraryFiltersProps = {
    initialSearch: string;
    initialStatus: string;
    initialType: string;
    initialSort: string;
};

export default function StoryLibraryFilters({
    initialSearch,
    initialStatus,
    initialType,
    initialSort,
}: StoryLibraryFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(initialSearch);

    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    function updateParams(
        updates: Record<string, string | null>,
    ) {
        const params = new URLSearchParams(
            searchParams.toString(),
        );

        for (const [key, value] of Object.entries(updates)) {
            params.delete(key);

            if (value) {
                params.set(key, value);
            }
        }

        const query = params.toString();

        router.replace(
            query ? `${pathname}?${query}` : pathname,
            { scroll: false },
        );
    }

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            const nextSearch = search.trim();
            const currentSearch = searchParams.get("search") ?? "";

            if (nextSearch === currentSearch) return;

            updateParams({
                search: nextSearch || null,
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, pathname, router, searchParams]);

    return (
        <Group
            mb="lg"
            align="flex-end"
            grow
            gap="sm"
            wrap="wrap"
        >
            <TextInput
                label="Search"
                placeholder="Titles, summaries, tags or collections..."
                value={search}
                onChange={(event) =>
                    setSearch(event.currentTarget.value)
                }
                style={{
                    flex: "2 1 280px",
                    minWidth: 0,
                }}
            />

            <Select
                label="Status"
                data={[
                    { value: "ALL", label: "All statuses" },
                    { value: "DRAFT", label: "Draft" },
                    { value: "COMPLETE", label: "Complete" },
                ]}
                value={initialStatus}
                onChange={(value) =>
                    updateParams({
                        status: value === "COMPLETE" ? null : value,
                    })
                }
                allowDeselect={false}
                style={{
                    flex: "1 1 130px",
                    minWidth: 0,
                }}
            />

            <Select
                label="Story type"
                placeholder="All types"
                data={STORY_TYPE_OPTIONS.map((type) => ({
                    value: type,
                    label: type,
                }))}
                value={initialType || null}
                onChange={(value) =>
                    updateParams({
                        type: value,
                    })
                }
                clearable
                searchable
                style={{
                    flex: "1 1 180px",
                    minWidth: 0,
                }}
            />

            <Select
                label="Sort by"
                data={[
                    {
                        value: "updated",
                        label: "Recently updated",
                    },
                    {
                        value: "created",
                        label: "Recently created",
                    },
                    {
                        value: "title",
                        label: "Title A–Z",
                    },
                ]}
                value={initialSort}
                onChange={(value) =>
                    updateParams({
                        sort: value === "updated" ? null : value,
                    })
                }
                allowDeselect={false}
                style={{
                    flex: "1 1 180px",
                    minWidth: 0,
                }}
            />
        </Group>
    );
}