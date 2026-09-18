import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    minio,
    MINIO_BUCKET,
} from "@/lib/minio";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
            landmarkId: string;
        }>;
    }
) {
    const { id, landmarkId } = await params;

    const locationId = Number(id);
    const landmarkIdNumber = Number(landmarkId);

    if (
        Number.isNaN(locationId) ||
        Number.isNaN(landmarkIdNumber)
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

    const formData =
        await request.formData();

    const files = formData
        .getAll("landmarkImages")
        .filter(
            (value): value is File =>
                value instanceof File &&
                value.size > 0 &&
                value.type.startsWith("image/")
        );

    const captions = formData.getAll(
        "newImageCaptions[]"
    );

    if (files.length === 0) {
        return NextResponse.json({
            success: true,
        });
    }

    const currentImageCount =
        await prisma.locationLandmarkImage.count({
            where: {
                landmarkId: landmark.id,
            },
        });

    for (
        let index = 0;
        index < files.length;
        index++
    ) {
        const file = files[index];

        const extension =
            file.name.includes(".")
                ? file.name.slice(
                      file.name.lastIndexOf(".")
                  )
                : "";

        const objectKey = `landmarks/${randomUUID()}${extension}`;

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

        await prisma.locationLandmarkImage.create({
            data: {
                imageURL: objectKey,
                caption:
                    String(
                        captions[index] ?? ""
                    ).trim() || null,
                order:
                    currentImageCount + index,
                landmarkId: landmark.id,
            },
        });
    }

    return NextResponse.json({
        success: true,
    });
}