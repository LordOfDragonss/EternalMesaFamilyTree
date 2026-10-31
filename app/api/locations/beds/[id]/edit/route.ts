import { randomUUID } from "crypto";
import {
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/getPublicUrl";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const imageExtensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
};

type Props = {
    params: Promise<{
        id: string;
    }>;
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

export async function POST(
    request: Request,
    { params }: Props
) {
    let uploadedObjectKey: string | null = null;

    try {
        const { id } = await params;
        const bedId = Number(id);

        if (!Number.isInteger(bedId) || bedId <= 0) {
            throw new Error("Invalid bed ID.");
        }

        const existingBed =
            await prisma.doubleBed.findUnique({
                where: {
                    id: bedId,
                },
            });

        if (!existingBed) {
            throw new Error("Bed not found.");
        }

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

        const removeScreenshot =
            formData.get("removeScreenshot") === "true";

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

        /*
         * Upload a replacement before changing the database.
         * This allows the existing screenshot to remain intact
         * if the upload fails.
         */
        let screenshotURL =
            existingBed.screenshotURL;

        if (screenshot) {
            const extension =
                imageExtensions[screenshot.type];

            const objectKey =
                `double-beds/${bedId}/screenshot-${randomUUID()}.${extension}`;

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
            screenshotURL = objectKey;
        } else if (removeScreenshot) {
            screenshotURL = null;
        }

        /*
         * Keep the existing order when the location is unchanged.
         * Otherwise, place the bed at the end of its new location.
         */
        let order = existingBed.order;

        if (locationId !== existingBed.locationId) {
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

            order = (highestOrderBed?.order ?? -1) + 1;
        }

        await prisma.doubleBed.update({
            where: {
                id: bedId,
            },
            data: {
                name,
                notes,
                locationId,
                order,
                screenshotURL,
            },
        });

        /*
         * The database now points to the new screenshot (or null).
         * The previous MinIO object can safely be deleted.
         */
        const oldScreenshotURL =
            existingBed.screenshotURL;

        if (
            oldScreenshotURL &&
            oldScreenshotURL !== screenshotURL
        ) {
            try {
                await minio.send(
                    new DeleteObjectCommand({
                        Bucket: MINIO_BUCKET,
                        Key: oldScreenshotURL,
                    })
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to delete previous bed screenshot:",
                    cleanupError
                );
            }
        }

        return NextResponse.redirect(
            new URL(
                `/locations/beds?location=${locationId}`,
                getPublicUrl(request)
            ),
            303
        );
    } catch (error) {
        console.error("Failed to edit double bed:", error);

        /*
         * If the database update failed after a replacement
         * screenshot was uploaded, remove the unused new object.
         */
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

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to edit double bed.",
            },
            {
                status: 400,
            }
        );
    }
}