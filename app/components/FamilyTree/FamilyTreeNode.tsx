import Image from "next/image";
import { Skull } from "lucide-react";
import type { RefObject } from "react";

type FamilyTreeNodeColonist = {
    id: number;
    firstName: string;
    nickname: string | null;
    lastName: string;
    isDead: boolean;
    imageURL: string | null;
};

type FamilyTreeNodePosition = {
    x: number;
    y: number;
};

type FamilyTreeNodeProps = {
    colonist: FamilyTreeNodeColonist;
    node: FamilyTreeNodePosition;
    legacyColor: string;
    name: string;
    isHighlighted: boolean;
    hasDragged: RefObject<boolean>;
    onFocus: () => void;
    onHighlight: () => void;
};

export default function FamilyTreeNode({
    colonist,
    node,
    legacyColor,
    name,
    isHighlighted,
    hasDragged,
    onFocus,
    onHighlight,
}: FamilyTreeNodeProps) {
    return (
        <div
            className="absolute"
            style={{
                left:
                    node.x -
                    208 / 2,

                top:
                    node.y -
                    100 / 2,

                width: 208,
                height: 100,
            }}
        >
            <a
                href={`/colonists/${colonist.id}`}
                onClick={(event) => {
                    if (hasDragged.current) {
                        event.preventDefault();
                        return;
                    }

                    event.preventDefault();
                    onHighlight();
                    onFocus();
                }}
                onDoubleClick={(event) => {
                    event.preventDefault();
                    window.location.href =
                        `/colonists/${colonist.id}`;
                }}
                className="relative block h-full w-full rounded-xl border bg-zinc-800 p-4 shadow-xl transition-all duration-200 hover:scale-105 hover:border-[var(--legacy-color)] hover:shadow-[var(--legacy-shadow)]"
                style={
                    {
                        borderColor: legacyColor,
                        "--legacy-color": legacyColor,
                        "--legacy-shadow": `0 0 20px ${legacyColor}55`,
                        transform: isHighlighted
                            ? "scale(1.05)"
                            : undefined,
                        boxShadow: isHighlighted
                            ? `0 0 20px ${legacyColor}55`
                            : undefined,
                    } as React.CSSProperties
                }
            >
                {colonist.isDead && (
                    <div
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800/90 text-zinc-500"
                        title="Deceased"
                    >
                        <Skull
                            size={14}
                            strokeWidth={2}
                        />
                    </div>
                )}

                <div className="flex h-full items-center gap-3">
                    {colonist.imageURL ? (
                        <Image
                            src={`/api/images/${colonist.imageURL}`}
                            alt={name}
                            width={56}
                            height={72}
                            draggable={false}
                            className={`h-[72px] w-14 flex-shrink-0 rounded-lg object-cover ${
                                colonist.isDead
                                    ? "grayscale-[70%]"
                                    : ""
                            }`}
                        />
                    ) : (
                        <div
                            className={`flex h-[72px] w-14 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-600 text-xl text-zinc-400 ${
                                colonist.isDead
                                    ? "grayscale-[70%]"
                                    : ""
                            }`}
                        >
                            ?
                        </div>
                    )}

                    <div className="min-w-0">
                        <div
                            className={`truncate font-medium ${
                                colonist.isDead
                                    ? "text-zinc-500"
                                    : "text-white"
                            }`}
                        >
                            {colonist.firstName}{" "}
                            {colonist.nickname &&
                                `"${colonist.nickname}"`}
                        </div>

                        <div
                            className={`truncate text-sm ${
                                colonist.isDead
                                    ? "text-zinc-600"
                                    : "text-zinc-400"
                            }`}
                        >
                            {colonist.lastName}
                        </div>
                    </div>
                </div>
            </a>
        </div>
    );
}