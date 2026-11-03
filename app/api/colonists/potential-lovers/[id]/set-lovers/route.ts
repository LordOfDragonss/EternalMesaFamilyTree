import { prisma } from "@/lib/prisma";

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const reservationId = Number(id);

        if (
            !Number.isInteger(reservationId) ||
            reservationId <= 0
        ) {
            return Response.json(
                { error: "Invalid reservation ID" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const reservation =
                await tx.potentialLover.findUnique({
                    where: {
                        id: reservationId,
                    },
                });

            if (!reservation) {
                return {
                    error: "Reservation not found",
                    status: 404,
                };
            }

            const partnerAId = reservation.colonistAId;
            const partnerBId = reservation.colonistBId;

            const colonists = await tx.colonist.findMany({
                where: {
                    id: {
                        in: [partnerAId, partnerBId],
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

            if (
                colonists.length !== 2 ||
                colonists.some(
                    (colonist) =>
                        colonist.isDead ||
                        colonist.partnerARelationships.length > 0 ||
                        colonist.partnerBRelationships.length > 0
                )
            ) {
                return {
                    error: "Both colonists must still be unpartnered",
                    status: 409,
                };
            }

            // Prevent duplicate partnerships in either direction.
            const existingPartnership =
                await tx.partnership.findFirst({
                    where: {
                        OR: [
                            {
                                partnerAId,
                                partnerBId,
                            },
                            {
                                partnerAId: partnerBId,
                                partnerBId: partnerAId,
                            },
                        ],
                    },
                });

            if (existingPartnership) {
                return {
                    error: "These colonists already have a partnership",
                    status: 409,
                };
            }

            // Get partner A's parents.
            const parentRelationships =
                await tx.parentChild.findMany({
                    where: {
                        childId: partnerAId,
                    },
                    select: {
                        parentId: true,
                    },
                });

            const parentIds = parentRelationships.map(
                (relationship) => relationship.parentId
            );

            // Get partner A's children.
            const childRelationships =
                await tx.parentChild.findMany({
                    where: {
                        parentId: partnerAId,
                    },
                    select: {
                        childId: true,
                    },
                });

            const childIds = childRelationships.map(
                (relationship) => relationship.childId
            );

            // Prevent parent/child partnerships.
            if (
                parentIds.includes(partnerBId) ||
                childIds.includes(partnerBId)
            ) {
                return {
                    error: "A colonist cannot have a partnership with a parent or child",
                    status: 400,
                };
            }

            // Find partner A's siblings.
            const siblingRelationships =
                await tx.parentChild.findMany({
                    where: {
                        parentId: {
                            in: parentIds,
                        },
                        childId: {
                            not: partnerAId,
                        },
                    },
                    select: {
                        childId: true,
                    },
                });

            const siblingIds = siblingRelationships.map(
                (relationship) => relationship.childId
            );

            // Prevent sibling partnerships.
            if (siblingIds.includes(partnerBId)) {
                return {
                    error: "A colonist cannot have a partnership with a sibling",
                    status: 400,
                };
            }

            // Create the actual Lover relationship.
            const partnership = await tx.partnership.create({
                data: {
                    partnerAId,
                    partnerBId,
                    type: "Lover",
                },
            });

            // Remove the reservation only after creating the partnership.
            await tx.potentialLover.delete({
                where: {
                    id: reservationId,
                },
            });

            return {
                success: true,
                partnership,
                partnerAId,
                partnerBId,
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
            "Failed to convert potential lovers reservation:",
            error
        );

        return Response.json(
            { error: "Failed to convert reservation into Lovers" },
            { status: 500 }
        );
    }
}