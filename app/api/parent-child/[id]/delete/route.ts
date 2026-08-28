import { getPublicUrl } from "@/lib/getPublicUrl";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const relationshipId = Number(id);
        const formData = await request.formData();
        const returnTo = Number(formData.get("returnTo"));

        const relationship = await prisma.parentChild.findUnique({
            where: {
                id: relationshipId,
            }
        });

        if (!relationship) {
            return Response.json(
                { error: "Parent-child relationship not found" },
                { status: 404 }
            )
        }

        await prisma.parentChild.delete({
            where: {
                id: relationshipId,
            },
        });

        return Response.redirect(
            new URL(
                `/colonists/${returnTo}/edit`,
                getPublicUrl(request)
            )
        );
    } catch (error) {
        console.error("Failed to delete parent-child relationship:", error);

        return Response.json(
            { error: "Failed to delete parent-child relationship" },
            { status: 500 }
        );
    }
}