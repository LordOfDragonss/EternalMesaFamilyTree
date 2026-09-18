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

    const locationId = Number(id);

    if (Number.isNaN(locationId)) {
        return NextResponse.json(
            {
                error: "Invalid location ID.",
            },
            {
                status: 400,
            }
        );
    }

    const location =
        await prisma.location.findUnique({
            where: {
                id: locationId,
            },
        });

    if (!location) {
        return NextResponse.json(
            {
                error: "Location not found.",
            },
            {
                status: 404,
            }
        );
    }

    const formData =
        await request.formData();

    const imageFiles = formData
        .getAll("locationImages")
        .filter(
            (value): value is File =>
                value instanceof File &&
                value.size > 0
        );

    const imageCaptions = formData
        .getAll("imageCaptions[]")
        .map((value) =>
            String(value)
        );

    const uploadedImages: {
        imageURL: string;
        caption: string | null;
    }[] = [];

    for (
        let index = 0;
        index < imageFiles.length;
        index++
    ) {
        const file =
            imageFiles[index];

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            continue;
        }

        const extension =
            file.name.includes(".")
                ? file.name.substring(
                    file.name.lastIndexOf(
                        "."
                    )
                )
                : "";

        const objectKey =
            `locations/${randomUUID()}${extension}`;

        const buffer = Buffer.from(
            await file.arrayBuffer()
        );

        await minio.send(
            new PutObjectCommand({
                Bucket:
                    MINIO_BUCKET,
                Key: objectKey,
                Body: buffer,
                ContentType:
                    file.type,
            })
        );

        uploadedImages.push({
            imageURL: objectKey,
            caption:
                imageCaptions[
                    index
                ]?.trim() || null,
        });
    }

    if (
        uploadedImages.length > 0
    ) {
        const currentImageCount =
            await prisma.locationImage.count(
                {
                    where: {
                        locationId,
                    },
                }
            );

        await prisma.locationImage.createMany(
            {
                data:
                    uploadedImages.map(
                        (
                            image,
                            index
                        ) => ({
                            imageURL:
                                image.imageURL,
                            caption:
                                image.caption,
                            order:
                                currentImageCount +
                                index,
                            locationId,
                        })
                    ),
            }
        );
    }

    return NextResponse.json({
        success: true,
    });
}