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

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(
    request: Request,
    { params }: Props
) {
    try {
        const { id } = await params;

        const relicId = Number(id);

        if (!Number.isInteger(relicId)) {
            throw new Error(
                "Invalid relic ID."
            );
        }

        const formData =
            await request.formData();

        const existingRelic =
            await prisma.relic.findUnique({
                where: {
                    id: relicId,
                },
            });

        if (!existingRelic) {
            throw new Error(
                "Relic not found."
            );
        }

        const name =
            String(
                formData.get("name") ?? ""
            ).trim();

        const descriptionValue =
            String(
                formData.get("description") ??
                ""
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
         * Mantine MultiSelect submits its
         * selected values as a comma-separated
         * string.
         */
        const categoryValue =
            String(
                formData.get("categories") ??
                ""
            ).trim();

        const categories =
            categoryValue
                ? categoryValue
                    .split(",")
                    .map(
                        (category) =>
                            category.trim()
                    )
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

        const removePrimaryImage =
            formData.get(
                "removePrimaryImage"
            ) === "true";

        let primaryImageURL =
            existingRelic.primaryImageURL;

        if (removePrimaryImage) {
            primaryImageURL = null;
        }

        /*
         * Validate referenced records before
         * changing the relic.
         */
        if (ownerId !== null) {
            const owner =
                await prisma.colonist.findUnique(
                    {
                        where: {
                            id: ownerId,
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

        if (locationId !== null) {
            const location =
                await prisma.location.findUnique(
                    {
                        where: {
                            id: locationId,
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
         * Replace the primary image if a new
         * file was uploaded.
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
                `relics/${relicId}/primary-${randomUUID()}.${extension}`;

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

            primaryImageURL =
                objectKey;

            const highestImage =
                await prisma.relicImage.findFirst(
                    {
                        where: {
                            relicId,
                        },
                        orderBy: {
                            order: "desc",
                        },
                        select: {
                            order: true,
                        },
                    }
                );

            const nextOrder =
                (highestImage?.order ??
                    -1) + 1;

            await prisma.relicImage.create({
                data: {
                    imageURL: objectKey,
                    order: nextOrder,
                    relicId,
                },
            });
        }

        await prisma.relic.update({
            where: {
                id: relicId,
            },
            data: {
                name,
                description,
                categories:
                    categories as RelicCategory[],
                origin,
                primaryImageURL,

                owner:
                    ownerId !== null
                        ? {
                            connect: {
                                id: ownerId,
                            },
                        }
                        : {
                            disconnect: true,
                        },

                location:
                    locationId !== null
                        ? {
                            connect: {
                                id: locationId,
                            },
                        }
                        : {
                            disconnect: true,
                        },
            },
        });

        return NextResponse.redirect(
            new URL(
                `/relics/${relicId}`,
                request.url
            ),
            303
        );
    } catch (error) {
        console.error(
            "Failed to edit relic:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to edit relic.",
            },
            {
                status: 400,
            }
        );
    }
}