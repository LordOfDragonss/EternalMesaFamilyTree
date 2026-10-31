
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const bedId = Number(id);

    if (!Number.isInteger(bedId) || bedId <= 0) {
        return NextResponse.json(
            { error: "Invalid bed ID." },
            { status: 400 }
        );
    }

    const formData = await request.formData();
    const direction = formData.get("direction");

    if (direction !== "left" && direction !== "right") {
        return NextResponse.json(
            { error: "Invalid direction." },
            { status: 400 }
        );
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const bed = await tx.doubleBed.findUnique({
                where: { id: bedId },
                select: { locationId: true },
            });

            if (!bed) {
                return false;
            }

            const beds = await tx.doubleBed.findMany({
                where: {
                    locationId: bed.locationId,
                },
                orderBy: [
                    { order: "asc" },
                    { id: "asc" },
                ],
                select: {
                    id: true,
                },
            });

            const currentIndex = beds.findIndex(
                (item) => item.id === bedId
            );

            if (currentIndex === -1) {
                return false;
            }

            const targetIndex =
                direction === "left"
                    ? currentIndex - 1
                    : currentIndex + 1;

            if (
                targetIndex < 0 ||
                targetIndex >= beds.length
            ) {
                return true;
            }

            [beds[currentIndex], beds[targetIndex]] = [
                beds[targetIndex],
                beds[currentIndex],
            ];

            await Promise.all(
                beds.map((item, index) =>
                    tx.doubleBed.update({
                        where: { id: item.id },
                        data: { order: index },
                    })
                )
            );

            return true;
        });

        if (!result) {
            return NextResponse.json(
                { error: "Bed could not be found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to reorder double bed:", error);

        return NextResponse.json(
            { error: "Failed to save bed order." },
            { status: 500 }
        );
    }
}
