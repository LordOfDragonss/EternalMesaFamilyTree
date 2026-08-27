import { prisma } from "@/lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { minio } from "@/lib/minio";

const validGenders = ["Male", "Female"] as const;
type Gender = (typeof validGenders)[number];

const validParentChildTypes = [
    "Biological",
    "OvumDonor",
    "Other",
] as const;
type ParentChildType =
    (typeof validParentChildTypes)[number];

const validPartnershipTypes = [
    "Lover",
    "Married",
    "Ex",
] as const;
type PartnershipType =
    (typeof validPartnershipTypes)[number];

const validPassions = [
    "Apathy",
    "None",
    "Interested",
    "Burning",
    "Natural",
    "Critical",
] as const;
type Passion = (typeof validPassions)[number];

function parseNullableNumber(
    value: FormDataEntryValue | null
): number | null {
    if (value === null || value === "") {
        return null;
    }

    const number = Number(value);

    if (!Number.isInteger(number)) {
        throw new Error("Invalid number provided.");
    }

    return number;
}

function parseOptionalDay(
    value: FormDataEntryValue | null,
    fieldName: string
): number | null {
    const number = parseNullableNumber(value);

    if (number === null) {
        return null;
    }

    if (number < 1 || number > 15) {
        throw new Error(
            `${fieldName} must be between 1 and 15.`
        );
    }

    return number;
}

function parseOptionalMonth(
    value: FormDataEntryValue | null,
    fieldName: string
): number | null {
    const number = parseNullableNumber(value);

    if (number === null) {
        return null;
    }

    if (number < 1 || number > 4) {
        throw new Error(
            `${fieldName} must be between 1 and 4.`
        );
    }

    return number;
}

function parseOptionalYear(
    value: FormDataEntryValue | null,
    fieldName: string
): number | null {
    const number = parseNullableNumber(value);

    if (number === null) {
        return null;
    }

    if (number < 0) {
        throw new Error(
            `${fieldName} cannot be negative.`
        );
    }

    return number;
}

function isValidValue<T extends readonly string[]>(
    values: T,
    value: string
): value is T[number] {
    return values.includes(value);
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        /*
         * ---------------------------------------------------------
         * Basic colonist information
         * ---------------------------------------------------------
         */

        const firstName =
            String(
                formData.get("firstName") ?? ""
            ).trim();

        const nicknameValue =
            String(
                formData.get("nickname") ?? ""
            ).trim();

        const nickname =
            nicknameValue || null;

        const lastName =
            String(
                formData.get("lastName") ?? ""
            ).trim();

        const titleValue =
            String(
                formData.get("title") ?? ""
            ).trim();

        const title =
            titleValue || null;

        const genderValue =
            String(
                formData.get("gender") ?? ""
            );

        if (!firstName) {
            throw new Error(
                "First name is required."
            );
        }

        if (!lastName) {
            throw new Error(
                "Last name is required."
            );
        }

        if (
            !isValidValue(
                validGenders,
                genderValue
            )
        ) {
            throw new Error(
                "Invalid gender."
            );
        }

        const gender: Gender =
            genderValue;

        /*
         * ---------------------------------------------------------
         * Birth / death dates
         * ---------------------------------------------------------
         */

        const birthDay =
            parseOptionalDay(
                formData.get("birthDay"),
                "Birth day"
            );

        const birthMonth =
            parseOptionalMonth(
                formData.get("birthMonth"),
                "Birth month"
            );

        const birthYear =
            parseOptionalYear(
                formData.get("birthYear"),
                "Birth year"
            );

        const deathDay =
            parseOptionalDay(
                formData.get("deathDay"),
                "Death day"
            );

        const deathMonth =
            parseOptionalMonth(
                formData.get("deathMonth"),
                "Death month"
            );

        const deathYear =
            parseOptionalYear(
                formData.get("deathYear"),
                "Death year"
            );

        const deathDateUnknown =
            formData.get("deathDateUnknown") === "on";

        const isDead =
            deathDateUnknown ||
            deathDay !== null ||
            deathMonth !== null ||
            deathYear !== null;

        /*
         * ---------------------------------------------------------
         * Legacy
         * ---------------------------------------------------------
         */

        const legacyIdValue =
            formData.get("legacyId");

        let legacyId: number | null =
            null;

        if (
            legacyIdValue !== null &&
            legacyIdValue !== ""
        ) {
            legacyId =
                Number(legacyIdValue);

            if (
                !Number.isInteger(
                    legacyId
                )
            ) {
                throw new Error(
                    "Invalid legacy."
                );
            }
        }

        const createLegacy =
            formData.get(
                "createLegacy"
            ) === "true";

        const legacyNameValue =
            String(
                formData.get(
                    "legacyName"
                ) ?? ""
            ).trim();

        const legacyName =
            legacyNameValue || null;

        const legacyDescriptionValue =
            String(
                formData.get(
                    "legacyDescription"
                ) ?? ""
            ).trim();

        const legacyDescription =
            legacyDescriptionValue ||
            null;

        const legacyColorValue =
            String(
                formData.get(
                    "legacyColor"
                ) ?? ""
            ).trim();

        const legacyColor =
            legacyColorValue || null;

        if (
            createLegacy &&
            !legacyName
        ) {
            throw new Error(
                "Legacy name is required when creating a new legacy."
            );
        }

        if (
            createLegacy &&
            legacyId !== null
        ) {
            throw new Error(
                "Cannot select an existing legacy while creating a new legacy."
            );
        }

        /*
         * ---------------------------------------------------------
         * Skills
         * ---------------------------------------------------------
         */

        const skillIds =
            formData
                .getAll("skillId[]")
                .map((value) =>
                    Number(value)
                )
                .filter(
                    (value) =>
                        !Number.isNaN(value)
                );

        const skillLevels =
            formData
                .getAll("skillLevel[]")
                .map((value) =>
                    Number(value)
                );

        const skillPassions =
            formData
                .getAll("skillPassion[]")
                .map((value) =>
                    String(value)
                );

        const skillKnown =
            formData
                .getAll("skillIsKnown[]")
                .map(
                    (value) =>
                        value === "true"
                );

        if (
            skillLevels.length !==
            skillIds.length ||
            skillPassions.length !==
            skillIds.length ||
            skillKnown.length !==
            skillIds.length
        ) {
            throw new Error(
                "Invalid skill data."
            );
        }

        const uniqueSkillIds =
            new Set(skillIds);

        if (
            uniqueSkillIds.size !==
            skillIds.length
        ) {
            throw new Error(
                "A skill was submitted more than once."
            );
        }

        for (
            let i = 0;
            i < skillIds.length;
            i++
        ) {
            const level =
                skillLevels[i];

            const passion =
                skillPassions[i];

            if (
                !Number.isInteger(
                    level
                ) ||
                level < 0
            ) {
                throw new Error(
                    "Skill levels must be non-negative integers."
                );
            }

            if (
                !isValidValue(
                    validPassions,
                    passion
                )
            ) {
                throw new Error(
                    "Invalid skill passion."
                );
            }
        }

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
         * Traits
         * ---------------------------------------------------------
         */

        const traitIds =
            formData
                .getAll("traitId[]")
                .map((value) =>
                    Number(value)
                )
                .filter(
                    (value) =>
                        !Number.isNaN(value)
                );

        const uniqueTraitIds =
            new Set(traitIds);

        if (
            uniqueTraitIds.size !==
            traitIds.length
        ) {
            throw new Error(
                "A trait was submitted more than once."
            );
        }

        /*
         * ---------------------------------------------------------
         * Relationships
         * ---------------------------------------------------------
         */

        const parentIds =
            formData
                .getAll("parentId[]")
                .map((value) =>
                    Number(value)
                )
                .filter(
                    (value) =>
                        !Number.isNaN(value)
                );

        const parentTypes =
            formData
                .getAll("parentType[]")
                .map((value) =>
                    String(value)
                );

        const childIds =
            formData
                .getAll("childId[]")
                .map((value) =>
                    Number(value)
                )
                .filter(
                    (value) =>
                        !Number.isNaN(value)
                );

        const childTypes =
            formData
                .getAll("childType[]")
                .map((value) =>
                    String(value)
                );

        const partnerIds =
            formData
                .getAll("partnerId[]")
                .map((value) =>
                    Number(value)
                )
                .filter(
                    (value) =>
                        !Number.isNaN(value)
                );

        const partnerTypes =
            formData
                .getAll("partnerType[]")
                .map((value) =>
                    String(value)
                );

        if (
            parentIds.length !==
            parentTypes.length
        ) {
            throw new Error(
                "Invalid parent relationship data."
            );
        }

        if (
            childIds.length !==
            childTypes.length
        ) {
            throw new Error(
                "Invalid child relationship data."
            );
        }

        if (
            partnerIds.length !==
            partnerTypes.length
        ) {
            throw new Error(
                "Invalid partnership data."
            );
        }

        for (
            const type of parentTypes
        ) {
            if (
                !isValidValue(
                    validParentChildTypes,
                    type
                )
            ) {
                throw new Error(
                    "Invalid parent relationship type."
                );
            }
        }

        for (
            const type of childTypes
        ) {
            if (
                !isValidValue(
                    validParentChildTypes,
                    type
                )
            ) {
                throw new Error(
                    "Invalid child relationship type."
                );
            }
        }

        for (
            const type of partnerTypes
        ) {
            if (
                !isValidValue(
                    validPartnershipTypes,
                    type
                )
            ) {
                throw new Error(
                    "Invalid partnership type."
                );
            }
        }

        /*
         * ---------------------------------------------------------
         * Create everything in one transaction
         * ---------------------------------------------------------
         */

        const colonist =
            await prisma.$transaction(
                async (tx) => {
                    /*
                     * Validate selected legacy.
                     */

                    if (
                        legacyId !== null
                    ) {
                        const legacy =
                            await tx.legacy.findUnique(
                                {
                                    where: {
                                        id: legacyId,
                                    },
                                    select: {
                                        id: true,
                                    },
                                }
                            );

                        if (!legacy) {
                            throw new Error(
                                "Selected legacy does not exist."
                            );
                        }
                    }

                    /*
                     * Validate new legacy.
                     */

                    if (
                        createLegacy &&
                        legacyName
                    ) {
                        const existingLegacy =
                            await tx.legacy.findUnique(
                                {
                                    where: {
                                        name: legacyName,
                                    },
                                    select: {
                                        id: true,
                                    },
                                }
                            );

                        if (
                            existingLegacy
                        ) {
                            throw new Error(
                                `A legacy named "${legacyName}" already exists.`
                            );
                        }
                    }

                    /*
                     * Validate relationships.
                     */

                    const relationshipColonistIds =
                        [
                            ...parentIds,
                            ...childIds,
                            ...partnerIds,
                        ];

                    const uniqueRelationshipIds =
                        new Set(
                            relationshipColonistIds
                        );

                    if (
                        uniqueRelationshipIds.size !==
                        relationshipColonistIds.length
                    ) {
                        throw new Error(
                            "The same colonist cannot be used in multiple relationship entries."
                        );
                    }

                    if (
                        relationshipColonistIds.length >
                        0
                    ) {
                        const existingColonists =
                            await tx.colonist.findMany(
                                {
                                    where: {
                                        id: {
                                            in:
                                                relationshipColonistIds,
                                        },
                                    },
                                    select: {
                                        id: true,
                                    },
                                }
                            );

                        const existingIds =
                            new Set(
                                existingColonists.map(
                                    (colonist) =>
                                        colonist.id
                                )
                            );

                        for (
                            const id of
                            relationshipColonistIds
                        ) {
                            if (
                                !existingIds.has(
                                    id
                                )
                            ) {
                                throw new Error(
                                    `Colonist with ID ${id} does not exist.`
                                );
                            }
                        }
                    }

                    /*
                     * Validate traits.
                     */

                    if (
                        traitIds.length > 0
                    ) {
                        const existingTraits =
                            await tx.trait.findMany(
                                {
                                    where: {
                                        id: {
                                            in:
                                                traitIds,
                                        },
                                    },
                                    select: {
                                        id: true,
                                    },
                                }
                            );

                        if (
                            existingTraits.length !==
                            traitIds.length
                        ) {
                            throw new Error(
                                "One or more selected traits do not exist."
                            );
                        }
                    }

                    /*
                     * Create colonist.
                     */

                    const newColonist =
                        await tx.colonist.create({
                            data: {
                                firstName,
                                nickname,
                                lastName,
                                title,
                                gender,

                                birthYear,
                                birthMonth,
                                birthDay,

                                isDead,
                                deathYear,
                                deathMonth,
                                deathDay,

                                imageURL: null,

                                ...(legacyId !==
                                    null
                                    ? {
                                        legacy: {
                                            connect: {
                                                id:
                                                    legacyId,
                                            },
                                        },
                                    }
                                    : {}),
                            },
                        });

                    /*
                     * -------------------------------------------------
                     * Skills
                     * -------------------------------------------------
                     *
                     * Every colonist gets a ColonistSkill record for
                     * every predefined skill.
                     *
                     * Skills submitted by the form use the values
                     * entered by the user.
                     *
                     * Skills not submitted use:
                     *   level: 0
                     *   passion: None
                     *   isKnown: false
                     */

                    const allSkills =
                        await tx.skill.findMany(
                            {
                                select: {
                                    id: true,
                                },
                            }
                        );

                    const submittedSkills =
                        new Map<
                            number,
                            {
                                level: number;
                                passion: Passion;
                                isKnown: boolean;
                            }
                        >();

                    for (
                        let i = 0;
                        i < skillIds.length;
                        i++
                    ) {
                        submittedSkills.set(
                            skillIds[i],
                            {
                                level:
                                    skillLevels[i],

                                passion:
                                    skillPassions[
                                    i
                                    ] as Passion,

                                isKnown:
                                    skillKnown[
                                    i
                                    ],
                            }
                        );
                    }

                    for (
                        const skill of allSkills
                    ) {
                        const submitted =
                            submittedSkills.get(
                                skill.id
                            );

                        await tx.colonistSkill.create(
                            {
                                data: {
                                    colonistId:
                                        newColonist.id,

                                    skillId:
                                        skill.id,

                                    level:
                                        submitted?.level ??
                                        0,

                                    passion:
                                        submitted?.passion ??
                                        "None",

                                    isKnown:
                                        submitted?.isKnown ??
                                        false,
                                },
                            }
                        );
                    }

                    /*
                     * -------------------------------------------------
                     * Expertises
                     * -------------------------------------------------
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
                                        skillId: true,
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
                                    (item) =>
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
                                await tx.colonistSkill.findUnique(
                                    {
                                        where: {
                                            colonistId_skillId:
                                            {
                                                colonistId:
                                                    newColonist.id,

                                                skillId:
                                                    expertise.skillId,
                                            },
                                        },
                                        select: {
                                            id: true,
                                        },
                                    }
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

                    /*
                     * -------------------------------------------------
                     * Traits
                     * -------------------------------------------------
                     */

                    if (
                        traitIds.length > 0
                    ) {
                        await tx.colonistTrait.createMany(
                            {
                                data:
                                    traitIds.map(
                                        (traitId) => ({
                                            colonistId:
                                                newColonist.id,

                                            traitId,
                                        })
                                    ),
                            }
                        );
                    }

                    /*
                     * -------------------------------------------------
                     * New legacy
                     * -------------------------------------------------
                     */

                    if (
                        createLegacy &&
                        legacyName
                    ) {
                        await tx.legacy.create(
                            {
                                data: {
                                    name:
                                        legacyName,

                                    description:
                                        legacyDescription,

                                    color:
                                        legacyColor,

                                    members: {
                                        connect: {
                                            id:
                                                newColonist.id,
                                        },
                                    },

                                    foundingColonist: {
                                        connect: {
                                            id:
                                                newColonist.id,
                                        },
                                    },
                                },
                            }
                        );
                    }

                    /*
                     * -------------------------------------------------
                     * Parents
                     * -------------------------------------------------
                     */

                    for (
                        let i = 0;
                        i <
                        parentIds.length;
                        i++
                    ) {
                        await tx.parentChild.create(
                            {
                                data: {
                                    parentId:
                                        parentIds[
                                        i
                                        ],

                                    childId:
                                        newColonist.id,

                                    type:
                                        parentTypes[
                                        i
                                        ] as ParentChildType,
                                },
                            }
                        );
                    }

                    /*
                     * -------------------------------------------------
                     * Children
                     * -------------------------------------------------
                     */

                    for (
                        let i = 0;
                        i <
                        childIds.length;
                        i++
                    ) {
                        await tx.parentChild.create(
                            {
                                data: {
                                    parentId:
                                        newColonist.id,

                                    childId:
                                        childIds[
                                        i
                                        ],

                                    type:
                                        childTypes[
                                        i
                                        ] as ParentChildType,
                                },
                            }
                        );
                    }

                    /*
                     * -------------------------------------------------
                     * Partnerships
                     * -------------------------------------------------
                     */

                    for (
                        let i = 0;
                        i <
                        partnerIds.length;
                        i++
                    ) {
                        await tx.partnership.create(
                            {
                                data: {
                                    partnerAId:
                                        newColonist.id,

                                    partnerBId:
                                        partnerIds[
                                        i
                                        ],

                                    type:
                                        partnerTypes[
                                        i
                                        ] as PartnershipType,
                                },
                            }
                        );
                    }

                    return newColonist;
                }
            );

        /*
         * ---------------------------------------------------------
         * Upload portrait
         * ---------------------------------------------------------
         */

        const portrait =
            formData.get("portrait");

        if (
            portrait instanceof File &&
            portrait.size > 0
        ) {
            const extension =
                portrait.name
                    .split(".")
                    .pop() ||
                "webp";

            const objectKey =
                `colonists/${randomUUID()}.${extension}`;

            const buffer =
                Buffer.from(
                    await portrait.arrayBuffer()
                );

            await minio.send(
                new PutObjectCommand({
                    Bucket:
                        process.env.MINIO_BUCKET,
                    Key: objectKey,
                    Body: buffer,
                    ContentType:
                        portrait.type,
                })
            );

            await prisma.colonist.update({
                where: {
                    id: colonist.id,
                },
                data: {
                    imageURL:
                        objectKey,
                },
            });
        }

        /*
         * ---------------------------------------------------------
         * Redirect
         * ---------------------------------------------------------
         */

        return NextResponse.redirect(
            new URL(
                `/colonists/${colonist.id}`,
                request.url
            ),
            303
        );
    } catch (error) {
        console.error(
            "Failed to create colonist:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create colonist.",
            },
            {
                status: 400,
            }
        );
    }
}