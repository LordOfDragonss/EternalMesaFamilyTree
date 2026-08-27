import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const partnerAId = Number(id);

        const formData = await request.formData();

        const partnerBId = Number(formData.get("partnerId"));

        const type = formData.get("type") as
            | "Lover"
            | "Married"
            | "Ex"

        // Make sure partner A exists
        const partnerA = await prisma.colonist.findUnique({
            where: {
                id: partnerAId,
            },
        });

        if (!partnerA) {
            return Response.json(
                { error: "Partner A not found" },
                { status: 404 }
            );
        }

        // Make sure partner B exists
        const partnerB = await prisma.colonist.findUnique({
            where: {
                id: partnerBId,
            },
        });

        if (!partnerB) {
            return Response.json(
                { error: "Partner B not found" },
                { status: 404 }
            );
        }

        // Prevent a colonist from partnering with themselves
        if (partnerAId === partnerBId) {
            return Response.json(
                {
                    error: "A colonist cannot be their own partner",
                },
                { status: 400 }
            );
        }

        // Prevent duplicate partnerships in either direction
        const existingPartnership =
            await prisma.partnership.findFirst({
                where: {
                    OR: [
                        {
                            partnerAId: partnerAId,
                            partnerBId: partnerBId,
                        },
                        {
                            partnerAId: partnerBId,
                            partnerBId: partnerAId,
                        },
                    ],
                },
            });

        if (existingPartnership) {
            return Response.json(
                {
                    error: "These colonists already have a partnership",
                },
                { status: 409 }
            );
        }

        // Get the current colonist's parents
        const parentRelationships =
            await prisma.parentChild.findMany({
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

        // Get the current colonist's children
        const childRelationships =
            await prisma.parentChild.findMany({
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

        // Prevent parent/child partnerships
        if (
            parentIds.includes(partnerBId) ||
            childIds.includes(partnerBId)
        ) {
            return Response.json(
                {
                    error: "A colonist cannot have a partnership with a parent or child",
                },
                { status: 400 }
            );
        }

        // Find the current colonist's siblings
        const siblingRelationships =
            await prisma.parentChild.findMany({
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

        // Prevent sibling partnerships
        if (siblingIds.includes(partnerBId)) {
            return Response.json(
                {
                    error: "A colonist cannot have a partnership with a sibling",
                },
                { status: 400 }
            );
        }

        // Create the partnership
        await prisma.partnership.create({
            data: {
                partnerAId: partnerAId,
                partnerBId: partnerBId,
                type: type,
            },
        });

        return Response.redirect(
            new URL(
                `/colonists/${partnerAId}/edit`,
                getPublicUrl(request)
            )
        );
    } catch (error) {
        console.error(
            "Failed to create partnership:",
            error
        );

        return Response.json(
            { error: "Failed to create partnership" },
            { status: 500 }
        );
    }
}