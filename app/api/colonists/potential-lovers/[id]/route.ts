import { prisma } from "@/lib/prisma";

export async function DELETE(
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

        const result = await prisma.potentialLover.deleteMany({
            where: {
                id: reservationId,
            },
        });

        if (result.count === 0) {
            return Response.json(
                { error: "Reservation not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            reservationId,
        });
    } catch (error) {
        console.error(
            "Failed to remove potential lovers reservation:",
            error
        );

        return Response.json(
            { error: "Failed to remove reservation" },
            { status: 500 }
        );
    }
}