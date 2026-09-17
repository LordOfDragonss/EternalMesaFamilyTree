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
    request: Request
) {
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
                "/locations",
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
                "/locations",
                getPublicUrl(request)
            )
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

    const imageFiles = formData
        .getAll("locationImages")
        .filter(
            (value): value is File =>
                value instanceof File &&
                value.size > 0
        );

    const imageCaptions = formData
        .getAll("newImageCaptions[]")
        .map((value) => String(value));

    const uploadedImages = [];

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
                imageCaptions[index]?.trim() ||
                null,
            order: uploadedImages.length,
        });
    }

    const location =
        await prisma.location.create({
            data: {
                name: name.trim(),
                type,
                description:
                    typeof description ===
                        "string" &&
                        description.trim()
                        ? description.trim()
                        : null,

                previousNames: {
                    create:
                        previousNames.map(
                            (
                                previousName,
                                index
                            ) => ({
                                name:
                                    previousName,
                                order:
                                    index,
                            })
                        ),
                },

                colonists: {
                    connect: colonistIds.map(
                        (id) => ({
                            id,
                        })
                    ),
                },

                legacies: {
                    connect: legacyIds.map(
                        (id) => ({
                            id,
                        })
                    ),
                },

                images: {
                    create: uploadedImages,
                },
            },
        });

    return NextResponse.redirect(
        new URL(
            `/locations/${location.id}`,
            getPublicUrl(request)
        ),
        303
    );
}