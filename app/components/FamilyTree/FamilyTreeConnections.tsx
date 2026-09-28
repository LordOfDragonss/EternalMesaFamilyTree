"use client";

import {
Blend,
Heart,
HeartCrack,
} from "lucide-react";

type FamilyTreeParentChild = {
parentId: number;
childId: number;
type: "Biological" | "Surrogate" | "Other";
};

type FamilyTreePartnership = {
partnerAId: number;
partnerBId: number;
type: "Lover" | "Married" | "Ex";
};

type PositionedNode = {
colonist: {
id: number;
legacy: {
color: string | null;
} | null;
};
x: number;
y: number;
generation: number;
};

type Props = {
parentChildren: FamilyTreeParentChild[];
partnerships: FamilyTreePartnership[];
nodeMap: Map<number, PositionedNode>;
nodeHeight: number;
};

function getParentLineStyle(
type: FamilyTreeParentChild["type"],
childLegacyColor: string | null
) {
const color =
childLegacyColor ?? "#3f3f46";


switch (type) {
    case "Biological":
        return {
            color,
            strokeWidth: 3,
            dash: undefined,
        };

    case "Surrogate":
        return {
            color,
            strokeWidth: 3,
            dash: "8 6",
        };

    case "Other":
        return {
            color: "#3f3f46",
            strokeWidth: 3,
            dash: "3 5",
        };
}


}

function getPartnershipLineStyle(
type: FamilyTreePartnership["type"]
) {
switch (type) {
case "Lover":
return {
color: "#D66B9A",
strokeWidth: 3,
dash: undefined,
Icon: Heart,
};


    case "Married":
        return {
            color: "#D4A84F",
            strokeWidth: 3,
            dash: undefined,
            Icon: Blend,
        };

    case "Ex":
        return {
            color: "#52525B",
            strokeWidth: 2,
            dash: "6 6",
            Icon: HeartCrack,
        };
}


}

export default function FamilyTreeConnections({
parentChildren,
partnerships,
nodeMap,
nodeHeight,
}: Props) {
const partnershipConnections =
partnerships.flatMap(
(relationship) => {
const a =
nodeMap.get(
relationship.partnerAId
);


            const b =
                nodeMap.get(
                    relationship.partnerBId
                );

            if (
                !a ||
                !b ||
                a.generation !==
                    b.generation
            ) {
                return [];
            }

            const style =
                getPartnershipLineStyle(
                    relationship.type
                );

            const midX =
                (a.x + b.x) / 2;

            const midY =
                (a.y + b.y) / 2;

            const iconSize = 16;
            const iconRadius = 13;
            const lineGap = 15;

            const dx = b.x - a.x;
            const dy = b.y - a.y;

            const length =
                Math.sqrt(
                    dx * dx +
                        dy * dy
                );

            if (length === 0) {
                return [];
            }

            const ux =
                dx / length;

            const uy =
                dy / length;

            const gapStartX =
                midX -
                ux * lineGap;

            const gapStartY =
                midY -
                uy * lineGap;

            const gapEndX =
                midX +
                ux * lineGap;

            const gapEndY =
                midY +
                uy * lineGap;

            return [
                {
                    id: `partnership-${relationship.partnerAId}-${relationship.partnerBId}`,
                    style,
                    Icon: style.Icon,
                    a,
                    b,
                    midX,
                    midY,
                    iconSize,
                    iconRadius,
                    gapStartX,
                    gapStartY,
                    gapEndX,
                    gapEndY,
                },
            ];
        }
    );

return (
    <svg
        className="pointer-events-none absolute left-0 top-0 overflow-visible"
        style={{
            width: 1,
            height: 1,
        }}
    >
        {parentChildren.map(
            (relationship) => {
                const parent =
                    nodeMap.get(
                        relationship.parentId
                    );

                const child =
                    nodeMap.get(
                        relationship.childId
                    );

                if (
                    !parent ||
                    !child
                ) {
                    return null;
                }

                const style =
                    getParentLineStyle(
                        relationship.type,
                        child.colonist.legacy?.color ??
                            null
                    );

                return (
                    <line
                        key={`parent-${relationship.parentId}-${relationship.childId}`}
                        x1={parent.x}
                        y1={
                            parent.y +
                            nodeHeight / 2
                        }
                        x2={child.x}
                        y2={
                            child.y -
                            nodeHeight / 2
                        }
                        stroke={style.color}
                        strokeWidth={
                            style.strokeWidth
                        }
                        strokeDasharray={
                            style.dash
                        }
                    />
                );
            }
        )}

        {/* Partnership lines */}
        {partnershipConnections.map(
            (connection) => {
                const {
                    style,
                    a,
                    b,
                    gapStartX,
                    gapStartY,
                    gapEndX,
                    gapEndY,
                    id,
                } = connection;

                return (
                    <g key={id}>
                        <line
                            x1={a.x}
                            y1={a.y}
                            x2={gapStartX}
                            y2={gapStartY}
                            stroke={
                                style.color
                            }
                            strokeWidth={
                                style.strokeWidth
                            }
                            strokeDasharray={
                                style.dash
                            }
                        />

                        <line
                            x1={gapEndX}
                            y1={gapEndY}
                            x2={b.x}
                            y2={b.y}
                            stroke={
                                style.color
                            }
                            strokeWidth={
                                style.strokeWidth
                            }
                            strokeDasharray={
                                style.dash
                            }
                        />
                    </g>
                );
            }
        )}

        {/* Partnership icons */}
        {partnershipConnections.map(
            (connection) => {
                const {
                    style,
                    Icon,
                    midX,
                    midY,
                    iconSize,
                    iconRadius,
                    id,
                } = connection;

                return (
                    <g key={`${id}-icon`}>
                        <circle
                            cx={midX}
                            cy={midY}
                            r={iconRadius}
                            fill="#161616"
                            stroke={
                                style.color
                            }
                            strokeWidth={2}
                        />

                        <Icon
                            x={
                                midX -
                                iconSize / 2
                            }
                            y={
                                midY -
                                iconSize / 2
                            }
                            width={
                                iconSize
                            }
                            height={
                                iconSize
                            }
                            color={
                                style.color
                            }
                            strokeWidth={2.5}
                        />
                    </g>
                );
            }
        )}
    </svg>
);


}
