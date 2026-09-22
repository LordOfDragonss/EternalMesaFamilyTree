import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            colonistId: string;
        }>;
    }
) {
    const { id, colonistId } = await params;

    const locationId = Number(id);
    const colonistIdNumber = Number(colonistId);

    if (
        !Number.isInteger(locationId) ||
        !Number.isInteger(colonistIdNumber)
    ) {
        return NextResponse.redirect(
            new URL(`/locations/${id}/colonists`, request.url)
        );
    }

    await prisma.location.update({
        where: {
            id: locationId,
        },
        data: {
            colonists: {
                disconnect: {
                    id: colonistIdNumber,
                },
            },
        },
    });

    return NextResponse.redirect(
        new URL(`/locations/${id}/colonists`, request.url)
    );
}