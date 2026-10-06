import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
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
    const { id, imageId } =
        await params;

    const relicId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(relicId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid relic or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.relicImage.findFirst({
            where: {
                id: imageIdNumber,
                relicId,
            },
        });

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Relic image not found.",
            },
            {
                status: 404,
            }
        );
    }

    const body =
        await request.json();

    const caption =
        typeof body.caption === "string"
            ? body.caption.trim() || null
            : null;

    await prisma.relicImage.update({
        where: {
            id: imageIdNumber,
        },
        data: {
            caption,
        },
    });

    return NextResponse.json({
        success: true,
    });
}

export async function PATCH(
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
    const { id, imageId } =
        await params;

    const relicId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(relicId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid relic or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.relicImage.findFirst({
            where: {
                id: imageIdNumber,
                relicId,
            },
        });

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Relic image not found.",
            },
            {
                status: 404,
            }
        );
    }

    await prisma.relic.update({
        where: {
            id: relicId,
        },
        data: {
            primaryImageURL:
                image.imageURL,
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
            imageId: string;
        }>;
    }
) {
    const { id, imageId } =
        await params;

    const relicId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(relicId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid relic or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.relicImage.findFirst({
            where: {
                id: imageIdNumber,
                relicId,
            },
        });

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Relic image not found.",
            },
            {
                status: 404,
            }
        );
    }

    const relic =
        await prisma.relic.findUnique({
            where: {
                id: relicId,
            },
        });

    if (!relic) {
        return NextResponse.json(
            {
                error: "Relic not found.",
            },
            {
                status: 404,
            }
        );
    }

    const wasPrimary =
        relic.primaryImageURL ===
        image.imageURL;

    await prisma.relicImage.delete({
        where: {
            id: imageIdNumber,
        },
    });

    if (wasPrimary) {
        await prisma.relic.update({
            where: {
                id: relicId,
            },
            data: {
                primaryImageURL: null,
            },
        });
    }

    try {
        await minio.send(
            new DeleteObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: image.imageURL,
            })
        );
    } catch (error) {
        console.error(
            `Failed to delete relic image "${image.imageURL}" from MinIO:`,
            error
        );
    }

    return NextResponse.json({
        success: true,
    });
}