
import {
    DeleteObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { extname } from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MINIO_BUCKET, minio } from "@/lib/minio";
import type { ReferenceMaterialKind } from "@/app/stories/types";

type RouteContext = {
    params: Promise<{ id: string }>;
};

const validKinds = new Set<ReferenceMaterialKind>([
    "IMAGE",
    "TEXT",
    "FILE",
    "OTHER",
]);

function parseId(value: string) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function getSafeExtension(fileName: string) {
    const extension = extname(fileName).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

async function removeUploadedObject(objectKey: string) {
    try {
        await minio.send(
            new DeleteObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: objectKey,
            }),
        );
    } catch (error) {
        console.error(
            `Failed to remove MinIO object "${objectKey}":`,
            error,
        );
    }
}

async function uploadAttachment(file: File) {
    const objectKey =
        `stories/references/${randomUUID()}` +
        getSafeExtension(file.name);

    await minio.send(
        new PutObjectCommand({
            Bucket: MINIO_BUCKET,
            Key: objectKey,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type || "application/octet-stream",
        }),
    );

    return {
        objectKey,
        originalFileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
    };
}

export async function PATCH(request: Request, context: RouteContext) {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
        return NextResponse.json(
            { error: "Invalid reference ID." },
            { status: 400 },
        );
    }

    let uploadedObjectKey: string | null = null;

    try {
        const formData = await request.formData();

        const title = String(formData.get("title") ?? "").trim();
        const kindValue = String(formData.get("kind") ?? "");
        const sourceValue = String(formData.get("source") ?? "").trim();
        const contentValue = String(formData.get("content") ?? "");
        const removeAttachment =
            String(formData.get("removeAttachment") ?? "false") === "true";
        const fileValue = formData.get("file");
        const file =
            fileValue instanceof File && fileValue.size > 0
                ? fileValue
                : null;

        if (!title) {
            return NextResponse.json(
                { error: "A title is required." },
                { status: 400 },
            );
        }

        if (!validKinds.has(kindValue as ReferenceMaterialKind)) {
            return NextResponse.json(
                { error: "Invalid reference type." },
                { status: 400 },
            );
        }

        const kind = kindValue as ReferenceMaterialKind;

        if (kind === "IMAGE" && file && !file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Image references require an image attachment." },
                { status: 400 },
            );
        }

        const existing = await prisma.referenceMaterial.findUnique({
            where: { id },
            include: {
                asset: {
                    select: {
                        id: true,
                        objectKey: true,
                    },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Reference not found." },
                { status: 404 },
            );
        }

        let newAsset:
            | {
                  objectKey: string;
                  originalFileName: string;
                  mimeType: string | null;
                  sizeBytes: number;
              }
            | null = null;

        if (file) {
            newAsset = await uploadAttachment(file);
            uploadedObjectKey = newAsset.objectKey;
        }

        const shouldReplaceAsset = Boolean(file);
        const shouldRemoveAsset = removeAttachment && !file;
        const oldAsset = existing.asset;
        let oldAssetObjectToRemove: string | null = null;

        const updated = await prisma.$transaction(async (tx) => {
            let newAssetId: number | null | undefined;

            if (shouldReplaceAsset && newAsset) {
                const createdAsset = await tx.storedAsset.create({
                    data: newAsset,
                    select: { id: true },
                });
                newAssetId = createdAsset.id;
            } else if (shouldRemoveAsset) {
                newAssetId = null;
            }

            const reference = await tx.referenceMaterial.update({
                where: { id },
                data: {
                    title,
                    kind,
                    source: sourceValue || null,
                    content: contentValue.trim() || null,
                    ...(newAssetId !== undefined
                        ? { assetId: newAssetId }
                        : {}),
                },
            });

            if (
                oldAsset &&
                newAssetId !== undefined &&
                newAssetId !== oldAsset.id
            ) {
                const inlineUsage = await tx.storyInlineAsset.count({
                    where: { assetId: oldAsset.id },
                });

                if (inlineUsage === 0) {
                    await tx.storedAsset.delete({
                        where: { id: oldAsset.id },
                    });
                    oldAssetObjectToRemove = oldAsset.objectKey;
                }
            }

            return reference;
        });

        uploadedObjectKey = null;

        if (oldAssetObjectToRemove) {
            await removeUploadedObject(oldAssetObjectToRemove);
        }

        const reference = await prisma.referenceMaterial.findUnique({
            where: { id: updated.id },
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

        return NextResponse.json({ reference });
    } catch (error) {
        if (uploadedObjectKey) {
            await removeUploadedObject(uploadedObjectKey);
        }

        console.error("Failed to update reference material:", error);

        return NextResponse.json(
            { error: "Failed to update the reference." },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
        return NextResponse.json(
            { error: "Invalid reference ID." },
            { status: 400 },
        );
    }

    try {
        const existing = await prisma.referenceMaterial.findUnique({
            where: { id },
            include: {
                asset: {
                    select: {
                        id: true,
                        objectKey: true,
                    },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Reference not found." },
                { status: 404 },
            );
        }

        let objectToRemove: string | null = null;

        await prisma.$transaction(async (tx) => {
            // Deleting the reference removes its StoryReference associations
            // according to the existing Prisma relation's cascade behavior.
            await tx.referenceMaterial.delete({
                where: { id },
            });

            if (existing.asset) {
                const inlineUsage = await tx.storyInlineAsset.count({
                    where: { assetId: existing.asset.id },
                });

                // Keep the asset if story body content still uses it.
                if (inlineUsage === 0) {
                    await tx.storedAsset.delete({
                        where: { id: existing.asset.id },
                    });
                    objectToRemove = existing.asset.objectKey;
                }
            }
        });

        if (objectToRemove) {
            await removeUploadedObject(objectToRemove);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete reference material:", error);

        return NextResponse.json(
            { error: "Failed to delete the reference." },
            { status: 500 },
        );
    }
}
