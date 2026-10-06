"use client";

import {
    ActionIcon,
    Group,
    Select,
    Text,
    Tooltip,
} from "@mantine/core";
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Plus,
    Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Legacy = {
    color: string | null;
};

type Colonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    legacy: Legacy | null;
};

type Ownership = {
    id: number;
    order: number;
    colonist: Colonist;
};

type Props = {
    relicId: number;
    ownershipHistory: Ownership[];
    colonists: Colonist[];
    currentOwner: Colonist | null;
};

type ChainItem =
    | {
          type: "previous";
          ownership: Ownership;
      }
    | {
          type: "current";
          colonist: Colonist | null;
      };

function getColonistName(colonist: Colonist) {
    return `${colonist.firstName}${
        colonist.nickname
            ? ` "${colonist.nickname}"`
            : ""
    } ${colonist.lastName}`;
}

function getLegacyColor(colonist: Colonist) {
    return (
        colonist.legacy?.color ??
        "var(--mantine-color-text)"
    );
}

export default function RelicOwnershipHistory({
    relicId,
    ownershipHistory,
    colonists,
    currentOwner,
}: Props) {
    const [history, setHistory] =
        useState<Ownership[]>(ownershipHistory);

    const [selectedColonistId, setSelectedColonistId] =
        useState<string | null>(null);

    const [saving, setSaving] = useState(false);

    const chainRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        setHistory(ownershipHistory);
    }, [ownershipHistory]);

    useEffect(() => {
        const element = chainRef.current;

        if (!element) {
            return;
        }

        function updateColumns() {
            const width = element!.clientWidth;
            const itemWidth = 210;

            setColumns(
                Math.max(
                    1,
                    Math.floor(width / itemWidth)
                )
            );
        }

        updateColumns();

        const observer =
            new ResizeObserver(updateColumns);

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const availableColonists = useMemo(() => {
        const historyIds = new Set(
            history.map(
                (ownership) =>
                    ownership.colonist.id
            )
        );

        if (currentOwner) {
            historyIds.add(currentOwner.id);
        }

        return colonists.filter(
            (colonist) =>
                !historyIds.has(colonist.id)
        );
    }, [colonists, history, currentOwner]);

    const chainItems: ChainItem[] = [
        ...history.map((ownership) => ({
            type: "previous" as const,
            ownership,
        })),
        {
            type: "current" as const,
            colonist: currentOwner,
        },
    ];

    const rows: ChainItem[][] = [];

    for (
        let index = 0;
        index < chainItems.length;
        index += columns
    ) {
        rows.push(
            chainItems.slice(
                index,
                index + columns
            )
        );
    }

    async function getOwnershipHistory(
        relicId: number
    ) {
        const response = await fetch(
            `/api/relics/${relicId}/ownership`
        );

        if (!response.ok) {
            throw new Error(
                "Failed to fetch ownership history."
            );
        }

        return response.json();
    }

    async function addOwner() {
        if (!selectedColonistId) {
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `/api/relics/${relicId}/ownership`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        colonistId:
                            Number(
                                selectedColonistId
                            ),
                    }),
                }
            );

            if (!response.ok) {
                const data =
                    await response.json().catch(
                        () => null
                    );

                throw new Error(
                    data?.error ??
                        "Failed to add owner."
                );
            }

            const updatedHistory =
                await getOwnershipHistory(
                    relicId
                );

            setHistory(updatedHistory);
            setSelectedColonistId(null);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    async function moveOwner(
        ownershipId: number,
        direction: "up" | "down"
    ) {
        setSaving(true);

        try {
            const ownershipIndex =
                history.findIndex(
                    (ownership) =>
                        ownership.id ===
                        ownershipId
                );

            if (ownershipIndex === -1) {
                return;
            }

            const targetIndex =
                direction === "up"
                    ? ownershipIndex - 1
                    : ownershipIndex + 1;

            if (
                targetIndex < 0 ||
                targetIndex >= history.length
            ) {
                return;
            }

            const targetOrder =
                history[targetIndex].order;

            const response = await fetch(
                `/api/relics/${relicId}/ownership/${ownershipId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        order: targetOrder,
                    }),
                }
            );

            if (!response.ok) {
                const data =
                    await response.json().catch(
                        () => null
                    );

                throw new Error(
                    data?.error ??
                        "Failed to move owner."
                );
            }

            const updatedHistory =
                await response.json();

            setHistory(updatedHistory);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    async function deleteOwner(
        ownershipId: number
    ) {
        setSaving(true);

        try {
            const response = await fetch(
                `/api/relics/${relicId}/ownership/${ownershipId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const data =
                    await response.json().catch(
                        () => null
                    );

                throw new Error(
                    data?.error ??
                        "Failed to remove owner."
                );
            }

            const updatedHistory =
                await response.json();

            setHistory(updatedHistory);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <Group
                align="flex-end"
                gap="sm"
                mb="md"
            >
                <Select
                    label="Add previous owner"
                    placeholder="Select a colonist"
                    searchable
                    clearable
                    value={selectedColonistId}
                    onChange={
                        setSelectedColonistId
                    }
                    data={availableColonists.map(
                        (colonist) => ({
                            value: String(
                                colonist.id
                            ),
                            label: getColonistName(
                                colonist
                            ),
                        })
                    )}
                    style={{
                        flex: 1,
                        maxWidth: 400,
                    }}
                />

                <Tooltip label="Add previous owner">
                    <ActionIcon
                        type="button"
                        variant="filled"
                        color="mesa"
                        size="lg"
                        disabled={
                            !selectedColonistId ||
                            saving
                        }
                        loading={saving}
                        onClick={addOwner}
                        aria-label="Add previous owner"
                    >
                        <Plus size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <div
                ref={chainRef}
                style={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                }}
            >
                {rows.map(
                    (row, rowIndex) => (
                        <div
                            key={rowIndex}
                            style={{
                                display: "flex",
                                alignItems:
                                    "center",
                                gap: "0.5rem",
                                flexWrap:
                                    "nowrap",
                                marginBottom:
                                    rowIndex <
                                    rows.length -
                                        1
                                        ? "0.5rem"
                                        : 0,
                            }}
                        >
                            {row.map(
                                (
                                    item,
                                    index
                                ) => {
                                    const globalIndex =
                                        rowIndex *
                                            columns +
                                        index;

                                    const isLastInRow =
                                        index ===
                                        row.length -
                                            1;

                                    const isLastItem =
                                        globalIndex ===
                                        chainItems.length -
                                            1;

                                    if (
                                        item.type ===
                                        "current"
                                    ) {
                                        return (
                                            <div
                                                key="current-owner"
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: "0.5rem",
                                                    flex: "0 0 auto",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 165,
                                                        minWidth:
                                                            165,
                                                        padding:
                                                            "0.65rem 0.75rem",
                                                        border: item.colonist
                                                            ? "1px solid #292929"
                                                            : "1px dashed #444",
                                                        borderRadius:
                                                            "var(--mantine-radius-md)",
                                                        background:
                                                            "#111",
                                                        boxSizing:
                                                            "border-box",
                                                    }}
                                                >
                                                    {item.colonist ? (
                                                        <Text
                                                            component="a"
                                                            href={`/colonists/${item.colonist.id}`}
                                                            c={getLegacyColor(
                                                                item.colonist
                                                            )}
                                                            fw={
                                                                500
                                                            }
                                                            size="sm"
                                                            style={{
                                                                display:
                                                                    "block",
                                                                overflowWrap:
                                                                    "anywhere",
                                                                wordBreak:
                                                                    "break-word",
                                                            }}
                                                        >
                                                            {getColonistName(
                                                                item.colonist
                                                            )}
                                                        </Text>
                                                    ) : (
                                                        <Text
                                                            size="sm"
                                                            c="dimmed"
                                                        >
                                                            No current
                                                            owner
                                                        </Text>
                                                    )}
                                                </div>

                                                {!isLastInRow &&
                                                    !isLastItem && (
                                                        <ArrowRight
                                                            size={
                                                                18
                                                            }
                                                            style={{
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    )}
                                            </div>
                                        );
                                    }

                                    const ownership =
                                        item.ownership;

                                    return (
                                        <div
                                            key={
                                                ownership.id
                                            }
                                            style={{
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                gap: "0.5rem",
                                                flex: "0 0 auto",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 165,
                                                    minWidth:
                                                        165,
                                                    padding:
                                                        "0.65rem 0.75rem",
                                                    border: "1px solid #292929",
                                                    borderRadius:
                                                        "var(--mantine-radius-md)",
                                                    background:
                                                        "#111",
                                                    boxSizing:
                                                        "border-box",
                                                }}
                                            >
                                                <Text
                                                    component="a"
                                                    href={`/colonists/${ownership.colonist.id}`}
                                                    c={getLegacyColor(
                                                        ownership.colonist
                                                    )}
                                                    fw={
                                                        500
                                                    }
                                                    size="sm"
                                                    style={{
                                                        display:
                                                            "block",
                                                        overflowWrap:
                                                            "anywhere",
                                                        wordBreak:
                                                            "break-word",
                                                    }}
                                                >
                                                    {getColonistName(
                                                        ownership.colonist
                                                    )}
                                                </Text>

                                                <Group
                                                    gap={
                                                        2
                                                    }
                                                    mt={
                                                        6
                                                    }
                                                >
                                                    <Tooltip label="Move earlier">
                                                        <ActionIcon
                                                            type="button"
                                                            variant="subtle"
                                                            size="sm"
                                                            disabled={
                                                                globalIndex ===
                                                                    0 ||
                                                                saving
                                                            }
                                                            onClick={() =>
                                                                moveOwner(
                                                                    ownership.id,
                                                                    "up"
                                                                )
                                                            }
                                                            aria-label="Move owner earlier"
                                                        >
                                                            <ArrowLeft
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                        </ActionIcon>
                                                    </Tooltip>

                                                    <Tooltip label="Move later">
                                                        <ActionIcon
                                                            type="button"
                                                            variant="subtle"
                                                            size="sm"
                                                            disabled={
                                                                globalIndex ===
                                                                    history.length -
                                                                        1 ||
                                                                saving
                                                            }
                                                            onClick={() =>
                                                                moveOwner(
                                                                    ownership.id,
                                                                    "down"
                                                                )
                                                            }
                                                            aria-label="Move owner later"
                                                        >
                                                            <ArrowRight
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                        </ActionIcon>
                                                    </Tooltip>

                                                    <Tooltip label="Remove owner">
                                                        <ActionIcon
                                                            type="button"
                                                            variant="subtle"
                                                            color="red"
                                                            size="sm"
                                                            disabled={
                                                                saving
                                                            }
                                                            onClick={() =>
                                                                deleteOwner(
                                                                    ownership.id
                                                                )
                                                            }
                                                            aria-label="Remove owner"
                                                        >
                                                            <Trash2
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </div>

                                            {!isLastInRow &&
                                                !isLastItem && (
                                                    <ArrowRight
                                                        size={
                                                            18
                                                        }
                                                        style={{
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                        </div>
                                    );
                                }
                            )}

                            {rowIndex <
                                rows.length -
                                    1 && (
                                <ArrowDown
                                    size={18}
                                    style={{
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}