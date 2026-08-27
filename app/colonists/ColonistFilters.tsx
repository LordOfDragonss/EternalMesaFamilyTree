"use client";

import {
    Group,
    MultiSelect,
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

type LegacyOption = {
    value: string;
    label: string;
    color: string | null;
};

type GroupOption = {
    value: string;
    label: string;
};

type ColonistFiltersProps = {
    legacyOptions: LegacyOption[];
    groupOptions: GroupOption[];
    initialSearch: string;
    initialLegacies: string[];
    initialGroups: string[];
    initialStatus: string;
    initialPortrait: string;
    initialRelationships: string[];
};

const relationshipOptions = [
    {
        value: "partner",
        label: "Has partner",
    },
    {
        value: "noPartner",
        label: "No partner",
    },
    {
        value: "parent",
        label: "Has parents",
    },
    {
        value: "noParent",
        label: "No parents",
    },
    {
        value: "child",
        label: "Has children",
    },
    {
        value: "noChild",
        label: "No children",
    },
];

export default function ColonistFilters({
    legacyOptions,
    groupOptions,
    initialSearch,
    initialLegacies,
    initialGroups,
    initialStatus,
    initialPortrait,
    initialRelationships,
}: ColonistFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] =
        useState(initialSearch);

    const [legacies, setLegacies] =
        useState(initialLegacies);

    const [groups, setGroups] =
        useState(initialGroups);

    const [status, setStatus] =
        useState(initialStatus);

    const [portrait, setPortrait] =
        useState(initialPortrait);

    const [relationships, setRelationships] =
        useState(initialRelationships);

    /*
     * ---------------------------------------------------------
     * Legacy options
     *
     * Normal value:
     *   1
     *
     * Excluded value:
     *   !1
     *
     * Special:
     *   none
     *   !none
     * ---------------------------------------------------------
     */

    const legacyFilterOptions = [
        {
            value: "none",
            label: "No legacy",
            type: "include",
        },
        {
            value: "!none",
            label: "Exclude no legacy",
            type: "exclude",
        },
        ...legacyOptions.flatMap((legacy) => [
            {
                value: legacy.value,
                label: `${legacy.label}`,
                type: "include",
            },
            {
                value: `!${legacy.value}`,
                label: `Exclude ${legacy.label}`,
                type: "exclude",
            },
        ]),
    ];

    /*
     * Update the URL while preserving all other filters.
     */
    function updateParams(
        updates: Record<
            string,
            string[] | string | null
        >
    ) {
        const params = new URLSearchParams(
            searchParams.toString()
        );

        for (const [key, value] of Object.entries(
            updates
        )) {
            params.delete(key);

            if (Array.isArray(value)) {
                for (const item of value) {
                    params.append(key, item);
                }
            } else if (value) {
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
     * Update the search parameter after the user
     * stops typing.
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

    function handleLegacyChange(
        values: string[]
    ) {
        setLegacies(values);

        updateParams({
            legacy: values,
        });
    }

    function handleGroupChange(
        values: string[]
    ) {
        setGroups(values);

        updateParams({
            group: values,
        });
    }

    function handleStatusChange(
        value: string | null
    ) {
        const newValue = value ?? "";

        setStatus(newValue);

        updateParams({
            status: newValue || null,
        });
    }

    function handlePortraitChange(
        value: string | null
    ) {
        const newValue = value ?? "";

        setPortrait(newValue);

        updateParams({
            portrait: newValue || null,
        });
    }

    function handleRelationshipChange(
        values: string[]
    ) {
        setRelationships(values);

        updateParams({
            relationship: values,
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

            <MultiSelect
                label="Legacy"
                placeholder="All legacies"
                data={legacyFilterOptions}
                value={legacies}
                onChange={handleLegacyChange}
                clearable
                searchable
                renderOption={({ option }) => {
                    if (
                        option.value === "none"
                    ) {
                        return (
                            <span>
                                No legacy
                            </span>
                        );
                    }

                    if (
                        option.value === "!none"
                    ) {
                        return (
                            <span>
                                Exclude no legacy
                            </span>
                        );
                    }

                    const excluded =
                        option.value.startsWith(
                            "!"
                        );

                    const legacyValue =
                        excluded
                            ? option.value.slice(1)
                            : option.value;

                    const legacy =
                        legacyOptions.find(
                            (legacy) =>
                                legacy.value ===
                                legacyValue
                        );

                    return (
                        <span
                            style={
                                legacy?.color
                                    ? {
                                        color:
                                            legacy.color,
                                    }
                                    : undefined
                            }
                        >
                            {option.label}
                        </span>
                    );
                }}
            />

            <MultiSelect
                label="Group"
                placeholder="All groups"
                data={[
                    {
                        value: "none",
                        label: "No group",
                    },
                    ...groupOptions,
                ]}
                value={groups}
                onChange={handleGroupChange}
                clearable
                searchable
            />

            <MultiSelect
                label="Relationships"
                placeholder="Any relationships"
                data={relationshipOptions}
                value={relationships}
                onChange={
                    handleRelationshipChange
                }
                clearable
            />

            <MultiSelect
                label="Status"
                placeholder="Any status"
                data={[
                    {
                        value: "alive",
                        label: "Alive",
                    },
                    {
                        value: "dead",
                        label: "Dead",
                    },
                ]}
                value={
                    status
                        ? [status]
                        : []
                }
                onChange={(values) =>
                    handleStatusChange(
                        values[0] ?? null
                    )
                }
                clearable
            />

            <MultiSelect
                label="Portrait"
                placeholder="Any portrait"
                data={[
                    {
                        value: "with",
                        label: "Has portrait",
                    },
                    {
                        value: "without",
                        label: "No portrait",
                    },
                ]}
                value={
                    portrait
                        ? [portrait]
                        : []
                }
                onChange={(values) =>
                    handlePortraitChange(
                        values[0] ?? null
                    )
                }
                clearable
            />
        </Group>
    );
}
