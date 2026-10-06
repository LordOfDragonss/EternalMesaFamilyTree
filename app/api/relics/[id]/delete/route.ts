import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { minio } from "@/lib/minio";

export async function POST(
    request: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    const { id } = await context.params;
    const relicId = Number(id);

    if (!Number.isInteger(relicId)) {
        return NextResponse.json(
            { error: "Invalid relic ID." },
            { status: 400 }
        );
    }

    const relic = await prisma.relic.findUnique({
        where: {
            id: relicId,
        },
        include: {
            images: true,
        },
    });

    if (!relic) {
        return NextResponse.json(
            { error: "Relic not found." },
            { status: 404 }
        );
    }

    // Collect every image belonging to the relic.
    const imageKeys = new Set<string>();

    if (relic.primaryImageURL) {
        imageKeys.add(relic.primaryImageURL);
    }

    for (const image of relic.images) {
        imageKeys.add(image.imageURL);
    }

    // Delete the database record first.
    // Related RelicImage and RelicOwnership records
    // are removed through Prisma's cascade relations.
    await prisma.relic.delete({
        where: {
            id: relicId,
        },
    });

    // Remove the corresponding files from MinIO.
    for (const key of imageKeys) {
        try {
            await minio.send(
                new DeleteObjectCommand({
                    Bucket: process.env.MINIO_BUCKET!,
                    Key: key,
                })
            );
        } catch (error) {
            console.error(
                `Failed to delete relic image "${key}":`,
                error
            );
        }
    }

    return NextResponse.redirect(
        new URL("/relics", request.url)
    );
}