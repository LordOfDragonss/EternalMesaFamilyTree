import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    minio,
    MINIO_BUCKET,
} from "@/lib/minio";
import { getPublicUrl } from "@/lib/getPublicUrl";

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

    const landmark =
        await prisma.locationLandmark.findFirst({
            where: {
                id: landmarkIdNumber,
                locationId,
            },
            include: {
                images: {
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        });

    if (!landmark) {
        return new NextResponse(
            "Landmark not found",
            { status: 404 }
        );
    }

    const formData = await request.formData();

    const name = String(
        formData.get("name") ?? ""
    ).trim();

    const descriptionValue = String(
        formData.get("description") ?? ""
    ).trim();

    if (!name) {
        return new NextResponse(
            "Name is required",
            { status: 400 }
        );
    }

    await prisma.locationLandmark.update({
        where: {
            id: landmark.id,
        },
        data: {
            name,
            description:
                descriptionValue || null,
        },
    });

    const removeImageIds = formData
        .getAll("removeImageIds[]")
        .map((value) => Number(value))
        .filter((id) => Number.isInteger(id));

    if (removeImageIds.length > 0) {
        await prisma.locationLandmarkImage.deleteMany({
            where: {
                id: {
                    in: removeImageIds,
                },
                landmarkId: landmark.id,
            },
        });
    }

    const imageIds = formData
        .getAll("imageIds[]")
        .map((value) => Number(value))
        .filter((id) => Number.isInteger(id));

    const imageCaptions = formData.getAll(
        "imageCaptions[]"
    );

    for (
        let index = 0;
        index < imageIds.length;
        index++
    ) {
        const imageId = imageIds[index];

        const image = landmark.images.find(
            (image) =>
                image.id === imageId
        );

        if (!image) {
            continue;
        }

        await prisma.locationLandmarkImage.update({
            where: {
                id: imageId,
            },
            data: {
                caption:
                    String(
                        imageCaptions[index] ?? ""
                    ).trim() || null,
            },
        });
    }

    const files = formData
        .getAll("landmarkImages")
        .filter(
            (value): value is File =>
                value instanceof File &&
                value.size > 0 &&
                value.type.startsWith("image/")
        );

    const newImageCaptions = formData.getAll(
        "newImageCaptions[]"
    );

    const existingImageCount =
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
                        newImageCaptions[index] ?? ""
                    ).trim() || null,
                order:
                    existingImageCount + index,
                landmarkId: landmark.id,
            },
        });
    }

    return NextResponse.redirect(
        new URL(
            `/locations/${locationId}/landmarks/${landmark.id}`,
            getPublicUrl(request)
        ),
        303
    );
}