import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const firstId = Number(body.colonistAId);
        const secondId = Number(body.colonistBId);

        if (
            !Number.isInteger(firstId) ||
            !Number.isInteger(secondId) ||
            firstId <= 0 ||
            secondId <= 0
        ) {
            return Response.json(
                { error: "Invalid colonist IDs" },
                { status: 400 }
            );
        }

        if (firstId === secondId) {
            return Response.json(
                { error: "A colonist cannot be reserved with themselves" },
                { status: 400 }
            );
        }

        // Always store the pair in a consistent order.
        const colonistAId = Math.min(firstId, secondId);
        const colonistBId = Math.max(firstId, secondId);

        const result = await prisma.$transaction(async (tx) => {
            const colonists = await tx.colonist.findMany({
                where: {
                    id: {
                        in: [colonistAId, colonistBId],
                    },
                },
                select: {
                    id: true,
                    isDead: true,

                    partnerARelationships: {
                        where: {
                            type: {
                                in: ["Lover", "Married"],
                            },
                        },
                        select: {
                            id: true,
                        },
                    },

                    partnerBRelationships: {
                        where: {
                            type: {
                                in: ["Lover", "Married"],
                            },
                        },
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (colonists.length !== 2) {
                return {
                    error: "One or both colonists could not be found",
                    status: 404,
                };
            }

            for (const colonist of colonists) {
                if (colonist.isDead) {
                    return {
                        error: "Deceased colonists cannot be reserved",
                        status: 400,
                    };
                }

                if (
                    colonist.partnerARelationships.length > 0 ||
                    colonist.partnerBRelationships.length > 0
                ) {
                    return {
                        error: "Both colonists must be currently unpartnered",
                        status: 409,
                    };
                }
            }

            // A colonist can only belong to one active reservation.
            const existingReservation =
                await tx.potentialLover.findFirst({
                    where: {
                        OR: [
                            { colonistAId },
                            { colonistBId },
                        ],
                    },
                });

            if (existingReservation) {
                return {
                    error: "One or both colonists already have a reservation",
                    status: 409,
                };
            }

            const reservation = await tx.potentialLover.create({
                data: {
                    colonistAId,
                    colonistBId,
                },
            });

            return {
                success: true,
                reservation,
            };
        });

        if ("error" in result) {
            return Response.json(
                { error: result.error },
                { status: result.status }
            );
        }

        return Response.json(result);
    } catch (error) {
        console.error(
            "Failed to create potential lovers reservation:",
            error
        );

        return Response.json(
            { error: "Failed to create reservation" },
            { status: 500 }
        );
    }
}