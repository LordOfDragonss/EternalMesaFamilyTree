import {
    DeleteObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";

const VALID_KINDS = ["IMAGE", "TEXT", "FILE", "OTHER"] as const;
type ReferenceKind = (typeof VALID_KINDS)[number];

function getSafeExtension(fileName: string): string {
    const extension = fileName.match(/\.[a-zA-Z0-9]{1,12}$/)?.[0] ?? "";
    return extension.toLowerCase();
}

async function removeUploadedObject(objectKey: string | null) {
    if (!objectKey) return;

    try {
        await minio.send(
            new DeleteObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: objectKey,
            }),
        );
    } catch (error) {
        console.error(`Failed to clean up MinIO object "${objectKey}":`, error);
    }
}

export async function POST(request: Request) {
    let objectKey: string | null = null;

    try {
        const formData = await request.formData();
        const titleValue = formData.get("title");
        const kindValue = formData.get("kind");
        const sourceValue = formData.get("source");
        const contentValue = formData.get("content");
        const fileValue = formData.get("file");

        if (
            typeof titleValue !== "string" ||
            typeof sourceValue !== "string" ||
            typeof contentValue !== "string"
        ) {
            return NextResponse.json(
                { error: "The reference details are invalid." },
                { status: 400 },
            );
        }

        const title = titleValue.trim();
        if (!title) {
            return NextResponse.json(
                { error: "A reference title is required." },
                { status: 400 },
            );
        }

        if (
            typeof kindValue !== "string" ||
            !VALID_KINDS.includes(kindValue as ReferenceKind)
        ) {
            return NextResponse.json(
                { error: "Select a valid reference type." },
                { status: 400 },
            );
        }

        const kind = kindValue as ReferenceKind;
        const file =
            fileValue instanceof File && fileValue.size > 0
                ? fileValue
                : null;

        if (file && kind === "IMAGE" && !file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Screenshot references must use an image file." },
                { status: 400 },
            );
        }

        // An IMAGE or FILE reference can be metadata-only; uploading is optional.
        if (file) {
            objectKey = `stories/references/${randomUUID()}${getSafeExtension(file.name)}`;

            await minio.send(
                new PutObjectCommand({
                    Bucket: MINIO_BUCKET,
                    Key: objectKey,
                    Body: Buffer.from(await file.arrayBuffer()),
                    ContentType: file.type || "application/octet-stream",
                }),
            );
        }

        const reference = await prisma.$transaction(async (tx) => {
            const asset = file && objectKey
                ? await tx.storedAsset.create({
                    data: {
                        objectKey,
                        originalFileName: file.name,
                        mimeType: file.type || null,
                        sizeBytes: file.size,
                    },
                    select: {
                        id: true,
                        originalFileName: true,
                        mimeType: true,
                        sizeBytes: true,
                    },
                })
                : null;

            return tx.referenceMaterial.create({
                data: {
                    title,
                    kind,
                    source: sourceValue.trim() || null,
                    content: contentValue.trim() || null,
                    assetId: asset?.id ?? null,
                },
                select: {
                    id: true,
                    title: true,
                    kind: true,
                    source: true,
                    content: true,
                    asset: {
                        select: {
                            id: true,
                            originalFileName: true,
                            mimeType: true,
                            sizeBytes: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json({ success: true, reference });
    } catch (error) {
        await removeUploadedObject(objectKey);
        console.error("Failed to create reference material:", error);
        return NextResponse.json(
            { error: "The reference could not be created." },
            { status: 500 },
        );
    }
}
