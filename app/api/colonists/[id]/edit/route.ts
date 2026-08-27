import { prisma } from "@/lib/prisma";
import { minio } from "@/lib/minio";
import {
    DeleteObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await params;
        const colonistId = Number(id);

        const formData =
            await request.formData();

        /*
         * ---------------------------------------------------------
         * Existing colonist
         * ---------------------------------------------------------
         */

        const existingColonist =
            await prisma.colonist.findUnique({
                where: {
                    id: colonistId,
                },
                select: {
                    imageURL: true,
                },
            });

        if (!existingColonist) {
            return NextResponse.json(
                {
                    error:
                        "Colonist not found",
                },
                {
                    status: 404,
                }
            );
        }

        /*
         * ---------------------------------------------------------
         * Image
         * ---------------------------------------------------------
         */

        const portrait =
            formData.get("portrait");

        const removePortrait =
            formData.get(
                "removePortrait"
            ) === "true";

        let newImageKey:
            | string
            | null = null;

        if (
            portrait &&
            typeof portrait !==
            "string" &&
            portrait.size > 0
        ) {
            const extension =
                portrait.name
                    .split(".")
                    .pop()
                    ?.toLowerCase() ||
                "webp";

            newImageKey =
                `colonists/${randomUUID()}.${extension}`;

            const buffer =
                Buffer.from(
                    await portrait.arrayBuffer()
                );

            await minio.send(
                new PutObjectCommand({
                    Bucket:
                        process.env.MINIO_BUCKET!,
                    Key: newImageKey,
                    Body: buffer,
                    ContentType:
                        portrait.type ||
                        "application/octet-stream",
                })
            );
        }

        /*
         * ---------------------------------------------------------
         * Legacy
         * ---------------------------------------------------------
         */

        const createLegacy =
            formData.get(
                "createLegacy"
            ) === "true";

        const legacyIdValue =
            formData.get("legacyId");

        const legacyId =
            legacyIdValue
                ? Number(legacyIdValue)
                : null;

        const legacyName =
            (formData.get(
                "legacyName"
            ) as string) || null;

        const legacyColor =
            (formData.get(
                "legacyColor"
            ) as string) || null;

        const legacyDescription =
            (formData.get(
                "legacyDescription"
            ) as string) || null;

        /*
         * ---------------------------------------------------------
         * Expertises
         * ---------------------------------------------------------
         */

        const expertiseIds =
            formData
                .getAll("expertiseId[]")
                .map((value) =>
                    Number(value)
                )
                .filter(
                    (value) =>
                        !Number.isNaN(value)
                );

        const expertiseLevels =
            formData
                .getAll("expertiseLevel[]")
                .map((value) =>
                    Number(value)
                );

        if (
            expertiseIds.length !==
            expertiseLevels.length
        ) {
            throw new Error(
                "Invalid expertise data."
            );
        }

        if (
            expertiseIds.length > 3
        ) {
            throw new Error(
                "A colonist can have a maximum of 3 expertises."
            );
        }

        const uniqueExpertiseIds =
            new Set(expertiseIds);

        if (
            uniqueExpertiseIds.size !==
            expertiseIds.length
        ) {
            throw new Error(
                "An expertise was submitted more than once."
            );
        }

        for (
            const level of expertiseLevels
        ) {
            if (
                !Number.isInteger(
                    level
                ) ||
                level < 1
            ) {
                throw new Error(
                    "Expertise levels must be positive integers."
                );
            }
        }

        /*
         * ---------------------------------------------------------
         * Helpers
         * ---------------------------------------------------------
         */

        const numberOrNull = (
            value: FormDataEntryValue | null
        ) =>
            value
                ? Number(value)
                : null;


        const deathYear =
            numberOrNull(
                formData.get("deathYear")
            );

        const deathMonth =
            numberOrNull(
                formData.get("deathMonth")
            );

        const deathDay =
            numberOrNull(
                formData.get("deathDay")
            );

        const deathDateUnknown =
            formData.get("deathDateUnknown") === "on";

        const isDead =
            deathDateUnknown ||
            deathYear !== null ||
            deathMonth !== null ||
            deathDay !== null;
        /*
         * ---------------------------------------------------------
         * Transaction
         * ---------------------------------------------------------
         */

        const colonist =
            await prisma.$transaction(
                async (tx) => {
                    let newLegacyId:
                        | number
                        | null = null;

                    /*
                     * Create a new legacy if requested.
                     */
                    if (
                        createLegacy
                    ) {
                        if (
                            !legacyName
                        ) {
                            throw new Error(
                                "Legacy name is required when creating a new legacy."
                            );
                        }

                        const legacy =
                            await tx.legacy.create(
                                {
                                    data: {
                                        name:
                                            legacyName,

                                        color:
                                            legacyColor,

                                        description:
                                            legacyDescription,

                                        foundingColonistId:
                                            colonistId,
                                    },
                                }
                            );

                        newLegacyId =
                            legacy.id;
                    }

                    /*
                     * Determine image value.
                     */
                    let imageURL =
                        existingColonist.imageURL;

                    if (
                        newImageKey
                    ) {
                        imageURL =
                            newImageKey;
                    } else if (
                        removePortrait
                    ) {
                        imageURL = null;
                    }

                    /*
                     * Update colonist.
                     */
                    const updatedColonist =
                        await tx.colonist.update(
                            {
                                where: {
                                    id:
                                        colonistId,
                                },

                                data: {
                                    firstName:
                                        formData.get(
                                            "firstName"
                                        ) as string,

                                    nickname:
                                        (formData.get(
                                            "nickname"
                                        ) as string) ||
                                        null,

                                    lastName:
                                        formData.get(
                                            "lastName"
                                        ) as string,

                                    title:
                                        (formData.get(
                                            "title"
                                        ) as string) ||
                                        null,

                                    gender:
                                        formData.get(
                                            "gender"
                                        ) as
                                        | "Male"
                                        | "Female",

                                    birthYear:
                                        numberOrNull(
                                            formData.get(
                                                "birthYear"
                                            )
                                        ),

                                    birthMonth:
                                        numberOrNull(
                                            formData.get(
                                                "birthMonth"
                                            )
                                        ),

                                    birthDay:
                                        numberOrNull(
                                            formData.get(
                                                "birthDay"
                                            )
                                        ),

                                    isDead,
                                    deathYear,
                                    deathMonth,
                                    deathDay,
                                    imageURL,

                                    legacy:
                                        createLegacy
                                            ? {
                                                connect: {
                                                    id:
                                                        newLegacyId!,
                                                },
                                            }
                                            : legacyId !==
                                                null
                                                ? {
                                                    connect: {
                                                        id:
                                                            legacyId,
                                                    },
                                                }
                                                : {
                                                    disconnect:
                                                        true,
                                                },
                                },
                            }
                        );

                    /*
                     * -------------------------------------------------
                     * Expertises
                     * -------------------------------------------------
                     *
                     * Remove the existing expertise relationships.
                     */

                    const colonistSkills =
                        await tx.colonistSkill.findMany(
                            {
                                where: {
                                    colonistId,
                                },
                                select: {
                                    id: true,
                                    skillId:
                                        true,
                                },
                            }
                        );

                    if (
                        colonistSkills.length >
                        0
                    ) {
                        await tx.colonistExpertise.deleteMany(
                            {
                                where: {
                                    colonistSkillId:
                                    {
                                        in:
                                            colonistSkills.map(
                                                (
                                                    skill
                                                ) =>
                                                    skill.id
                                            ),
                                    },
                                },
                            }
                        );
                    }

                    /*
                     * Recreate the submitted expertises.
                     */
                    if (
                        expertiseIds.length >
                        0
                    ) {
                        const existingExpertises =
                            await tx.expertise.findMany(
                                {
                                    where: {
                                        id: {
                                            in:
                                                expertiseIds,
                                        },
                                    },
                                    select: {
                                        id: true,
                                        skillId:
                                            true,
                                    },
                                }
                            );

                        if (
                            existingExpertises.length !==
                            expertiseIds.length
                        ) {
                            throw new Error(
                                "One or more selected expertises do not exist."
                            );
                        }

                        for (
                            let i = 0;
                            i <
                            expertiseIds.length;
                            i++
                        ) {
                            const expertise =
                                existingExpertises.find(
                                    (
                                        item
                                    ) =>
                                        item.id ===
                                        expertiseIds[
                                        i
                                        ]
                                );

                            if (
                                !expertise
                            ) {
                                throw new Error(
                                    "Invalid expertise."
                                );
                            }

                            const colonistSkill =
                                colonistSkills.find(
                                    (
                                        skill
                                    ) =>
                                        skill.skillId ===
                                        expertise.skillId
                                );

                            if (
                                !colonistSkill
                            ) {
                                throw new Error(
                                    `The skill required for expertise ID ${expertise.id} has not been assigned to this colonist.`
                                );
                            }

                            await tx.colonistExpertise.create(
                                {
                                    data: {
                                        colonistSkillId:
                                            colonistSkill.id,

                                        expertiseId:
                                            expertise.id,

                                        level:
                                            expertiseLevels[
                                            i
                                            ],
                                    },
                                }
                            );
                        }
                    }

                    return updatedColonist;
                }
            );

        /*
         * ---------------------------------------------------------
         * Delete old image
         * ---------------------------------------------------------
         */

        if (
            existingColonist.imageURL &&
            (
                newImageKey ||
                removePortrait
            )
        ) {
            await minio.send(
                new DeleteObjectCommand({
                    Bucket:
                        process.env.MINIO_BUCKET!,

                    Key:
                        existingColonist.imageURL,
                })
            );
        }

        /*
         * ---------------------------------------------------------
         * Redirect
         * ---------------------------------------------------------
         */

        const forwardedHost =
            request.headers.get("x-forwarded-host");

        const forwardedProto =
            request.headers.get("x-forwarded-proto");

        const host =
            forwardedHost ??
            request.headers.get("host");

        const protocol =
            forwardedProto ??
            "http";

        return NextResponse.redirect(
            new URL(
                `/colonists/${colonist.id}`,
                `${protocol}://${host}`
            ),
            303
        );
    } catch (error) {
        console.error(
            "Failed to edit colonist:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to edit colonist",
            },
            {
                status: 500,
            }
        );
    }
}