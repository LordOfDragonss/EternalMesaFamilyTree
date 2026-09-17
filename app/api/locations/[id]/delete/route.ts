import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    if (Number.isNaN(locationId)) {
        return NextResponse.redirect(
            new URL(
                "/locations",
                getPublicUrl(request)
            )
        );
    }

    const location =
        await prisma.location.findUnique({
            where: {
                id: locationId,
            },
        });

    if (!location) {
        return NextResponse.redirect(
            new URL(
                "/locations",
                getPublicUrl(request)
            )
        );
    }

    await prisma.location.delete({
        where: {
            id: locationId,
        },
    });

    return NextResponse.redirect(
        new URL(
            "/locations",
            getPublicUrl(request)
        )
    );
}