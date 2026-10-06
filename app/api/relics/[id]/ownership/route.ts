import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

async function getOwnershipHistory(
    relicId: number
) {
    return prisma.relicOwnership.findMany({
        where: {
            relicId,
        },
        include: {
            colonist: {
                select: {
                    id: true,
                    firstName: true,
                    nickname: true,
                    lastName: true,
                    legacy: {
                        select: {
                            color: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            order: "asc",
        },
    });
}

export async function POST(
    request: Request,
    { params }: Props
) {
    try {
        const { id } = await params;

        const relicId = Number(id);

        if (!Number.isInteger(relicId)) {
            return NextResponse.json(
                {
                    error: "Invalid relic ID.",
                },
                { status: 400 }
            );
        }

        const body =
            await request.json();

        const colonistId =
            Number(body.colonistId);

        if (
            !Number.isInteger(
                colonistId
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid colonist.",
                },
                { status: 400 }
            );
        }

        const relic =
            await prisma.relic.findUnique({
                where: {
                    id: relicId,
                },
                select: {
                    id: true,
                    ownerId: true,
                },
            });

        if (!relic) {
            return NextResponse.json(
                {
                    error:
                        "Relic not found.",
                },
                { status: 404 }
            );
        }

        const colonist =
            await prisma.colonist.findUnique({
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
                    error:
                        "Colonist not found.",
                },
                { status: 404 }
            );
        }

        if (
            relic.ownerId ===
            colonistId
        ) {
            return NextResponse.json(
                {
                    error:
                        "The current owner cannot also be a previous owner.",
                },
                { status: 400 }
            );
        }

        const existingOwnership =
            await prisma.relicOwnership.findFirst(
                {
                    where: {
                        relicId,
                        colonistId,
                    },
                    select: {
                        id: true,
                    },
                }
            );

        if (existingOwnership) {
            return NextResponse.json(
                {
                    error:
                        "This colonist is already in the ownership history.",
                },
                { status: 400 }
            );
        }

        const highestOwnership =
            await prisma.relicOwnership.findFirst(
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
            (highestOwnership?.order ??
                -1) + 1;

        await prisma.relicOwnership.create({
            data: {
                relicId,
                colonistId,
                order: nextOrder,
            },
        });

        return NextResponse.json({
            success: true,
            ownershipHistory:
                await getOwnershipHistory(
                    relicId
                ),
        });
    } catch (error) {
        console.error(
            "Failed to add relic ownership:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to add previous owner.",
            },
            { status: 500 }
        );
    }
}