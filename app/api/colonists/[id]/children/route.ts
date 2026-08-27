import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const parentId = Number(id);

        const formData = await request.formData();

        const childId = Number(formData.get("childId"));
        const type = formData.get("type") as
            | "Biological"
            | "OvumDonor"
            | "Other";

        // Make sure the parent exists
        const parent = await prisma.colonist.findUnique({
            where: {
                id: parentId,
            },
        });

        if (!parent) {
            return Response.json(
                { error: "Parent not found" },
                { status: 404 }
            );
        }

        // Make sure the child exists
        const child = await prisma.colonist.findUnique({
            where: {
                id: childId,
            },
        });

        if (!child) {
            return Response.json(
                { error: "Child not found" },
                { status: 404 }
            );
        }

        // Prevent someone from making a colonist their own parent
        if (parentId === childId) {
            return Response.json(
                { error: "A colonist cannot be their own parent" },
                { status: 400 }
            );
        }

        // Prevent duplicate parent-child relationships
        const existingRelationship =
            await prisma.parentChild.findUnique({
                where: {
                    parentId_childId: {
                        parentId: parentId,
                        childId: childId,
                    },
                },
            });

        if (existingRelationship) {
            return Response.json(
                { error: "This parent-child relationship already exists" },
                { status: 409 }
            );
        }
        const existingReverseRelationship =
            await prisma.parentChild.findUnique({
                where: {
                    parentId_childId: {
                        parentId: childId,
                        childId: parentId,
                    },
                },
            });

        if (existingReverseRelationship) {
            return Response.json(
                {
                    error: "These colonists already have a parent-child relationship in the opposite direction",
                },
                { status: 409 }
            );
        }

        await prisma.parentChild.create({
            data: {
                parentId: parentId,
                childId: childId,
                type: type,
            },
        });

        return Response.redirect(
            new URL(`/colonists/${parentId}/edit`, request.url)
        );
    } catch (error) {
        console.error(
            "Failed to create parent-child relationship:",
            error
        );

        return Response.json(
            { error: "Failed to create parent-child relationship" },
            { status: 500 }
        );
    }
}