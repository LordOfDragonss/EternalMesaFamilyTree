import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";

function getSafeExtension(fileName: string): string {
    const extension = fileName.match(/\.[a-zA-Z0-9]{1,12}$/)?.[0] ?? "";
    return extension.toLowerCase();
}

export async function POST(request: Request) {
    let objectKey: string | null = null;

    try {
        const formData = await request.formData();
        const fileValue = formData.get("file");

        if (!(fileValue instanceof File) || fileValue.size === 0) {
            return NextResponse.json(
                { error: "Choose an image to upload." },
                { status: 400 },
            );
        }

        if (!fileValue.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Inline story images must be image files." },
                { status: 400 },
            );
        }

        objectKey = `stories/inline/${randomUUID()}${getSafeExtension(fileValue.name)}`;

        await minio.send(
            new PutObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: objectKey,
                Body: Buffer.from(await fileValue.arrayBuffer()),
                ContentType: fileValue.type,
            }),
        );

        const asset = await prisma.storedAsset.create({
            data: {
                objectKey,
                originalFileName: fileValue.name,
                mimeType: fileValue.type || null,
                sizeBytes: fileValue.size,
            },
            select: {
                id: true,
                originalFileName: true,
                mimeType: true,
                sizeBytes: true,
            },
        });

        return NextResponse.json({
            success: true,
            asset,
            url: `/api/stories/assets/${asset.id}`,
        });
    } catch (error) {
        if (objectKey) {
            try {
                await minio.send(
                    new DeleteObjectCommand({
                        Bucket: MINIO_BUCKET,
                        Key: objectKey,
                    }),
                );
            } catch (cleanupError) {
                console.error(
                    `Failed to clean up MinIO object "${objectKey}":`,
                    cleanupError,
                );
            }
        }

        console.error("Failed to upload inline story image:", error);
        return NextResponse.json(
            { error: "The image could not be uploaded." },
            { status: 500 },
        );
    }
}
