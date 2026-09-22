import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    const { id } = await params;

    const locationId = Number(id);
    const formData = await request.formData();
    const colonistId = Number(formData.get("colonistId"));

    if (
        !Number.isInteger(locationId) ||
        !Number.isInteger(colonistId)
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
                connect: {
                    id: colonistId,
                },
            },
        },
    });

    return NextResponse.redirect(
        new URL(`/locations/${id}/colonists`, request.url)
    );
}