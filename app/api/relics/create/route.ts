import { prisma } from "@/lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { minio } from "@/lib/minio";

const validRelicCategories = [
    "IDEOLOGY",
    "WEAPON",
    "PERSONAL",
    "LEGACY",
    "STORY",
    "SYMBOLIC",
    "OTHER",
] as const;

type RelicCategory =
    (typeof validRelicCategories)[number];

function isValidValue<
    T extends readonly string[]
>(
    values: T,
    value: string
): value is T[number] {
    return values.includes(value);
}

export async function POST(request: Request) {
    try {
        const formData =
            await request.formData();

        /*
         * ---------------------------------------------------------
         * Basic relic information
         * ---------------------------------------------------------
         */

        const name =
            String(
                formData.get("name") ?? ""
            ).trim();

        const descriptionValue =
            String(
                formData.get("description") ?? ""
            ).trim();

        const description =
            descriptionValue || null;

        const originValue =
            String(
                formData.get("origin") ?? ""
            ).trim();

        const origin =
            originValue || null;

        if (!name) {
            throw new Error(
                "Relic name is required."
            );
        }

        /*
         * ---------------------------------------------------------
         * Categories
         * ---------------------------------------------------------
         */

        const categoryValue =
            String(
                formData.get("categories") ?? ""
            ).trim();

        const categories =
            categoryValue
                ? categoryValue
                    .split(",")
                    .map((category) => category.trim())
                    .filter(Boolean)
                : [];

        if (categories.length === 0) {
            throw new Error(
                "At least one relic category is required."
            );
        }

        const uniqueCategories =
            new Set(categories);

        if (
            uniqueCategories.size !==
            categories.length
        ) {
            throw new Error(
                "A relic category was submitted more than once."
            );
        }

        for (
            const category of categories
        ) {
            if (
                !isValidValue(
                    validRelicCategories,
                    category
                )
            ) {
                throw new Error(
                    "Invalid relic category."
                );
            }
        }

        /*
         * ---------------------------------------------------------
         * Current owner
         * ---------------------------------------------------------
         */

        const ownerIdValue =
            formData.get("ownerId");

        let ownerId: number | null =
            null;

        if (
            ownerIdValue !== null &&
            ownerIdValue !== ""
        ) {
            ownerId =
                Number(ownerIdValue);

            if (
                !Number.isInteger(ownerId)
            ) {
                throw new Error(
                    "Invalid owner."
                );
            }
        }

        /*
         * ---------------------------------------------------------
         * Current location
         * ---------------------------------------------------------
         */

        const locationIdValue =
            formData.get("locationId");

        let locationId: number | null =
            null;

        if (
            locationIdValue !== null &&
            locationIdValue !== ""
        ) {
            locationId =
                Number(locationIdValue);

            if (
                !Number.isInteger(
                    locationId
                )
            ) {
                throw new Error(
                    "Invalid location."
                );
            }
        }

        /*
         * ---------------------------------------------------------
         * Primary image
         * ---------------------------------------------------------
         */

        const primaryImage =
            formData.get(
                "primaryImage"
            );

        if (
            primaryImage !== null &&
            !(
                primaryImage instanceof File
            )
        ) {
            throw new Error(
                "Invalid primary image."
            );
        }

        /*
         * ---------------------------------------------------------
         * Additional images
         * ---------------------------------------------------------
         */

        const additionalImages =
            formData
                .getAll("images")
                .filter(
                    (value): value is File =>
                        value instanceof File &&
                        value.size > 0
                );

        /*
         * ---------------------------------------------------------
         * Create relic
         * ---------------------------------------------------------
         */

        const relic =
            await prisma.$transaction(
                async (tx) => {
                    /*
                     * Validate owner.
                     */

                    if (
                        ownerId !== null
                    ) {
                        const owner =
                            await tx.colonist.findUnique(
                                {
                                    where: {
                                        id:
                                            ownerId,
                                    },
                                    select: {
                                        id: true,
                                    },
                                }
                            );

                        if (!owner) {
                            throw new Error(
                                "Selected owner does not exist."
                            );
                        }
                    }

                    /*
                     * Validate location.
                     */

                    if (
                        locationId !== null
                    ) {
                        const location =
                            await tx.location.findUnique(
                                {
                                    where: {
                                        id:
                                            locationId,
                                    },
                                    select: {
                                        id: true,
                                    },
                                }
                            );

                        if (!location) {
                            throw new Error(
                                "Selected location does not exist."
                            );
                        }
                    }

                    /*
                     * Create relic.
                     *
                     * The primary image is uploaded after the
                     * relic exists, so it starts as null.
                     */

                    const newRelic =
                        await tx.relic.create({
                            data: {
                                name,
                                description,
                                categories:
                                    categories as RelicCategory[],
                                primaryImageURL:
                                    null,
                                origin,

                                ...(ownerId !==
                                    null
                                    ? {
                                        owner: {
                                            connect: {
                                                id:
                                                    ownerId,
                                            },
                                        },
                                    }
                                    : {}),

                                ...(locationId !==
                                    null
                                    ? {
                                        location: {
                                            connect: {
                                                id:
                                                    locationId,
                                            },
                                        },
                                    }
                                    : {}),
                            },
                        });

                    return newRelic;
                }
            );

        /*
 * ---------------------------------------------------------
 * Upload primary image
 * ---------------------------------------------------------
 */

        if (
            primaryImage instanceof File &&
            primaryImage.size > 0
        ) {
            const extension =
                primaryImage.name
                    .split(".")
                    .pop() ||
                "webp";

            const objectKey =
                `relics/${relic.id}/primary-${randomUUID()}.${extension}`;

            const buffer =
                Buffer.from(
                    await primaryImage.arrayBuffer()
                );

            await minio.send(
                new PutObjectCommand({
                    Bucket:
                        process.env.MINIO_BUCKET,
                    Key: objectKey,
                    Body: buffer,
                    ContentType:
                        primaryImage.type,
                })
            );

            await prisma.relic.update({
                where: {
                    id: relic.id,
                },
                data: {
                    primaryImageURL:
                        objectKey,
                },
            });

            await prisma.relicImage.create({
                data: {
                    imageURL:
                        objectKey,
                    order: 0,
                    relicId:
                        relic.id,
                },
            });
        }

        /*
 * ---------------------------------------------------------
 * Upload additional images
 * ---------------------------------------------------------
 */

        if (
            additionalImages.length > 0
        ) {
            for (
                let i = 0;
                i <
                additionalImages.length;
                i++
            ) {
                const image =
                    additionalImages[i];

                const extension =
                    image.name
                        .split(".")
                        .pop() ||
                    "webp";

                const objectKey =
                    `relics/${relic.id}/${randomUUID()}.${extension}`;

                const buffer =
                    Buffer.from(
                        await image.arrayBuffer()
                    );

                await minio.send(
                    new PutObjectCommand({
                        Bucket:
                            process.env.MINIO_BUCKET,
                        Key: objectKey,
                        Body: buffer,
                        ContentType:
                            image.type,
                    })
                );

                await prisma.relicImage.create({
                    data: {
                        imageURL:
                            objectKey,
                        order: i + 1,
                        relicId:
                            relic.id,
                    },
                });
            }
        }

        /*
         * ---------------------------------------------------------
         * Redirect
         * ---------------------------------------------------------
         */

        const forwardedHost =
            request.headers.get(
                "x-forwarded-host"
            );

        const forwardedProto =
            request.headers.get(
                "x-forwarded-proto"
            );

        const host =
            forwardedHost ??
            request.headers.get("host");

        const protocol =
            forwardedProto ??
            "http";

        return NextResponse.redirect(
            new URL(
                `/relics/${relic.id}`,
                `${protocol}://${host}`
            ),
            303
        );
    } catch (error) {
        console.error(
            "Failed to create relic:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create relic.",
            },
            {
                status: 400,
            }
        );
    }
}