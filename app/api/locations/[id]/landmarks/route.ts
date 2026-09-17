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
        params: Promise<{ id: string }>;
    }
) {
    const { id } = await params;

    const locationId = Number(id);

    const location = await prisma.location.findUnique({
        where: {
            id: locationId,
        },
    });

    if (!location) {
        return new NextResponse(
            "Location not found",
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

    const landmark =
        await prisma.locationLandmark.create({
            data: {
                name,
                description:
                    descriptionValue || null,
                locationId,
            },
        });

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

    for (let index = 0; index < files.length; index++) {
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
                order: index,
                landmarkId: landmark.id,
            },
        });
    }

    return NextResponse.redirect(
        new URL(
            `/locations/${locationId}/landmarks`,
            getPublicUrl(request)
        ),
        303
    );
}