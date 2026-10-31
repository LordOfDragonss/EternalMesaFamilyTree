import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/getPublicUrl";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            assignmentId: string;
        }>;
    }
) {
    const { id, assignmentId } = await params;

    const bedId = Number(id);
    const idToRemove = Number(assignmentId);

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

    if (
        !Number.isInteger(bedId) ||
        bedId <= 0 ||
        !Number.isInteger(idToRemove) ||
        idToRemove <= 0
    ) {
        return redirect();
    }

    const assignment = await prisma.doubleBedAssignment.findFirst({
        where: {
            id: idToRemove,
            bedId,
        },
        select: {
            bed: {
                select: {
                    locationId: true,
                },
            },
        },
    });

    if (!assignment) {
        return redirect();
    }

    await prisma.doubleBedAssignment.updateMany({
        where: {
            id: idToRemove,
            bedId,
            vacatedAt: null,
        },
        data: {
            vacatedAt: new Date(),
        },
    });

    return redirect(assignment.bed.locationId);
}