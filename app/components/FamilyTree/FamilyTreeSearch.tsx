"use client";

import {
Paper,
Text,
TextInput,
} from "@mantine/core";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type FamilyTreeSearchColonist = {
id: number;
firstName: string;
nickname: string | null;
lastName: string;
legacy: {
color: string | null;
} | null;
};

type FamilyTreeSearchProps = {
colonists: FamilyTreeSearchColonist[];
onSelect: (colonistId: number) => void;
};

export default function FamilyTreeSearch({
colonists,
onSelect,
}: FamilyTreeSearchProps) {
const [search, setSearch] = useState("");
const matches = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
        return [];
    }

    return colonists.filter((colonist) => {
        const name = [
            colonist.firstName,
            colonist.nickname,
            colonist.lastName,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return name.includes(query);
    });
}, [colonists, search]);

function handleSelect(colonistId: number) {
    onSelect(colonistId);
    setSearch("");
}

return (
    <div className="absolute left-1/2 top-4 z-20 w-80 -translate-x-1/2">
        <TextInput
            leftSection={<Search size={17} />}
            placeholder="Search family members..."
            value={search}
            onChange={(event) =>
                setSearch(event.currentTarget.value)
            }
        />

        {matches.length > 0 && (
            <Paper
                mt="xs"
                p="xs"
                withBorder
                shadow="md"
            >
                {matches.map((colonist) => {
                    const legacyColor =
                        colonist.legacy?.color ?? "#3f3f46";

                    return (
                        <button
                            key={colonist.id}
                            type="button"
                            onClick={() => handleSelect(colonist.id)}
                            className="block w-full rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                            onMouseEnter={(event) => {
                                event.currentTarget.style.borderColor =
                                    legacyColor;
                            }}
                            onMouseLeave={(event) => {
                                event.currentTarget.style.borderColor =
                                    "transparent";
                            }}
                        >
                            <Text
                                size="sm"
                                style={{
                                    color: legacyColor,
                                }}
                            >
                                {colonist.firstName}
                                {colonist.nickname &&
                                    ` "${colonist.nickname}"`}
                            </Text>

                            <Text
                                size="xs"
                                c="dimmed"
                            >
                                {colonist.lastName}
                            </Text>
                        </button>
                    );
                })}
            </Paper>
        )}

        {search.trim() && matches.length === 0 && (
            <Paper
                mt="xs"
                p="sm"
                withBorder
                shadow="md"
            >
                <Text size="sm" c="dimmed">
                    No family members found
                </Text>
            </Paper>
        )}
    </div>
);

}
