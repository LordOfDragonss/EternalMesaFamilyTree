import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/getPublicUrl";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const bedId = Number(id);

    const redirect = (locationId?: number) =>
        NextResponse.redirect(
            new URL(
                locationId
                    ? `/locations/beds?location=${locationId}`
                    : "/locations/beds",
                getPublicUrl(request)
            ),
            { status: 303 }
        );

    if (!Number.isInteger(bedId) || bedId <= 0) {
        return redirect();
    }

    const formData = await request.formData();
    const colonistId = Number(formData.get("colonistId"));

    if (!Number.isInteger(colonistId) || colonistId <= 0) {
        return redirect();
    }

    let locationId: number | undefined;

    try {
        await prisma.$transaction(async (tx) => {
            const bed = await tx.doubleBed.findUnique({
                where: { id: bedId },
                select: {
                    locationId: true,
                    assignments: {
                        where: { vacatedAt: null },
                        select: { colonistId: true },
                    },
                },
            });

            if (!bed) return;

            locationId = bed.locationId;

            // A bed can have at most two active occupants.
            if (bed.assignments.length >= 2) return;

            // Only living colonists can be assigned.
            const colonist = await tx.colonist.findFirst({
                where: {
                    id: colonistId,
                    isDead: false,
                },
                select: { id: true },
            });

            if (!colonist) return;

            // Prevent a colonist from occupying multiple beds.
            const existingAssignment =
                await tx.doubleBedAssignment.findFirst({
                    where: {
                        colonistId,
                        vacatedAt: null,
                    },
                    select: { id: true },
                });

            if (existingAssignment) return;

            await tx.doubleBedAssignment.create({
                data: {
                    bedId,
                    colonistId,
                },
            });
        });
    } catch (error) {
        console.error("Failed to assign colonist to bed:", error);
    }

    return redirect(locationId);
}