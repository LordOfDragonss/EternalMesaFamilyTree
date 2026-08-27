import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const validPassions = [
    "Apathy",
    "None",
    "Interested",
    "Burning",
    "Natural",
    "Critical",
] as const;

type Passion = (typeof validPassions)[number];

type SkillUpdate = {
    skillId: number;
    level: number;
    passion: Passion;
    isKnown: boolean;
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const colonistId = Number(id);

        if (!Number.isInteger(colonistId)) {
            return NextResponse.json(
                {
                    error: "Invalid colonist ID",
                },
                {
                    status: 400,
                }
            );
        }

        const body = await request.json();

        if (!Array.isArray(body.skills)) {
            return NextResponse.json(
                {
                    error: "Skills must be an array.",
                },
                {
                    status: 400,
                }
            );
        }

        const skills: SkillUpdate[] = body.skills.map(
            (skill: {
                skillId: unknown;
                level: unknown;
                passion: unknown;
                isKnown: unknown;
            }) => {
                const skillId = Number(skill.skillId);
                const level = Number(skill.level);
                const passion = skill.passion;
                const isKnown = skill.isKnown;

                if (
                    !Number.isInteger(skillId) ||
                    !Number.isInteger(level) ||
                    level < 0 ||
                    typeof passion !== "string" ||
                    !validPassions.includes(
                        passion as Passion
                    ) ||
                    typeof isKnown !== "boolean"
                ) {
                    throw new Error(
                        "Invalid skill data."
                    );
                }

                return {
                    skillId,
                    level,
                    passion: passion as Passion,
                    isKnown,
                };
            }
        );

        const colonist = await prisma.colonist.findUnique({
            where: {
                id: colonistId,
            },
            select: {
                id: true,
            },
        });

        if (!colonist) {
            return NextResponse.json(
                {
                    error: "Colonist not found.",
                },
                {
                    status: 404,
                }
            );
        }

        await prisma.$transaction(
            skills.map((skill) =>
                prisma.colonistSkill.upsert({
                    where: {
                        colonistId_skillId: {
                            colonistId,
                            skillId: skill.skillId,
                        },
                    },
                    update: {
                        level: skill.level,
                        passion: skill.passion,
                        isKnown: skill.isKnown,
                    },
                    create: {
                        colonistId,
                        skillId: skill.skillId,
                        level: skill.level,
                        passion: skill.passion,
                        isKnown: skill.isKnown,
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Failed to update colonist skills:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update skills.",
            },
            {
                status: 500,
            }
        );
    }
}