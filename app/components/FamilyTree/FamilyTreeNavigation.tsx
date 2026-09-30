"use client";

import React from "react";
import {
    Focus,
    Crown,
    UsersRound,
    X,
    TreePine,
} from "lucide-react";

type NavigationColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    legacy: {
        name: string;
        color: string | null;
    } | null;
};

type Props = {
    focusedColonist: NavigationColonist | null;
    familyFocus: boolean;
    legacyFocus: boolean;
    onShowFullTree: () => void;
    onFocusFamily: () => void;
    onFocusLegacy: () => void;
    onRefocus: () => void;
    onUnfocus: () => void;
};

function getColonistName(
    colonist: NavigationColonist
) {
    return `${colonist.firstName}${colonist.nickname
        ? ` "${colonist.nickname}"`
        : ""
        } ${colonist.lastName}`;
}

export default function FamilyTreeNavigation({
    focusedColonist,
    familyFocus,
    legacyFocus,
    onShowFullTree,
    onFocusFamily,
    onFocusLegacy,
    onRefocus,
    onUnfocus,
}: Props) {
    if (!focusedColonist) {
        return null;
    }

    const legacyColor =
        focusedColonist.legacy?.color ??
        "#52525B";

    const name =
        getColonistName(
            focusedColonist
        );

    return (
        <div
            className="absolute left-4 top-20 z-30"
            style={{
                maxWidth: "calc(100vw - 2rem)",
            }}
        >
            <div
                className="rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 shadow-xl backdrop-blur-sm"
                style={{
                    borderLeftColor:
                        legacyColor,
                    borderLeftWidth:
                        4,
                }}
            >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0">
                        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            {familyFocus
                                ? "Family Focus"
                                : legacyFocus
                                    ? "Legacy Focus"
                                    : "Focused on"}
                        </div>

                        <div
                            className="truncate font-medium text-white"
                            style={{
                                color:
                                    legacyColor,
                            }}
                        >
                            {name}
                        </div>

                        {focusedColonist.legacy && (
                            <div
                                className="text-xs"
                                style={{
                                    color:
                                        focusedColonist
                                            .legacy
                                            .color ??
                                        "#A1A1AA",
                                }}
                            >
                                {
                                    focusedColonist
                                        .legacy
                                        .name
                                }
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                        {!familyFocus && (
                            <button
                                type="button"
                                onClick={
                                    onFocusFamily
                                }
                                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
                            >
                                <UsersRound
                                    size={16}
                                />
                                Focus Family
                            </button>
                        )}

                        {!legacyFocus && (
                            <button
                                type="button"
                                onClick={
                                    onFocusLegacy
                                }
                                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
                            >
                                <Crown
                                    size={16}
                                />
                                Focus Legacy
                            </button>
                        )}

                        {(familyFocus ||
                            legacyFocus) && (
                                <button
                                    type="button"
                                    onClick={
                                        onShowFullTree
                                    }
                                    className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
                                >
                                    <TreePine
                                        size={16}
                                    />
                                    Show Full Tree
                                </button>
                            )}
                        <button
                            type="button"
                            onClick={onRefocus}
                            title="Refocus on colonist"
                            aria-label="Refocus on colonist"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
                        >
                            <Focus
                                size={16}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={onUnfocus}
                            title="Unfocus colonist"
                            aria-label="Unfocus colonist"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700"
                        >
                            <X
                                size={16}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}