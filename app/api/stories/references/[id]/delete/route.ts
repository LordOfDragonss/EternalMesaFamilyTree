
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { minio, MINIO_BUCKET } from "@/lib/minio";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    const referenceId = Number(id);

    if (!Number.isInteger(referenceId) || referenceId <= 0) {
        return NextResponse.redirect(
            new URL("/stories/references", request.url),
            303,
        );
    }

    const reference = await prisma.referenceMaterial.findUnique({
        where: { id: referenceId },
        select: {
            id: true,
            asset: {
                select: {
                    id: true,
                    objectKey: true,
                },
            },
        },
    });

    if (!reference) {
        return NextResponse.redirect(
            new URL("/stories/references", request.url),
            303,
        );
    }

    let objectKeyToDelete: string | null = null;

    await prisma.$transaction(async (tx) => {
        await tx.referenceMaterial.delete({
            where: { id: referenceId },
        });

        if (reference.asset) {
            const inlineUsageCount = await tx.storyInlineAsset.count({
                where: { assetId: reference.asset.id },
            });

            if (inlineUsageCount === 0) {
                await tx.storedAsset.delete({
                    where: { id: reference.asset.id },
                });

                objectKeyToDelete = reference.asset.objectKey;
            }
        }
    });

    if (objectKeyToDelete) {
        await minio.send(
            new DeleteObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: objectKeyToDelete,
            }),
        );
    }

    revalidatePath("/stories/references");
    revalidatePath("/stories");

    return NextResponse.redirect(
        new URL("/stories/references", request.url),
        303,
    );
}
