import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            imageId: string;
        }>;
    }
) {
    const {
        id,
        imageId,
    } = await params;

    const locationId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(locationId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid location or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.locationImage.findFirst(
            {
                where: {
                    id: imageIdNumber,
                    locationId,
                },
            }
        );

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Location image not found.",
            },
            {
                status: 404,
            }
        );
    }

    const body =
        await request.json();

    const caption =
        typeof body.caption ===
        "string"
            ? body.caption.trim() ||
            null
            : null;

    await prisma.locationImage.update(
        {
            where: {
                id: imageIdNumber,
            },
            data: {
                caption,
            },
        }
    );

    return NextResponse.json({
        success: true,
    });
}

export async function DELETE(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            imageId: string;
        }>;
    }
) {
    const {
        id,
        imageId,
    } = await params;

    const locationId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(locationId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid location or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.locationImage.findFirst(
            {
                where: {
                    id: imageIdNumber,
                    locationId,
                },
            }
        );

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Location image not found.",
            },
            {
                status: 404,
            }
        );
    }

    await prisma.locationImage.delete({
        where: {
            id: imageIdNumber,
        },
    });

    return NextResponse.json({
        success: true,
    });
}