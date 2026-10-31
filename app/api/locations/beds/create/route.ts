import { randomUUID } from "crypto";
import {
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const imageExtensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
};

function getRedirectOrigin(request: Request) {
    const forwardedHost =
        request.headers.get("x-forwarded-host");

    const forwardedProto =
        request.headers.get("x-forwarded-proto");

    if (forwardedHost) {
        const protocol =
            forwardedProto ??
            new URL(request.url).protocol.replace(":", "");

        return `${protocol}://${forwardedHost}`;
    }

    return new URL(request.url).origin;
}

export async function POST(request: Request) {
    let createdBedId: number | null = null;
    let uploadedObjectKey: string | null = null;

    try {
        const formData = await request.formData();

        const nameValue =
            String(formData.get("name") ?? "").trim();

        const name = nameValue || null;

        const notesValue =
            String(formData.get("notes") ?? "").trim();

        const notes = notesValue || null;

        const locationId =
            Number(formData.get("locationId"));

        if (
            !Number.isInteger(locationId) ||
            locationId <= 0
        ) {
            throw new Error("A valid location is required.");
        }

        if (name && name.length > 100) {
            throw new Error("Bed name cannot exceed 100 characters.");
        }

        const screenshotValue =
            formData.get("screenshot");

        if (
            screenshotValue !== null &&
            !(screenshotValue instanceof File)
        ) {
            throw new Error("Invalid screenshot.");
        }

        const screenshot =
            screenshotValue instanceof File &&
            screenshotValue.size > 0
                ? screenshotValue
                : null;

        if (screenshot) {
            if (!imageExtensions[screenshot.type]) {
                throw new Error(
                    "Unsupported image type. Use JPG, PNG, WebP, GIF, or AVIF."
                );
            }

            if (screenshot.size > MAX_IMAGE_SIZE) {
                throw new Error(
                    "Screenshot cannot exceed 10 MB."
                );
            }
        }

        const location =
            await prisma.location.findFirst({
                where: {
                    id: locationId,
                    type: "PLAYABLE_MAP",
                },
                select: {
                    id: true,
                },
            });

        if (!location) {
            throw new Error(
                "Selected location is not a valid playable map."
            );
        }

        const highestOrderBed =
            await prisma.doubleBed.findFirst({
                where: {
                    locationId,
                },
                orderBy: {
                    order: "desc",
                },
                select: {
                    order: true,
                },
            });

        const bed =
            await prisma.doubleBed.create({
                data: {
                    name,
                    notes,
                    locationId,
                    order: (highestOrderBed?.order ?? -1) + 1,
                },
            });

        createdBedId = bed.id;

        if (screenshot) {
            const extension =
                imageExtensions[screenshot.type];

            const objectKey =
                `double-beds/${bed.id}/screenshot-${randomUUID()}.${extension}`;

            const buffer = Buffer.from(
                await screenshot.arrayBuffer()
            );

            await minio.send(
                new PutObjectCommand({
                    Bucket: MINIO_BUCKET,
                    Key: objectKey,
                    Body: buffer,
                    ContentType: screenshot.type,
                })
            );

            uploadedObjectKey = objectKey;

            await prisma.doubleBed.update({
                where: {
                    id: bed.id,
                },
                data: {
                    screenshotURL: objectKey,
                },
            });
        }

        return NextResponse.redirect(
            new URL(
                `/locations/beds?location=${locationId}`,
                getRedirectOrigin(request)
            ),
            303
        );
    } catch (error) {
        console.error("Failed to create double bed:", error);

        if (uploadedObjectKey) {
            try {
                await minio.send(
                    new DeleteObjectCommand({
                        Bucket: MINIO_BUCKET,
                        Key: uploadedObjectKey,
                    })
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up uploaded bed screenshot:",
                    cleanupError
                );
            }
        }

        if (createdBedId !== null) {
            try {
                await prisma.doubleBed.delete({
                    where: {
                        id: createdBedId,
                    },
                });
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up created bed:",
                    cleanupError
                );
            }
        }

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create double bed.",
            },
            {
                status: 400,
            }
        );
    }
}