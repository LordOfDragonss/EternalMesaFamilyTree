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

    const colonistId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(colonistId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid colonist or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.colonistImage.findFirst({
            where: {
                id: imageIdNumber,
                colonistId,
            },
        });

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Colonist image not found.",
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

    await prisma.colonistImage.update({
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

    const colonistId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(colonistId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid colonist or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.colonistImage.findFirst({
            where: {
                id: imageIdNumber,
                colonistId,
            },
        });

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Colonist image not found.",
            },
            {
                status: 404,
            }
        );
    }

    await prisma.colonist.update({
        where: {
            id: colonistId,
        },
        data: {
            imageURL: image.imageURL,
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

    const colonistId = Number(id);
    const imageIdNumber =
        Number(imageId);

    if (
        Number.isNaN(colonistId) ||
        Number.isNaN(imageIdNumber)
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid colonist or image ID.",
            },
            {
                status: 400,
            }
        );
    }

    const image =
        await prisma.colonistImage.findFirst({
            where: {
                id: imageIdNumber,
                colonistId,
            },
        });

    if (!image) {
        return NextResponse.json(
            {
                error:
                    "Colonist image not found.",
            },
            {
                status: 404,
            }
        );
    }

    const colonist =
        await prisma.colonist.findUnique({
            where: {
                id: colonistId,
            },
        });

    if (!colonist) {
        return NextResponse.json(
            {
                error: "Colonist not found.",
            },
            {
                status: 404,
            }
        );
    }

    const wasPortrait =
        colonist.imageURL ===
        image.imageURL;

    await prisma.colonistImage.delete({
        where: {
            id: imageIdNumber,
        },
    });

    if (wasPortrait) {
        await prisma.colonist.update({
            where: {
                id: colonistId,
            },
            data: {
                imageURL: null,
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
            `Failed to delete colonist image "${image.imageURL}" from MinIO:`,
            error
        );
    }

    return NextResponse.json({
        success: true,
    });
}