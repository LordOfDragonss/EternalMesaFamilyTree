import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            landmarkId: string;
            imageId: string;
        }>;
    }
) {
    const {
        id,
        landmarkId,
        imageId,
    } = await params;

    const locationId = Number(id);
    const landmarkIdNumber =
        Number(landmarkId);
    const imageIdNumber = Number(imageId);

    if (
        Number.isNaN(locationId) ||
        Number.isNaN(landmarkIdNumber) ||
        Number.isNaN(imageIdNumber)
    ) {
        return new NextResponse(
            "Invalid ID",
            { status: 400 }
        );
    }

    const landmark =
        await prisma.locationLandmark.findFirst({
            where: {
                id: landmarkIdNumber,
                locationId,
            },
        });

    if (!landmark) {
        return new NextResponse(
            "Landmark not found",
            { status: 404 }
        );
    }

    const image =
        await prisma.locationLandmarkImage.findFirst(
            {
                where: {
                    id: imageIdNumber,
                    landmarkId:
                        landmark.id,
                },
            }
        );

    if (!image) {
        return new NextResponse(
            "Image not found",
            { status: 404 }
        );
    }

    const body = await request.json();

    const caption =
        typeof body.caption === "string"
            ? body.caption.trim() || null
            : null;

    await prisma.locationLandmarkImage.update({
        where: {
            id: image.id,
        },
        data: {
            caption,
        },
    });

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
            landmarkId: string;
            imageId: string;
        }>;
    }
) {
    const {
        id,
        landmarkId,
        imageId,
    } = await params;

    const locationId = Number(id);
    const landmarkIdNumber =
        Number(landmarkId);
    const imageIdNumber = Number(imageId);

    if (
        Number.isNaN(locationId) ||
        Number.isNaN(landmarkIdNumber) ||
        Number.isNaN(imageIdNumber)
    ) {
        return new NextResponse(
            "Invalid ID",
            { status: 400 }
        );
    }

    const landmark =
        await prisma.locationLandmark.findFirst({
            where: {
                id: landmarkIdNumber,
                locationId,
            },
        });

    if (!landmark) {
        return new NextResponse(
            "Landmark not found",
            { status: 404 }
        );
    }

    const image =
        await prisma.locationLandmarkImage.findFirst(
            {
                where: {
                    id: imageIdNumber,
                    landmarkId:
                        landmark.id,
                },
            }
        );

    if (!image) {
        return new NextResponse(
            "Image not found",
            { status: 404 }
        );
    }

    await prisma.locationLandmarkImage.delete({
        where: {
            id: image.id,
        },
    });

    return NextResponse.json({
        success: true,
    });
}