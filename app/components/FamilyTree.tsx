"use client";

import PersonCard from "./PersonCard";

import React, { useEffect, useRef, useState } from "react";

type FamilyNode = {
    id: string;
    name: string;
    parent: string | null;
    spouse: string | null;
};

const nodes: FamilyNode[] = [
    { id: "1", name: "Anna", parent: null, spouse: "2" },
    { id: "2", name: "Jay", parent: null, spouse: "1" },
    { id: "3", name: "Rexy", parent: "1", spouse: "4" },
    { id: "4", name: "Lion", parent: null, spouse: "3" },
    { id: "5", name: "Dr.Zoidberg", parent: "1", spouse: null },
    { id: "6", name: "Love", parent: "1", spouse: null },
    { id: "7", name: "Mimi", parent: "3", spouse: null },
];

type PositionedNode = FamilyNode & { x: number; y: number };
const xGap = 120;
const yGap = 180;

function buildMaps(nodes: FamilyNode[]) {
    const map = Object.fromEntries(nodes.map(n => [n.id, n]));

    const childrenMap = new Map<string, FamilyNode[]>();

    for (const n of nodes) {
        if (!n.parent) continue;

        if (!childrenMap.has(n.parent)) {
            childrenMap.set(n.parent, [])
        }
        childrenMap.get(n.parent)!.push(n);
    }

    return { map, childrenMap }
}

function getSubtreeWidth(
    nodeId: string,
    childrenMap: Map<string, FamilyNode[]>,
    visited = new Set<string>()
): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId)

    const children = childrenMap.get(nodeId) || [];

    if (children.length === 0) return 1;

    let width = 0;
    for (const child of children) {
        width += getSubtreeWidth(child.id, childrenMap, visited);
    }
    return Math.max(1, width);
}

function GetSpouseMap(nodes: FamilyNode[]) {
    const map = new Map<string, string | null>();
    for (const n of nodes) map.set(n.id, n.spouse ?? null);
    return map
}

function layoutTree(nodes: FamilyNode[]): PositionedNode[] {
    const { map, childrenMap } = buildMaps(nodes);

    const result: PositionedNode[] = [];
    const visited = new Set<string>();

    const spousePlaced = new Set<string>();

    let startX = 0;

    function placeCouple(a: FamilyNode,
        b: FamilyNode | null,
        xCenter: number,
        depth: number
    ) {
        const spouseGap = 100;
        const y = depth * yGap;

        if (b) {
            result.push({
                ...a,
                x: xCenter - spouseGap,
                y,
            });

            result.push({
                ...b,
                x: xCenter + spouseGap,
                y,
            });
        } else {
            result.push({ ...a, x: xCenter, y });
        }
    }
    function place(node: FamilyNode, depth: number, xOffset: number): number {
        if (visited.has(node.id)) return 0;
        visited.add(node.id);

        const spouse = node.spouse ? map[node.spouse] : null;
        const children = childrenMap.get(node.id) || [];

        const siblingGap = 120;

        let totalWidth = 0;
        const childCenters: number[] = [];

        // 1. Lay out children left → right in stable blocks
        for (const child of children) {
            const childX = xOffset + totalWidth;
            const w = place(child, depth + 1, childX);

            // store center of subtree block
            childCenters.push(childX + (w * xGap) / 2);

            totalWidth += w * xGap + siblingGap;
        }

        // 2. Ensure leaf nodes still take space
        if (children.length === 0) {
            totalWidth = xGap;
        }

        // 3. Compute center safely
        const centerX =
            children.length === 0
                ? xOffset + xGap / 2
                : xOffset + totalWidth / 2;

        const y = depth * yGap;

        // 4. Place node / spouse pair
        if (spouse && !spousePlaced.has(node.id) && !spousePlaced.has(spouse.id)) {
            spousePlaced.add(node.id);
            spousePlaced.add(spouse.id);

            const spouseGap = 100;

            result.push({
                ...node,
                x: centerX - spouseGap,
                y,
            });

            result.push({
                ...spouse,
                x: centerX + spouseGap,
                y,
            });
        } else if (!spouse) {
            result.push({
                ...node,
                x: centerX,
                y,
            });
        }

        return Math.max(totalWidth / xGap, 1);
    }


    const roots = nodes.filter(n => n.parent === null);
    let xCursor = 0;


    for (const root of roots) {
        const width = place(root, 0, xCursor);
        xCursor += width * xGap + 40;
    }

    return result
}


export default function FamilyTree() {
    const mode = useRef<"idle" | "drag" | "focus">("idle");
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    const targetPos = useRef({ x: 0, y: 0 });
    const targetZoom = useRef(1);

    const dragging = useRef(false);
    const last = useRef({ x: 0, y: 0 });

    useEffect(() => {
        let frame: number;


        const animate = () => {
            setPos((p) => ({
                x: p.x + (targetPos.current.x - p.x) * 0.12,
                y: p.y + (targetPos.current.y - p.y) * 0.12,
            }))

            setZoom((z) => z + (targetZoom.current - z) * 0.12)

            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (mode.current !== "idle") return;

        //autoFit();
    });

    // function autoFit() {
    //     if (mode.current !== "idle") return;
    //     const padding = 200;
    //     let minX = -Infinity;
    //     let maxX = -Infinity;
    //     let minY = Infinity;
    //     let maxY = Infinity;

    //     for (const n of nodes) {
    //         minX = Math.min(minX, n.x);
    //         maxX = Math.max(maxX, n.x);
    //         minY = Math.min(minY, n.y);
    //         maxY = Math.max(maxY, n.y);
    //     }

    //     const width = maxX - minX;
    //     const height = maxY - minY;

    //     const scaleX = window.innerWidth / (width + padding)
    //     const scaleY = window.innerHeight / (height + padding)

    //     const scale = Math.min(scaleX, scaleY, 1);

    //     const centerX = (minX + maxX) / 2;
    //     const centerY = (minY + maxY) / 2;

    //     targetZoom.current = scale;
    //     targetPos.current = {
    //         x: window.innerWidth / 2 - centerX * scale,
    //         y: window.innerHeight / 2 - centerY * scale,
    //     }
    // };




    function onMouseDown(e: React.MouseEvent) {
        mode.current = "drag";
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
    }


    function onMouseMove(e: React.MouseEvent) {
        if (mode.current !== "drag") return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;

        targetPos.current = {
            x: targetPos.current.x + dx,
            y: targetPos.current.y + dy,
        };
        last.current = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp() {
        dragging.current = false;
        mode.current = "idle";
    }

    function onWheel(e: React.WheelEvent) {
        targetZoom.current = Math.min(
            2,
            Math.max(0.5, targetZoom.current - e.deltaY * 0.001)
        )
    }

    function focusNode(node: { x: number; y: number }) {
        mode.current = "focus";
        targetPos.current = {
            x: window.innerWidth / 2 - node.x,
            y: window.innerHeight / 2 - node.y,
        };

        targetZoom.current = 1.5;

        // release back to idle after short delay
        setTimeout(() => {
            mode.current = "idle";
        }, 600);
    }
    const layoutNodes = layoutTree(nodes);
    console.log(
        layoutNodes.map(n => ({
            name: n.name,
            x: n.x,
            y: n.y
        }))
    );

    return (

        <div
            className="h-screen overflow-hidden bg-zinc-900 cursor-grab active:cursor-grabbing"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onWheel={onWheel}
        >
            {/* SEARCH BAR*/}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <input type="text" placeholder="Search Family Member" className="w-96 rounded-x1 bg-zinc-800 p-3 text-orange" />
            </div>
            {/* CAMERA WRAPPER */}
            <div
                style={{
                    transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                    transformOrigin: "center",
                }}
                className="relative w-[3000px] h-[3000px]"
            >
                {/* NODES */}
                {layoutNodes.map((n) => (
                    <div
                        key={n.id}
                        onClick={() => focusNode(n)}
                        className="absolute"
                        style={{
                            left: n.x,
                            top: n.y,
                        }}
                    >
                        <PersonCard name={n.name} />
                    </div>
                ))}
                { }

            </div>
        </div>
    );
}
