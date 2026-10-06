import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
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

    const colonistId = Number(id);

    if (Number.isNaN(colonistId)) {
        return NextResponse.json(
            {
                error: "Invalid colonist ID.",
            },
            {
                status: 400,
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

    const formData =
        await request.formData();

    const imageFiles = formData
        .getAll("colonistImages")
        .filter(
            (value): value is File =>
                value instanceof File &&
                value.size > 0
        );

    const imageCaptions = formData
        .getAll("imageCaptions[]")
        .map((value) => String(value));

    const uploadedImages: {
        imageURL: string;
        caption: string | null;
    }[] = [];

    for (
        let index = 0;
        index < imageFiles.length;
        index++
    ) {
        const file = imageFiles[index];

        if (
            !file.type.startsWith("image/")
        ) {
            continue;
        }

        const extension =
            file.name.includes(".")
                ? file.name.substring(
                    file.name.lastIndexOf(".")
                )
                : "";

        const objectKey =
            `colonists/${colonistId}/${randomUUID()}${extension}`;

        const buffer = Buffer.from(
            await file.arrayBuffer()
        );

        await minio.send(
            new PutObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: objectKey,
                Body: buffer,
                ContentType: file.type,
            })
        );

        uploadedImages.push({
            imageURL: objectKey,
            caption:
                imageCaptions[index]?.trim() ||
                null,
        });
    }

    if (uploadedImages.length > 0) {
        const currentImageCount =
            await prisma.colonistImage.count({
                where: {
                    colonistId,
                },
            });

        await prisma.colonistImage.createMany({
            data: uploadedImages.map(
                (image, index) => ({
                    imageURL: image.imageURL,
                    caption: image.caption,
                    order:
                        currentImageCount +
                        index,
                    colonistId,
                })
            ),
        });
    }

    return NextResponse.json({
        success: true,
    });
}