import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    const { id } = await params;
    const colonistId = Number(id);

    if (!Number.isInteger(colonistId)) {
        return NextResponse.json(
            { error: "Invalid colonist ID." },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        if (!Array.isArray(body.expertises)) {
            return NextResponse.json(
                {
                    error:
                        "Expertises must be an array.",
                },
                { status: 400 }
            );
        }

        if (body.expertises.length > 3) {
            return NextResponse.json(
                {
                    error:
                        "A colonist can have a maximum of 3 expertises.",
                },
                { status: 400 }
            );
        }

        const colonist =
            await prisma.colonist.findUnique({
                where: {
                    id: colonistId,
                },
                include: {
                    colonistSkills: true,
                },
            });

        if (!colonist) {
            return NextResponse.json(
                {
                    error: "Colonist not found.",
                },
                { status: 404 }
            );
        }

        // Validate the submitted data first.
        const expertiseIds =
            body.expertises.map(
                (expertise: {
                    expertiseId: unknown;
                    level: unknown;
                }) => expertise.expertiseId
            );

        const uniqueExpertiseIds =
            new Set(expertiseIds);

        if (
            uniqueExpertiseIds.size !==
            expertiseIds.length
        ) {
            return NextResponse.json(
                {
                    error:
                        "An expertise cannot be selected more than once.",
                },
                { status: 400 }
            );
        }

        const expertises =
            await prisma.expertise.findMany({
                where: {
                    id: {
                        in: expertiseIds,
                    },
                },
                include: {
                    skill: true,
                },
            });

        if (
            expertises.length !==
            expertiseIds.length
        ) {
            return NextResponse.json(
                {
                    error:
                        "One or more expertises could not be found.",
                },
                { status: 400 }
            );
        }

        // Make sure every expertise has a valid level.
        for (const submitted of body.expertises) {
            if (
                !Number.isInteger(
                    submitted.level
                ) ||
                submitted.level < 1
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Expertise levels must be whole numbers of at least 1.",
                    },
                    { status: 400 }
                );
            }
        }

        await prisma.$transaction(
            async (tx) => {
                /*
                 * Remove all existing expertises for this
                 * colonist.
                 *
                 * We do this through ColonistSkill because
                 * ColonistExpertise belongs to a ColonistSkill,
                 * not directly to Colonist.
                 */
                await tx.colonistExpertise.deleteMany(
                    {
                        where: {
                            colonistSkill: {
                                colonistId,
                            },
                        },
                    }
                );

                /*
                 * Add the submitted expertises back.
                 *
                 * The important part here is that we find
                 * the ColonistSkill using the expertise's
                 * Skill. The client never supplies the
                 * colonistSkillId.
                 */
                for (const submitted of body.expertises) {
                    const expertise =
                        expertises.find(
                            (item) =>
                                item.id ===
                                submitted.expertiseId
                        );

                    if (!expertise) {
                        throw new Error(
                            `Expertise ${submitted.expertiseId} not found.`
                        );
                    }

                    const colonistSkill =
                        colonist.colonistSkills.find(
                            (skill) =>
                                skill.skillId ===
                                expertise.skillId
                        );

                    if (!colonistSkill) {
                        throw new Error(
                            `Colonist does not have skill "${expertise.skill.name}".`
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
                                    submitted.level,
                            },
                        }
                    );
                }
            }
        );

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Failed to save colonist expertises:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to save expertises.",
            },
            { status: 500 }
        );
    }
}