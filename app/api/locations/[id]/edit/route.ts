import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

import { getPublicUrl } from "@/lib/getPublicUrl";
import { minio, MINIO_BUCKET } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const validLocationTypes = [
    "PLAYABLE_MAP",
    "OUTPOST",
    "OTHER",
] as const;

type LocationType =
    (typeof validLocationTypes)[number];

function isValidLocationType(
    value: string
): value is LocationType {
    return validLocationTypes.includes(
        value as LocationType
    );
}

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

    if (Number.isNaN(locationId)) {
        return NextResponse.redirect(
            new URL(
                "/locations",
                getPublicUrl(request)
            )
        );
    }

    const formData = await request.formData();

    const name = formData.get("name");
    const type = formData.get("type");
    const description =
        formData.get("description");

    if (
        typeof name !== "string" ||
        !name.trim()
    ) {
        return NextResponse.redirect(
            new URL(
                `/locations/${locationId}/edit`,
                getPublicUrl(request)
            )
        );
    }

    if (
        typeof type !== "string" ||
        !isValidLocationType(type)
    ) {
        return NextResponse.redirect(
            new URL(
                `/locations/${locationId}/edit`,
                getPublicUrl(request)
            )
        );
    }

    const existingLocation =
        await prisma.location.findUnique({
            where: {
                id: locationId,
            },
        });

    if (!existingLocation) {
        return NextResponse.redirect(
            getPublicUrl(request)
        );
    }

    const previousNames = formData
        .getAll("previousNames[]")
        .map((value) =>
            String(value).trim()
        )
        .filter(
            (value) => value.length > 0
        );

    /*
     * ---------------------------------------------------------
     * Colonists
     * ---------------------------------------------------------
     */

    const colonistIds = formData
        .getAll("colonistIds[]")
        .map((value) => Number(value))
        .filter(
            (value) =>
                !Number.isNaN(value)
        );

    /*
     * ---------------------------------------------------------
     * Legacies
     * ---------------------------------------------------------
     */

    const legacyIds = formData
        .getAll("legacyIds[]")
        .map((value) => Number(value))
        .filter(
            (value) =>
                !Number.isNaN(value)
        );

    /*
     * ---------------------------------------------------------
     * Images
     * ---------------------------------------------------------
     */

    const imageIds = formData
        .getAll("imageIds[]")
        .map((value) => Number(value))
        .filter(
            (value) =>
                !Number.isNaN(value)
        );

    const imageCaptions = formData
        .getAll("imageCaptions[]")
        .map((value) => String(value));

    const removeImageIds = formData
        .getAll("removeImageIds[]")
        .map((value) => Number(value))
        .filter(
            (value) =>
                !Number.isNaN(value)
        );

    const imageFiles = formData
        .getAll("locationImages")
        .filter(
            (value): value is File =>
                value instanceof File &&
                value.size > 0
        );

    const newImageCaptions = formData
        .getAll("newImageCaptions[]")
        .map((value) => String(value));

    /*
     * ---------------------------------------------------------
     * Upload new images
     * ---------------------------------------------------------
     */

    const uploadedImages: {
        imageURL: string;
        caption: string | null;
    }[] = [];

    for (
        let index = 0;
        index < imageFiles.length;
        index++
    ) {
        const file = imageFiles[index];

        if (!file.type.startsWith("image/")) {
            continue;
        }

        const extension = file.name.includes(".")
            ? file.name.substring(
                file.name.lastIndexOf(".")
            )
            : "";

        const objectKey = `locations/${randomUUID()}${extension}`;

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

        uploadedImages.push({
            imageURL: objectKey,
            caption:
                newImageCaptions[index]?.trim() ||
                null,
        });
    }

    const location =
        await prisma.$transaction(
            async (tx) => {
                const updatedLocation =
                    await tx.location.update({
                        where: {
                            id: locationId,
                        },
                        data: {
                            name: name.trim(),
                            type,
                            description:
                                typeof description ===
                                    "string" &&
                                    description.trim()
                                    ? description.trim()
                                    : null,

                            colonists: {
                                set: colonistIds.map(
                                    (id) => ({
                                        id,
                                    })
                                ),
                            },

                            legacies: {
                                set: legacyIds.map(
                                    (id) => ({
                                        id,
                                    })
                                ),
                            },
                        },
                    });

                await tx.locationPreviousName.deleteMany({
                    where: {
                        locationId,
                    },
                });

                if (
                    previousNames.length > 0
                ) {
                    await tx.locationPreviousName.createMany(
                        {
                            data:
                                previousNames.map(
                                    (
                                        previousName,
                                        index
                                    ) => ({
                                        name:
                                            previousName,
                                        order:
                                            index,
                                        locationId,
                                    })
                                ),
                        }
                    );
                }

                /*
                 * Remove images
                 */

                if (
                    removeImageIds.length > 0
                ) {
                    await tx.locationImage.deleteMany({
                        where: {
                            id: {
                                in: removeImageIds,
                            },
                            locationId,
                        },
                    });
                }

                /*
                 * Update existing image captions
                 */

                for (
                    let index = 0;
                    index < imageIds.length;
                    index++
                ) {
                    const imageId =
                        imageIds[index];

                    if (
                        removeImageIds.includes(
                            imageId
                        )
                    ) {
                        continue;
                    }

                    await tx.locationImage.updateMany({
                        where: {
                            id: imageId,
                            locationId,
                        },
                        data: {
                            caption:
                                imageCaptions[
                                    index
                                ]?.trim() || null,
                        },
                    });
                }

                /*
                 * Add new images
                 */

                if (
                    uploadedImages.length > 0
                ) {
                    const currentImageCount =
                        await tx.locationImage.count({
                            where: {
                                locationId,
                            },
                        });

                    await tx.locationImage.createMany({
                        data: uploadedImages.map(
                            (
                                image,
                                index
                            ) => ({
                                imageURL:
                                    image.imageURL,
                                caption:
                                    image.caption,
                                order:
                                    currentImageCount +
                                    index,
                                locationId,
                            })
                        ),
                    });
                }

                return updatedLocation;
            }
        );

    return NextResponse.redirect(
        new URL(
            `/locations/${location.id}`,
            getPublicUrl(request)
        ),
        303
    );
}