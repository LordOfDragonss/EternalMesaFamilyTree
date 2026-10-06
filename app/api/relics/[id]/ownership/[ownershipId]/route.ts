import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Props = {
    params: Promise<{
        id: string;
        ownershipId: string;
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

export async function DELETE(
    request: Request,
    { params }: Props
) {
    try {
        const {
            id,
            ownershipId,
        } = await params;

        const relicId = Number(id);
        const ownershipIdNumber =
            Number(ownershipId);

        if (
            !Number.isInteger(
                relicId
            ) ||
            !Number.isInteger(
                ownershipIdNumber
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid relic or ownership ID.",
                },
                { status: 400 }
            );
        }

        const ownership =
            await prisma.relicOwnership.findFirst(
                {
                    where: {
                        id: ownershipIdNumber,
                        relicId,
                    },
                    select: {
                        id: true,
                        order: true,
                    },
                }
            );

        if (!ownership) {
            return NextResponse.json(
                {
                    error:
                        "Ownership record not found.",
                },
                { status: 404 }
            );
        }

        await prisma.$transaction(
            async (tx) => {
                await tx.relicOwnership.delete(
                    {
                        where: {
                            id: ownershipIdNumber,
                        },
                    }
                );

                await tx.relicOwnership.updateMany(
                    {
                        where: {
                            relicId,
                            order: {
                                gt: ownership.order,
                            },
                        },
                        data: {
                            order: {
                                decrement: 1,
                            },
                        },
                    }
                );
            }
        );

        return NextResponse.json({
            success: true,
            ownershipHistory:
                await getOwnershipHistory(
                    relicId
                ),
        });
    } catch (error) {
        console.error(
            "Failed to delete relic ownership:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to remove owner.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: Props
) {
    try {
        const {
            id,
            ownershipId,
        } = await params;

        const relicId = Number(id);
        const ownershipIdNumber =
            Number(ownershipId);

        if (
            !Number.isInteger(
                relicId
            ) ||
            !Number.isInteger(
                ownershipIdNumber
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid relic or ownership ID.",
                },
                { status: 400 }
            );
        }

        const body =
            await request.json();

        const targetOrder =
            Number(body.order);

        if (
            !Number.isInteger(
                targetOrder
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid ownership order.",
                },
                { status: 400 }
            );
        }

        const ownership =
            await prisma.relicOwnership.findFirst(
                {
                    where: {
                        id: ownershipIdNumber,
                        relicId,
                    },
                    select: {
                        id: true,
                        order: true,
                    },
                }
            );

        if (!ownership) {
            return NextResponse.json(
                {
                    error:
                        "Ownership record not found.",
                },
                { status: 404 }
            );
        }

        const ownershipCount =
            await prisma.relicOwnership.count(
                {
                    where: {
                        relicId,
                    },
                }
            );

        if (
            targetOrder < 0 ||
            targetOrder >=
            ownershipCount
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid ownership order.",
                },
                { status: 400 }
            );
        }

        if (
            targetOrder ===
            ownership.order
        ) {
            return NextResponse.json({
                success: true,
                ownershipHistory:
                    await getOwnershipHistory(
                        relicId
                    ),
            });
        }

        await prisma.$transaction(
            async (tx) => {
                if (
                    targetOrder <
                    ownership.order
                ) {
                    await tx.relicOwnership.updateMany(
                        {
                            where: {
                                relicId,
                                order: {
                                    gte: targetOrder,
                                    lt: ownership.order,
                                },
                            },
                            data: {
                                order: {
                                    increment: 1,
                                },
                            },
                        }
                    );
                } else {
                    await tx.relicOwnership.updateMany(
                        {
                            where: {
                                relicId,
                                order: {
                                    gt: ownership.order,
                                    lte: targetOrder,
                                },
                            },
                            data: {
                                order: {
                                    decrement: 1,
                                },
                            },
                        }
                    );
                }

                await tx.relicOwnership.update(
                    {
                        where: {
                            id: ownershipIdNumber,
                        },
                        data: {
                            order: targetOrder,
                        },
                    }
                );
            }
        );

        return NextResponse.json({
            success: true,
            ownershipHistory:
                await getOwnershipHistory(
                    relicId
                ),
        });
    } catch (error) {
        console.error(
            "Failed to reorder relic ownership:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to reorder owner.",
            },
            { status: 500 }
        );
    }
}